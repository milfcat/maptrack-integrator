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

export async function getLeadById(
  leadId: number | string,
  apiKey: string
): Promise<SmartLeadLead> {
  await waitForToken('smartlead');

  const response = await axios.get<SmartLeadLead>(
    `${BASE_URL}/leads/${leadId}`,
    { params: { api_key: apiKey } }
  );

  return response.data;
}
