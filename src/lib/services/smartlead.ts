import axios from 'axios';
import { waitForToken } from '@/lib/engine/rate-limiter';

const BASE_URL = 'https://server.smartlead.ai/api/v1';

export interface SmartLeadLead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  company_name: string;
  website: string;
  location: string;
  linkedin_profile: string;
  company_url: string;
  custom_fields: Record<string, string>;
  is_unsubscribed: boolean;
  lead_campaign_data: Array<{
    campaign_id: number;
    campaign_name: string;
    lead_category_id: number;
  }>;
  created_at: string;
}

interface SmartLeadLeadResponse {
  ok: boolean;
  message: string;
  data: SmartLeadLead[];
}

export interface SmartLeadCampaign {
  id: number;
  name: string;
  status: string;
}

export async function listCampaigns(
  apiKey: string
): Promise<SmartLeadCampaign[]> {
  await waitForToken('smartlead');

  const response = await axios.get<SmartLeadCampaign[]>(
    `${BASE_URL}/campaigns`,
    { params: { api_key: apiKey } }
  );

  // API returns array directly
  return Array.isArray(response.data) ? response.data : [];
}

export async function getLeadById(
  leadId: number | string,
  apiKey: string
): Promise<SmartLeadLead> {
  await waitForToken('smartlead');

  const response = await axios.get<SmartLeadLeadResponse>(
    `${BASE_URL}/leads/${leadId}`,
    { params: { api_key: apiKey } }
  );

  const lead = response.data.data?.[0];
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  return lead;
}
