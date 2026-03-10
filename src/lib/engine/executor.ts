import { db } from '@/lib/db';
import {
  integrations,
  apiCredentials,
  apiKeyRegistry,
  webhookEvents,
  dataTransfers,
  fieldMappings,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { getHandler } from './registry';
import type { DecryptedCredentials, FieldMapping } from './types';

async function getDecryptedCredentials(
  integrationId: number
): Promise<Record<string, DecryptedCredentials>> {
  const creds = await db
    .select()
    .from(apiCredentials)
    .where(eq(apiCredentials.integrationId, integrationId));

  const result: Record<string, DecryptedCredentials> = {};
  for (const cred of creds) {
    if (!result[cred.service]) result[cred.service] = {};

    if (cred.registryKeyId) {
      // Resolve from central registry
      const [regKey] = await db
        .select()
        .from(apiKeyRegistry)
        .where(eq(apiKeyRegistry.id, cred.registryKeyId));
      if (regKey) {
        result[cred.service][cred.credentialType] = decrypt(
          regKey.encryptedValue,
          regKey.iv
        );
      }
    } else if (cred.encryptedValue && cred.iv) {
      // Use inline credential
      result[cred.service][cred.credentialType] = decrypt(
        cred.encryptedValue,
        cred.iv
      );
    }
  }
  return result;
}

async function logTransfer(params: {
  webhookEventId: number;
  integrationId: number;
  step: string;
  direction: string;
  service: string;
  requestUrl?: string;
  requestMethod?: string;
  requestBody?: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: Record<string, unknown>;
  status: string;
  error?: string;
  durationMs?: number;
}) {
  await db.insert(dataTransfers).values(params);
}

export async function executeIntegration(
  slug: string,
  webhookEventId: number
): Promise<Record<string, unknown>> {
  const handler = getHandler(slug);
  if (!handler) throw new Error(`No handler found for integration: ${slug}`);

  // Load integration config
  const [integration] = await db
    .select()
    .from(integrations)
    .where(eq(integrations.slug, slug));

  if (!integration) throw new Error(`Integration not found: ${slug}`);
  if (!integration.enabled) throw new Error(`Integration is disabled: ${slug}`);

  // Load webhook event
  const [event] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.id, webhookEventId));

  if (!event) throw new Error(`Webhook event not found: ${webhookEventId}`);

  // Update event status
  await db
    .update(webhookEvents)
    .set({ status: 'processing' })
    .where(eq(webhookEvents.id, webhookEventId));

  try {
    // Get credentials
    const allCredentials = await getDecryptedCredentials(integration.id);
    const sourceCredentials = allCredentials[handler.sourceService] ?? {};
    const destCredentials = allCredentials[handler.destinationService] ?? {};

    // Step 1: Enrich
    const enrichStart = Date.now();
    const enrichedData = await handler.enrich(event.rawPayload, sourceCredentials);
    const enrichDuration = Date.now() - enrichStart;

    await logTransfer({
      webhookEventId,
      integrationId: integration.id,
      step: 'enrich',
      direction: 'outbound',
      service: handler.sourceService,
      requestUrl: `SmartLead API - Lead enrichment`,
      requestMethod: 'GET',
      status: 'success',
      durationMs: enrichDuration,
    });

    // Step 2: Transform
    const mappings = await db
      .select()
      .from(fieldMappings)
      .where(eq(fieldMappings.integrationId, integration.id));

    const fieldMappingList: FieldMapping[] = mappings.map((m) => ({
      sourceField: m.sourceField,
      destinationField: m.destinationField,
      transform: m.transform,
      isRequired: m.isRequired,
      defaultValue: m.defaultValue,
    }));

    const transformedData = handler.transform(enrichedData, fieldMappingList);

    // Step 3: Push
    const destConfig = (integration.destinationConfig as Record<string, unknown>) ?? {};
    const pushStart = Date.now();
    const pushResult = await handler.push(
      transformedData,
      destCredentials,
      destConfig
    );
    const pushDuration = Date.now() - pushStart;

    await logTransfer({
      webhookEventId,
      integrationId: integration.id,
      step: 'push',
      direction: 'outbound',
      service: handler.destinationService,
      requestUrl: `JustCall API - Create contact`,
      requestMethod: 'POST',
      requestBody: transformedData as Record<string, unknown>,
      responseStatus: pushResult.responseStatus,
      responseBody: pushResult.responseBody,
      status: pushResult.success ? 'success' : 'failed',
      error: pushResult.error,
      durationMs: pushDuration,
    });

    if (!pushResult.success) {
      throw new Error(pushResult.error ?? 'Push failed');
    }

    // Mark event as completed
    await db
      .update(webhookEvents)
      .set({ status: 'completed', processedAt: new Date() })
      .where(eq(webhookEvents.id, webhookEventId));

    return { success: true, pushResult: pushResult.responseBody };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await db
      .update(webhookEvents)
      .set({ status: 'failed', error: message, processedAt: new Date() })
      .where(eq(webhookEvents.id, webhookEventId));

    throw error;
  }
}
