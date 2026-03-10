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

  const response = await axios.post<JustCallResponse>(
    `${BASE_URL}/sales_dialer/contacts`,
    payload,
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
