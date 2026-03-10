import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrations, webhookEvents } from '@/lib/db/schema';
import { eq, sql, gte } from 'drizzle-orm';

export async function GET() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      integrationCount,
      activeCount,
      todayStats,
      weeklyActivity,
    ] = await Promise.all([
      // Total integrations
      db
        .select({ count: sql<number>`count(*)` })
        .from(integrations),

      // Active integrations
      db
        .select({ count: sql<number>`count(*)` })
        .from(integrations)
        .where(eq(integrations.enabled, true)),

      // Today's stats
      db
        .select({
          total: sql<number>`count(*)`,
          completed: sql<number>`count(*) filter (where ${webhookEvents.status} = 'completed')`,
          failed: sql<number>`count(*) filter (where ${webhookEvents.status} = 'failed')`,
          processing: sql<number>`count(*) filter (where ${webhookEvents.status} in ('received', 'processing'))`,
        })
        .from(webhookEvents)
        .where(gte(webhookEvents.receivedAt, oneDayAgo)),

      // Weekly activity by day
      db
        .select({
          date: sql<string>`date_trunc('day', ${webhookEvents.receivedAt})::date::text`,
          total: sql<number>`count(*)`,
          completed: sql<number>`count(*) filter (where ${webhookEvents.status} = 'completed')`,
          failed: sql<number>`count(*) filter (where ${webhookEvents.status} = 'failed')`,
        })
        .from(webhookEvents)
        .where(gte(webhookEvents.receivedAt, sevenDaysAgo))
        .groupBy(sql`date_trunc('day', ${webhookEvents.receivedAt})::date`)
        .orderBy(sql`date_trunc('day', ${webhookEvents.receivedAt})::date`),
    ]);

    const today = todayStats[0];
    const totalToday = Number(today?.total ?? 0);
    const completedToday = Number(today?.completed ?? 0);

    return NextResponse.json({
      totalIntegrations: Number(integrationCount[0]?.count ?? 0),
      activeIntegrations: Number(activeCount[0]?.count ?? 0),
      eventsToday: totalToday,
      successRate24h: totalToday > 0
        ? Math.round((completedToday / totalToday) * 100)
        : 100,
      processingCount: Number(today?.processing ?? 0),
      failedToday: Number(today?.failed ?? 0),
      weeklyActivity: weeklyActivity.map((day) => ({
        date: day.date,
        total: Number(day.total),
        completed: Number(day.completed),
        failed: Number(day.failed),
      })),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
