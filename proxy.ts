import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login'
  },
  callbacks: {
    authorized({ req, token }) {
      if (req.nextUrl.pathname.startsWith('/admin')) {
        return token?.role === 'admin';
      }

      return !!token;
    }
  }
});

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};
