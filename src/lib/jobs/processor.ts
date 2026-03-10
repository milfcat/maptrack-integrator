import { claimJobs, completeJob, failJob } from './queue';
import { executeIntegration } from '@/lib/engine/executor';

const BATCH_SIZE = 25; // Stay within JustCall rate limits

export async function processWebhookJobs() {
  const jobs = await claimJobs('process_webhook', BATCH_SIZE);

  if (jobs.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      const payload = job.payload as {
        webhookEventId: number;
        integrationSlug: string;
      };

      const result = await executeIntegration(
        payload.integrationSlug,
        payload.webhookEventId
      );

      await completeJob(job.id, result);
      succeeded++;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      await failJob(job.id, message);
      failed++;
    }
  }

  return { processed: jobs.length, succeeded, failed };
}
