const buckets = new Map<string, { count: number; resetAt: number }>();

export function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function sanitizePlainText(value: string, maxLength = 5000) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/\son\w+=/gi, ' ')
    .trim()
    .slice(0, maxLength);
}

export function assertRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  existing.count += 1;
  if (existing.count > limit) {
    throw new Error('RATE_LIMITED');
  }
}
