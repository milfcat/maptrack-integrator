import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations, webhookEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getHandler } from '@/lib/engine/registry';
import { executeIntegration } from '@/lib/engine/executor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
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

    const handler = getHandler(slug);
    if (!handler) {
      return NextResponse.json(
        { error: 'No handler found' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Insert test webhook event
    const [event] = await db
      .insert(webhookEvents)
      .values({
        integrationId: integration.id,
        eventType: body.event_type ?? 'TEST',
        sourceService: handler.sourceService,
        rawPayload: body,
        status: 'received',
        deduplicationKey: `test-${Date.now()}`,
      })
      .returning();

    // Execute synchronously for testing
    const result = await executeIntegration(slug, event.id);

    return NextResponse.json({
      status: 'completed',
      eventId: event.id,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { status: 'failed', error: message },
      { status: 500 }
    );
  }
}
