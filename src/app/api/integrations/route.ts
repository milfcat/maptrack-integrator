import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations, webhookEvents } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export async function GET() {
  try {
    const allIntegrations = await db.select().from(integrations);

    // Get 24h stats for each integration
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stats = await db
      .select({
        integrationId: webhookEvents.integrationId,
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${webhookEvents.status} = 'completed')`,
        failed: sql<number>`count(*) filter (where ${webhookEvents.status} = 'failed')`,
      })
      .from(webhookEvents)
      .where(gte(webhookEvents.receivedAt, oneDayAgo))
      .groupBy(webhookEvents.integrationId);

    const statsMap = new Map(stats.map((s) => [s.integrationId, s]));

    const result = allIntegrations.map((integration) => {
      const s = statsMap.get(integration.id);
      return {
        ...integration,
        stats24h: {
          total: Number(s?.total ?? 0),
          completed: Number(s?.completed ?? 0),
          failed: Number(s?.failed ?? 0),
          successRate: s
            ? Number(s.total) > 0
              ? Math.round((Number(s.completed) / Number(s.total)) * 100)
              : 100
            : 100,
        },
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [integration] = await db
      .insert(integrations)
      .values({
        name: body.name,
        slug: body.slug,
        description: body.description,
        sourceService: body.sourceService,
        destinationService: body.destinationService,
        sourceConfig: body.sourceConfig ?? {},
        destinationConfig: body.destinationConfig ?? {},
        enabled: body.enabled ?? true,
      })
      .returning();

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}
