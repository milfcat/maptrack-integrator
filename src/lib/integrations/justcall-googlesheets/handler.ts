import type {
  IntegrationHandler,
  DecryptedCredentials,
  WebhookValidationResult,
  EnrichedData,
  FieldMapping,
  TransformedData,
  PushResult,
} from '@/lib/engine/types';
import { getCallTranscript, getContact } from '@/lib/services/justcall';
import { appendRow } from '@/lib/services/googlesheets';
import { applyFieldMappings } from '@/lib/integrations/smartlead-justcall/transformer';
import type { JustCallAIReportWebhook } from './types';

const SHEET_COLUMNS = [
  'date',
  'first_name',
  'last_name',
  'phone',
  'email',
  'call_summary',
];

export const justcallGooglesheetsHandler: IntegrationHandler = {
  slug: 'justcall-googlesheets',
  sourceService: 'justcall',
  destinationService: 'googlesheets',

  validateWebhook(
    payload: unknown,
    _headers: Record<string, string>,
    _credentials: DecryptedCredentials
  ): WebhookValidationResult {
    const data = payload as JustCallAIReportWebhook;

    if (!data.call_id) {
      return { valid: false, error: 'Missing call_id in webhook payload' };
    }

    return {
      valid: true,
      eventType: data.event ?? 'call_ai_report_generated',
      deduplicationKey: `justcall-ai-report-${data.call_id}`,
    };
  },

  async enrich(
    payload: unknown,
    credentials: DecryptedCredentials
  ): Promise<EnrichedData> {
    const data = payload as JustCallAIReportWebhook;
    const apiKey = credentials.api_key;
    const apiSecret = credentials.api_secret;

    if (!apiKey || !apiSecret) {
      throw new Error('JustCall API key or secret not configured');
    }

    // Fetch transcript and summary
    const transcript = await getCallTranscript(data.call_id!, apiKey, apiSecret);

    // Try to fetch contact details if contact_id is available
    let firstName = data.firstname ?? '';
    let lastName = data.lastname ?? '';
    let email = data.email ?? '';
    let phone = data.phone_number ?? '';

    if (data.contact_id) {
      try {
        const contact = await getContact(data.contact_id, apiKey, apiSecret);
        if (contact.data) {
          firstName = contact.data.firstname ?? firstName;
          lastName = contact.data.lastname ?? lastName;
          email = contact.data.email ?? email;
          phone = contact.data.phone ?? phone;
        }
      } catch {
        // Fall back to webhook payload contact info
      }
    }

    // Use caller/client number from transcript if phone still missing
    if (!phone && transcript.data) {
      phone = transcript.data.caller_number ?? transcript.data.client_number ?? '';
    }

    return {
      original: data as unknown as Record<string, unknown>,
      enriched: {
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        call_summary: transcript.data?.call_summary ?? '',
        call_date: data.timestamp ?? new Date().toISOString(),
      },
    };
  },

  transform(
    enrichedData: EnrichedData,
    fieldMappingList: FieldMapping[]
  ): TransformedData {
    if (fieldMappingList.length > 0) {
      return applyFieldMappings(enrichedData.enriched, fieldMappingList);
    }

    const data = enrichedData.enriched;
    const date = typeof data.call_date === 'string'
      ? data.call_date
      : new Date().toISOString();

    return {
      date,
      first_name: data.first_name ?? '',
      last_name: data.last_name ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      call_summary: data.call_summary ?? '',
      _sheetRow: [
        date,
        String(data.first_name ?? ''),
        String(data.last_name ?? ''),
        String(data.phone ?? ''),
        String(data.email ?? ''),
        String(data.call_summary ?? ''),
      ],
      _headers: SHEET_COLUMNS,
    };
  },

  async push(
    transformedData: TransformedData,
    credentials: DecryptedCredentials,
    destinationConfig: Record<string, unknown>
  ): Promise<PushResult> {
    const serviceAccountJson = credentials.service_account_json;
    if (!serviceAccountJson) {
      return {
        success: false,
        error: 'Google service account JSON not configured',
      };
    }

    const spreadsheetId = destinationConfig.spreadsheet_id as string;
    if (!spreadsheetId) {
      return {
        success: false,
        error: 'Spreadsheet ID not configured',
      };
    }

    const sheetName = (destinationConfig.sheet_name as string) || 'Sheet1';

    // Build row from _sheetRow if available, otherwise from column order
    const row = (transformedData._sheetRow as string[]) ??
      SHEET_COLUMNS.map((col) => String(transformedData[col] ?? ''));

    try {
      const result = await appendRow(serviceAccountJson, spreadsheetId, sheetName, row);

      return {
        success: true,
        responseStatus: 200,
        responseBody: result as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message,
      };
    }
  },
};
