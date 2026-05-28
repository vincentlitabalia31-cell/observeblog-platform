import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedPaths = ['/dashboard', '/admin'];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isProtectedApi = pathname.startsWith('/api/admin') || pathname.startsWith('/api/admin-requests');

  const isWriteApi =
    pathname.startsWith('/api/posts') && (request.method === 'POST' || request.method === 'PATCH' || request.method === 'DELETE');

  if (!isProtected && !isProtectedApi && !isWriteApi) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search || ''}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/admin/:path*', '/api/admin-requests/:path*', '/api/posts/:path*']
};
