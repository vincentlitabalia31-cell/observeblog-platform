const DEV_AUTH_SECRET = 'observing-india-dev-secret';

function logProductionEnvWarning(message: string) {
  if (process.env.NODE_ENV === 'production') {
    console.error(message);
  }
}

export function getAuthSecret() {
  if (!process.env.NEXTAUTH_SECRET) {
    logProductionEnvWarning('AUTH_ENV_MISSING: NEXTAUTH_SECRET is not configured.');
  }

  return process.env.NEXTAUTH_SECRET || DEV_AUTH_SECRET;
}

export function getAuthBaseUrl() {
  const rawUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  const normalizedUrl = rawUrl.replace(/\/$/, '');

  if (!normalizedUrl) {
    logProductionEnvWarning('AUTH_ENV_MISSING: NEXTAUTH_URL is not configured.');
    return undefined;
  }

  if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(normalizedUrl)) {
    logProductionEnvWarning('AUTH_ENV_INVALID: NEXTAUTH_URL points to localhost in production.');
  }

  return normalizedUrl;
}

export function logAuthEnvironmentWarnings() {
  if (process.env.NODE_ENV !== 'production') return;

  if (!process.env.MONGODB_URI) {
    logProductionEnvWarning('AUTH_ENV_MISSING: MONGODB_URI is not configured.');
  }

  getAuthSecret();
  getAuthBaseUrl();
}
