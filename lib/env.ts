const DEV_AUTH_SECRET = 'observing-india-dev-secret';

export function getAuthSecret() {
  return process.env.NEXTAUTH_SECRET || DEV_AUTH_SECRET;
}
