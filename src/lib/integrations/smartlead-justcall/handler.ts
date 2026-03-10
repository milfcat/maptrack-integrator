import type {
  IntegrationHandler,
  DecryptedCredentials,
  WebhookValidationResult,
  EnrichedData,
  FieldMapping,
  TransformedData,
  PushResult,
} from '@/lib/engine/types';
import { getLeadById } from '@/lib/services/smartlead';
import { createContact } from '@/lib/services/justcall';
import { applyFieldMappings } from './transformer';
import type { SmartLeadEmailSentWebhook } from './types';

export const smartleadJustcallHandler: IntegrationHandler = {
  slug: 'smartlead-justcall',
  sourceService: 'smartlead',
  destinationService: 'justcall',

  validateWebhook(
    payload: unknown,
    _headers: Record<string, string>,
    credentials: DecryptedCredentials
  ): WebhookValidationResult {
    const data = payload as SmartLeadEmailSentWebhook;

    // Validate event type
    if (data.event_type !== 'EMAIL_SENT') {
      return {
        valid: false,
        error: `Unsupported event type: ${data.event_type}`,
      };
    }

    // Validate secret key if configured
    const webhookSecret = credentials.webhook_secret;
    if (webhookSecret && data.secret_key !== webhookSecret) {
      return { valid: false, error: 'Invalid webhook secret' };
    }

    // Validate required fields
    if (!data.sl_email_lead_id) {
      return { valid: false, error: 'Missing sl_email_lead_id' };
    }

    return {
      valid: true,
      eventType: data.event_type,
      deduplicationKey: `${data.sl_email_lead_id}-${data.campaign_id}-${data.event_timestamp || data.time_sent}`,
    };
  },

  async enrich(
    payload: unknown,
    credentials: DecryptedCredentials
  ): Promise<EnrichedData> {
    const data = payload as SmartLeadEmailSentWebhook;
    const apiKey = credentials.api_key;

    if (!apiKey) {
      throw new Error('SmartLead API key not configured');
    }

    const lead = await getLeadById(data.sl_email_lead_id, apiKey);

    return {
      original: data as unknown as Record<string, unknown>,
      enriched: {
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email || data.to_email,
        phone_number: lead.phone_number,
        company_name: lead.company_name,
        website: lead.website,
        location: lead.location,
        linkedin_profile: lead.linkedin_profile,
        custom_fields: lead.custom_fields,
        campaign_name: data.campaign_name,
        campaign_id: data.campaign_id,
        event_timestamp: data.event_timestamp || data.time_sent,
      },
    };
  },

  transform(
    enrichedData: EnrichedData,
    fieldMappingList: FieldMapping[]
  ): TransformedData {
    // If field mappings exist, use them
    if (fieldMappingList.length > 0) {
      return applyFieldMappings(enrichedData.enriched, fieldMappingList);
    }

    // Default transformation
    const data = enrichedData.enriched;
    return {
      firstname: data.first_name || '',
      lastname: data.last_name || '',
      phone: data.phone_number || '',
      email: data.email || '',
      company: data.company_name || '',
      notes: `Added from SmartLead campaign: ${data.campaign_name} on ${new Date().toISOString().split('T')[0]}`,
    };
  },

  async push(
    transformedData: TransformedData,
    credentials: DecryptedCredentials,
    destinationConfig: Record<string, unknown>
  ): Promise<PushResult> {
    const apiKey = credentials.api_key;
    const apiSecret = credentials.api_secret;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        error: 'JustCall API key or secret not configured',
      };
    }

    const phone = transformedData.phone as string;
    if (!phone) {
      return {
        success: false,
        error: 'No phone number available for contact',
      };
    }

    try {
      const payload = {
        firstname: (transformedData.firstname as string) || undefined,
        lastname: (transformedData.lastname as string) || undefined,
        phone,
        email: (transformedData.email as string) || undefined,
        company: (transformedData.company as string) || undefined,
        notes: (transformedData.notes as string) || undefined,
        campaign_id: (destinationConfig.campaign_id as string) || undefined,
      };

      const response = await createContact(payload, apiKey, apiSecret);

      return {
        success: true,
        responseStatus: 200,
        responseBody: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message,
      };
    }
  },
};
