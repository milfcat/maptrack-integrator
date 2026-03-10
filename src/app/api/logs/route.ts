import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { webhookEvents, dataTransfers } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const integrationId = searchParams.get('integrationId');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    const conditions = [];
    if (integrationId) {
      conditions.push(
        eq(webhookEvents.integrationId, parseInt(integrationId))
      );
    }
    if (status) {
      conditions.push(eq(webhookEvents.status, status));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [events, countResult] = await Promise.all([
      db
        .select()
        .from(webhookEvents)
        .where(whereClause)
        .orderBy(desc(webhookEvents.receivedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(webhookEvents)
        .where(whereClause),
    ]);

    // Fetch transfers for these events
    const eventIds = events.map((e) => e.id);
    const transfers =
      eventIds.length > 0
        ? await db
            .select()
            .from(dataTransfers)
            .where(sql`${dataTransfers.webhookEventId} = ANY(${eventIds})`)
            .orderBy(dataTransfers.createdAt)
        : [];

    const transfersByEvent = new Map<number, typeof transfers>();
    for (const t of transfers) {
      if (!transfersByEvent.has(t.webhookEventId)) {
        transfersByEvent.set(t.webhookEventId, []);
      }
      transfersByEvent.get(t.webhookEventId)!.push(t);
    }

    const result = events.map((event) => ({
      ...event,
      transfers: transfersByEvent.get(event.id) ?? [],
    }));

    return NextResponse.json({
      events: result,
      pagination: {
        page,
        limit,
        total: Number(countResult[0]?.count ?? 0),
        totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
