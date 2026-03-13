import axios from 'axios';
import { waitForToken } from '@/lib/engine/rate-limiter';

const BASE_URL = 'https://api.hubapi.com';

export interface HubSpotContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  jobtitle?: string;
  city?: string;
  website?: string;
  hs_linkedin_url?: string;
  [key: string]: string | undefined;
}

export interface HubSpotContact {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface HubSpotSearchResponse {
  total: number;
  results: HubSpotContact[];
}

interface HubSpotObjectResponse {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function searchContactByEmail(
  email: string,
  accessToken: string
): Promise<HubSpotContact | null> {
  await waitForToken('hubspot');

  const response = await axios.post<HubSpotSearchResponse>(
    `${BASE_URL}/crm/v3/objects/contacts/search`,
    {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
              value: email,
            },
          ],
        },
      ],
      properties: [
        'email',
        'firstname',
        'lastname',
        'phone',
        'company',
        'jobtitle',
        'city',
        'website',
        'hs_linkedin_url',
      ],
      limit: 1,
    },
    { headers: authHeaders(accessToken) }
  );

  return response.data.results?.[0] ?? null;
}

export async function createContact(
  properties: HubSpotContactProperties,
  accessToken: string
): Promise<HubSpotContact> {
  await waitForToken('hubspot');

  // Remove undefined values
  const cleanProps: Record<string, string> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== '') {
      cleanProps[key] = value;
    }
  }

  const response = await axios.post<HubSpotObjectResponse>(
    `${BASE_URL}/crm/v3/objects/contacts`,
    { properties: cleanProps },
    { headers: authHeaders(accessToken) }
  );

  return response.data;
}

export async function updateContact(
  contactId: string,
  properties: HubSpotContactProperties,
  accessToken: string
): Promise<HubSpotContact> {
  await waitForToken('hubspot');

  const cleanProps: Record<string, string> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== '') {
      cleanProps[key] = value;
    }
  }

  const response = await axios.patch<HubSpotObjectResponse>(
    `${BASE_URL}/crm/v3/objects/contacts/${contactId}`,
    { properties: cleanProps },
    { headers: authHeaders(accessToken) }
  );

  return response.data;
}

export async function upsertContact(
  properties: HubSpotContactProperties,
  accessToken: string
): Promise<{ action: 'created' | 'updated'; contact: HubSpotContact }> {
  const existing = await searchContactByEmail(properties.email, accessToken);

  if (existing) {
    const contact = await updateContact(existing.id, properties, accessToken);
    return { action: 'updated', contact };
  }

  const contact = await createContact(properties, accessToken);
  return { action: 'created', contact };
}
