type BucketState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  retryAfterSeconds?: number;
};

const globalBuckets = globalThis as typeof globalThis & {
  __rateLimitBuckets__?: Map<string, BucketState>;
};

function getBuckets() {
  if (!globalBuckets.__rateLimitBuckets__) {
    globalBuckets.__rateLimitBuckets__ = new Map<string, BucketState>();
  }

  return globalBuckets.__rateLimitBuckets__;
}

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "unknown";
}

export function checkRateLimit(
  request: Request,
  bucketName: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const buckets = getBuckets();
  const key = `${bucketName}:${getClientKey(request)}`;
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return { ok: true };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  buckets.set(key, current);

  return { ok: true };
}
