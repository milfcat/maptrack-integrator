import { db } from '@/lib/db';
import { processingJobs } from '@/lib/db/schema';
import { eq, and, sql, lt, isNull, or } from 'drizzle-orm';

export async function enqueueJob(
  type: string,
  payload: Record<string, unknown>
) {
  const [job] = await db
    .insert(processingJobs)
    .values({ type, payload })
    .returning();
  return job;
}

const STALE_LOCK_MS = 5 * 60 * 1000; // 5 minutes

export async function claimJobs(type: string, limit: number) {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - STALE_LOCK_MS);

  // SELECT FOR UPDATE SKIP LOCKED pattern
  const jobs = await db
    .select()
    .from(processingJobs)
    .where(
      and(
        eq(processingJobs.type, type),
        eq(processingJobs.status, 'pending'),
        or(
          isNull(processingJobs.lockedAt),
          lt(processingJobs.lockedAt, staleThreshold)
        )
      )
    )
    .limit(limit);

  if (jobs.length === 0) return [];

  // Lock the jobs
  const jobIds = jobs.map((j) => j.id);
  await db
    .update(processingJobs)
    .set({
      status: 'processing',
      lockedAt: now,
      attempts: sql`${processingJobs.attempts} + 1`,
    })
    .where(sql`${processingJobs.id} = ANY(${jobIds})`);

  return jobs;
}

export async function completeJob(
  jobId: number,
  result?: Record<string, unknown>
) {
  await db
    .update(processingJobs)
    .set({
      status: 'completed',
      result: result ?? null,
      completedAt: new Date(),
    })
    .where(eq(processingJobs.id, jobId));
}

export async function failJob(jobId: number, error: string) {
  // Check current attempts vs max
  const [job] = await db
    .select({
      attempts: processingJobs.attempts,
      maxAttempts: processingJobs.maxAttempts,
    })
    .from(processingJobs)
    .where(eq(processingJobs.id, jobId));

  if (!job) return;

  const finalFailure = job.attempts >= job.maxAttempts;

  await db
    .update(processingJobs)
    .set({
      status: finalFailure ? 'failed' : 'pending',
      error,
      lockedAt: null,
      ...(finalFailure ? { completedAt: new Date() } : {}),
    })
    .where(eq(processingJobs.id, jobId));
}
