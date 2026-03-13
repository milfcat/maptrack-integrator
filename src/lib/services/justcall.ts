import axios from 'axios';
import { waitForToken } from '@/lib/engine/rate-limiter';

const BASE_URL = 'https://api.justcall.io/v2.1';

export interface JustCallContactPayload {
  firstname?: string;
  lastname?: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  campaign_id?: string;
  other_phones?: string[];
  address?: string;
  occupation?: string;
  linkedin_url?: string;
}

export interface JustCallResponse {
  status: string;
  data?: Record<string, unknown>;
  message?: string;
}

export interface JustCallCampaign {
  id: number;
  name: string;
}

interface JustCallCampaignsResponse {
  status: string;
  count: number;
  data: JustCallCampaign[];
}

export async function createContact(
  payload: JustCallContactPayload,
  apiKey: string,
  apiSecret: string
): Promise<JustCallResponse> {
  await waitForToken('justcall');

  // JustCall Sales Dialer API expects a single "name" field
  const name = [payload.firstname, payload.lastname].filter(Boolean).join(' ');
  const body: Record<string, unknown> = {
    name: name || undefined,
    phone_number: payload.phone,
    email: payload.email,
    company: payload.company,
    notes: payload.notes,
    campaign_id: payload.campaign_id ? Number(payload.campaign_id) : undefined,
  };

  // Include additional contact fields if available
  if (payload.address) body.address = payload.address;
  if (payload.occupation) body.occupation = payload.occupation;

  // Company and LinkedIn are custom fields in JustCall Sales Dialer
  const customFields: Array<{ id: number; value: string }> = [];
  if (payload.company) {
    customFields.push({ id: 1163072, value: payload.company as string });
  }
  if (payload.linkedin_url) {
    customFields.push({ id: 1163071, value: payload.linkedin_url });
    customFields.push({ id: 1181489, value: payload.linkedin_url });
  }
  if (customFields.length > 0) {
    body.custom_fields = customFields;
  }

  // Use campaign-specific endpoint when campaign_id is provided
  const endpoint = payload.campaign_id
    ? `${BASE_URL}/sales_dialer/campaigns/contact`
    : `${BASE_URL}/sales_dialer/contacts`;

  const response = await axios.post<JustCallResponse>(
    endpoint,
    body,
    {
      headers: {
        Authorization: `${apiKey}:${apiSecret}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

export interface JustCallTranscriptResponse {
  status: string;
  data?: {
    id?: number;
    call_duration?: number;
    caller_number?: string;
    client_number?: string;
    call_summary?: string;
    speakers?: Array<{ name: string; speakerid: number }>;
    transcription?: Array<{
      speakerid: number;
      sentence: string;
      timestamp?: { starttime: string; endtime: string };
    }>;
  };
}

export interface JustCallContactResponse {
  status: string;
  data?: {
    id?: number;
    firstname?: string;
    lastname?: string;
    phone?: string;
    email?: string;
    company?: string;
  };
}

export async function getCallTranscript(
  callId: string | number,
  apiKey: string,
  apiSecret: string
): Promise<JustCallTranscriptResponse> {
  await waitForToken('justcall');

  const response = await axios.post<JustCallTranscriptResponse>(
    'https://api.justcall.io/v1/justcalliq/transcription',
    { call_id: callId },
    {
      headers: {
        Authorization: `${apiKey}:${apiSecret}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

export async function getContact(
  contactId: string | number,
  apiKey: string,
  apiSecret: string
): Promise<JustCallContactResponse> {
  await waitForToken('justcall');

  const response = await axios.get<JustCallContactResponse>(
    `${BASE_URL}/contacts/${contactId}`,
    {
      headers: {
        Authorization: `${apiKey}:${apiSecret}`,
        Accept: 'application/json',
      },
    }
  );

  return response.data;
}

export interface JustCallCampaignContact {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  company: string;
  address: string;
  occupation: string;
  linkedin_url: string;
  notes: string;
  status: string;
}

interface JustCallCampaignContactsResponse {
  status: string;
  count: number;
  total_count: number;
  data: JustCallCampaignContact[];
}

export async function listCampaignContacts(
  campaignId: string | number,
  apiKey: string,
  apiSecret: string,
  page = 1,
  perPage = 50,
  order?: string
): Promise<{ contacts: JustCallCampaignContact[]; total: number }> {
  await waitForToken('justcall');

  const params: Record<string, unknown> = {
    campaign_id: Number(campaignId),
    page,
    per_page: perPage,
  };
  if (order) params.order = order;

  const response = await axios.get<JustCallCampaignContactsResponse>(
    `${BASE_URL}/sales_dialer/campaigns/contacts`,
    {
      params,
      headers: {
        Authorization: `${apiKey}:${apiSecret}`,
        Accept: 'application/json',
      },
    }
  );

  return {
    contacts: response.data.data ?? [],
    total: response.data.total_count ?? response.data.count ?? 0,
  };
}

export async function updateContact(
  contactId: number,
  fields: Record<string, unknown>,
  apiKey: string,
  apiSecret: string
): Promise<JustCallResponse> {
  await waitForToken('justcall');

  const response = await axios.put<JustCallResponse>(
    `${BASE_URL}/sales_dialer/contacts/${contactId}`,
    fields,
    {
      headers: {
        Authorization: `${apiKey}:${apiSecret}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

export async function listCampaigns(
  apiKey: string,
  apiSecret: string
): Promise<JustCallCampaign[]> {
  await waitForToken('justcall');

  const response = await axios.get<JustCallCampaignsResponse>(
    'https://api.justcall.io/v1/autodialer/campaigns/list',
    {
      headers: {
        Authorization: `${apiKey}:${apiSecret}`,
        Accept: 'application/json',
      },
    }
  );

  return response.data.data;
}
