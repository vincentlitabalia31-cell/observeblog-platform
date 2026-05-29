const DEV_AUTH_SECRET = 'observing-india-dev-secret';
/** Canonical production host for observeblog-platform on Vercel */
export const PRODUCTION_SITE_ORIGIN = 'https://observeblog-platform.vercel.app';

function logProductionEnvWarning(message: string) {
  if (process.env.NODE_ENV === 'production') {
    console.error(message);
  }
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getAuthSecret() {
  if (!readEnv('NEXTAUTH_SECRET')) {
    logProductionEnvWarning('AUTH_ENV_MISSING: NEXTAUTH_SECRET is not configured.');
  }

  return readEnv('NEXTAUTH_SECRET') || DEV_AUTH_SECRET;
}

function isLocalhostUrl(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function getAuthBaseUrl() {
  const fromEnv = readEnv('NEXTAUTH_URL') || readEnv('NEXT_PUBLIC_SITE_URL');
  const fromVercel = readEnv('VERCEL_PROJECT_PRODUCTION_URL')
    ? `https://${readEnv('VERCEL_PROJECT_PRODUCTION_URL')}`
    : readEnv('VERCEL_URL')
      ? `https://${readEnv('VERCEL_URL')}`
      : undefined;

  let normalizedUrl = (fromEnv || fromVercel || '').replace(/\/$/, '');

  if (process.env.NODE_ENV === 'production') {
    if (!normalizedUrl || isLocalhostUrl(normalizedUrl)) {
      if (normalizedUrl && isLocalhostUrl(normalizedUrl)) {
        logProductionEnvWarning('AUTH_ENV_INVALID: Site URL points to localhost; using production origin.');
      }
      normalizedUrl = PRODUCTION_SITE_ORIGIN;
    }
  }

  if (!normalizedUrl) {
    logProductionEnvWarning('AUTH_ENV_MISSING: NEXTAUTH_URL is not configured.');
    return undefined;
  }

  return normalizedUrl;
}

/** Public origin for emails, sitemap, and password-reset links — never localhost in production. */
export function getProductionSiteUrl(requestOrigin?: string) {
  const base = getAuthBaseUrl();
  if (base) return base;

  const fallback = requestOrigin?.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_SITE_ORIGIN;
  }

  return fallback || 'http://localhost:3000';
}

export function logAuthEnvironmentWarnings() {
  if (process.env.NODE_ENV !== 'production') return;

  if (!process.env.MONGODB_URI) {
    logProductionEnvWarning('AUTH_ENV_MISSING: MONGODB_URI is not configured.');
  }

  getAuthSecret();
  getAuthBaseUrl();
}
