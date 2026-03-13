const buckets = new Map<string, { tokens: number; lastRefill: number }>();

interface RateLimitConfig {
  maxTokens: number;
  refillRatePerSecond: number;
}

const SERVICE_LIMITS: Record<string, RateLimitConfig> = {
  smartlead: { maxTokens: 60, refillRatePerSecond: 1 }, // 60 req/min
  justcall: { maxTokens: 30, refillRatePerSecond: 0.5 }, // 30 req/min burst
  hubspot: { maxTokens: 100, refillRatePerSecond: 10 }, // 100 req/10s
};

function getBucket(service: string) {
  const config = SERVICE_LIMITS[service] ?? {
    maxTokens: 30,
    refillRatePerSecond: 0.5,
  };

  if (!buckets.has(service)) {
    buckets.set(service, {
      tokens: config.maxTokens,
      lastRefill: Date.now(),
    });
  }

  const bucket = buckets.get(service)!;
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000;
  const refill = elapsed * config.refillRatePerSecond;

  bucket.tokens = Math.min(config.maxTokens, bucket.tokens + refill);
  bucket.lastRefill = now;

  return bucket;
}

export async function waitForToken(service: string): Promise<void> {
  const bucket = getBucket(service);

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return;
  }

  // Wait for a token to become available
  const config = SERVICE_LIMITS[service] ?? {
    maxTokens: 30,
    refillRatePerSecond: 0.5,
  };
  const waitMs = (1 / config.refillRatePerSecond) * 1000;
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  bucket.tokens = 0; // Use the refilled token
}
