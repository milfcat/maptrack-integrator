import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations, webhookEvents, apiCredentials, apiKeyRegistry } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getHandler } from '@/lib/engine/registry';
import { enqueueJob } from '@/lib/jobs/queue';
import { decrypt } from '@/lib/crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Look up integration
    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.slug, slug));

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    if (!integration.enabled) {
      return NextResponse.json(
        { error: 'Integration is disabled' },
        { status: 403 }
      );
    }

    const handler = getHandler(slug);
    if (!handler) {
      return NextResponse.json(
        { error: 'No handler for integration' },
        { status: 500 }
      );
    }

    const payload = await request.json();

    // Get source credentials for validation
    const creds = await db
      .select()
      .from(apiCredentials)
      .where(
        and(
          eq(apiCredentials.integrationId, integration.id),
          eq(apiCredentials.service, handler.sourceService)
        )
      );

    const credentials: Record<string, string> = {};
    for (const cred of creds) {
      if (cred.registryKeyId) {
        // Resolve from central registry
        const [regKey] = await db
          .select()
          .from(apiKeyRegistry)
          .where(eq(apiKeyRegistry.id, cred.registryKeyId));
        if (regKey) {
          credentials[cred.credentialType] = decrypt(
            regKey.encryptedValue,
            regKey.iv
          );
        }
      } else if (cred.encryptedValue && cred.iv) {
        credentials[cred.credentialType] = decrypt(
          cred.encryptedValue,
          cred.iv
        );
      }
    }

    // Validate webhook
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const validation = handler.validateWebhook(payload, headers, credentials);

    // Check for duplicates
    if (validation.valid && validation.deduplicationKey) {
      const [existing] = await db
        .select({ id: webhookEvents.id })
        .from(webhookEvents)
        .where(
          and(
            eq(webhookEvents.integrationId, integration.id),
            eq(webhookEvents.deduplicationKey, validation.deduplicationKey),
            eq(webhookEvents.status, 'completed')
          )
        );

      if (existing) {
        return NextResponse.json({ status: 'duplicate_skipped' });
      }
    }

    // Insert webhook event
    const [event] = await db
      .insert(webhookEvents)
      .values({
        integrationId: integration.id,
        eventType: validation.eventType ?? 'unknown',
        sourceService: handler.sourceService,
        rawPayload: payload,
        status: validation.valid ? 'received' : 'failed',
        error: validation.error,
        deduplicationKey: validation.deduplicationKey,
      })
      .returning();

    if (!validation.valid) {
      return NextResponse.json(
        { status: 'validation_failed', error: validation.error },
        { status: 400 }
      );
    }

    // Enqueue processing job
    await enqueueJob('process_webhook', {
      webhookEventId: event.id,
      integrationSlug: slug,
    });

    return NextResponse.json({ status: 'received', eventId: event.id });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
