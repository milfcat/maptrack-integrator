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
  const body = {
    name: name || undefined,
    phone_number: payload.phone,
    email: payload.email,
    company: payload.company,
    notes: payload.notes,
    campaign_id: payload.campaign_id ? Number(payload.campaign_id) : undefined,
  };

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
