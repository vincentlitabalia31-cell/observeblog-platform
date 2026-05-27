import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedPaths = ['/dashboard', '/admin'];
const adminOnlyPaths = ['/admin', '/api/admin'];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAdminOnly = adminOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const isWriteApi =
    pathname.startsWith('/api/posts') && (request.method === 'POST' || request.method === 'PATCH' || request.method === 'DELETE');

  if (!isProtected && !isAdminOnly && !isWriteApi) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search || ''}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminOnly && token.role !== 'admin') {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/admin/:path*', '/api/posts/:path*']
};

