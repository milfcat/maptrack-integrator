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
