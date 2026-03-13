import type {
  IntegrationHandler,
  DecryptedCredentials,
  WebhookValidationResult,
  EnrichedData,
  FieldMapping,
  TransformedData,
  PushResult,
} from '@/lib/engine/types';
import axios from 'axios';
import { getLeadById } from '@/lib/services/smartlead';
import { upsertContact } from '@/lib/services/hubspot';
import { applyFieldMappings } from './transformer';
import type { SmartLeadEmailSentWebhook } from './types';

export const smartleadHubspotHandler: IntegrationHandler = {
  slug: 'smartlead-hubspot',
  sourceService: 'smartlead',
  destinationService: 'hubspot',

  validateWebhook(
    payload: unknown,
    _headers: Record<string, string>,
    credentials: DecryptedCredentials
  ): WebhookValidationResult {
    const data = payload as SmartLeadEmailSentWebhook;

    if (data.event_type !== 'EMAIL_SENT') {
      return {
        valid: false,
        error: `Unsupported event type: ${data.event_type}`,
      };
    }

    const webhookSecret = credentials.webhook_secret;
    if (webhookSecret && data.secret_key !== webhookSecret) {
      return { valid: false, error: 'Invalid webhook secret' };
    }

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

    let firstName = lead.first_name;
    let lastName = lead.last_name;
    if (!firstName && data.to_name) {
      const parts = data.to_name.trim().split(/\s+/);
      firstName = parts[0] ?? '';
      lastName = parts.slice(1).join(' ');
    }

    return {
      original: data as unknown as Record<string, unknown>,
      enriched: {
        first_name: firstName,
        last_name: lastName || lead.last_name,
        email: lead.email || data.to_email,
        phone_number: lead.phone_number,
        company_name: lead.company_name,
        website: lead.website,
        location: lead.location,
        linkedin_profile: lead.linkedin_profile,
        title: lead.title,
        position: lead.position,
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
    if (fieldMappingList.length > 0) {
      return applyFieldMappings(enrichedData.enriched, fieldMappingList);
    }

    const data = enrichedData.enriched;

    return {
      email: data.email || '',
      firstname: data.first_name || '',
      lastname: data.last_name || '',
      phone: data.phone_number || '',
      company: data.company_name || '',
      jobtitle: data.position || data.title || '',
      city: data.location || '',
      website: data.website || '',
      hs_linkedin_url: data.linkedin_profile || '',
    };
  },

  async push(
    transformedData: TransformedData,
    credentials: DecryptedCredentials,
    _destinationConfig: Record<string, unknown>
  ): Promise<PushResult> {
    const accessToken = credentials.access_token;

    if (!accessToken) {
      return {
        success: false,
        error: 'HubSpot access token not configured',
      };
    }

    const email = transformedData.email as string;
    if (!email) {
      return {
        success: false,
        error: 'No email available for contact — required for HubSpot',
      };
    }

    try {
      const properties: Record<string, string> = {};
      for (const [key, value] of Object.entries(transformedData)) {
        if (typeof value === 'string' && value) {
          properties[key] = value;
        }
      }

      const result = await upsertContact(
        { ...properties, email } as { email: string; [key: string]: string },
        accessToken
      );

      return {
        success: true,
        responseStatus: 200,
        responseBody: {
          action: result.action,
          contactId: result.contact.id,
          properties: result.contact.properties,
        },
      };
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Unknown error';
      let responseBody: Record<string, unknown> | undefined;
      let responseStatus: number | undefined;

      if (axios.isAxiosError(error) && error.response) {
        responseStatus = error.response.status;
        responseBody = error.response.data as Record<string, unknown>;
        message = `${error.message}: ${JSON.stringify(error.response.data)}`;
      }

      return {
        success: false,
        responseStatus,
        responseBody,
        error: message,
      };
    }
  },
};
