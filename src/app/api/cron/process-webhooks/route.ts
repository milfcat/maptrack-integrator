import { NextRequest, NextResponse } from 'next/server';
import { processWebhookJobs } from '@/lib/jobs/processor';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processWebhookJobs();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

// Manual trigger from dashboard UI (protected by basic auth middleware)
export async function POST() {
  try {
    const result = await processWebhookJobs();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Manual process error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}
