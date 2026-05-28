import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from './mongodb';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { getRoleForUser, persistEffectiveRole } from './roles';
import { getAuthBaseUrl, getAuthSecret, logAuthEnvironmentWarnings } from './env';

function logAuthWarning(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') {
    console.warn(message, details ?? {});
  }
}

function getEmailLogHint(email: string) {
  const [, domain = 'unknown-domain'] = email.split('@');
  return { domain };
}

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30
  },
  pages: {
    signIn: '/login'
  },
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        logAuthEnvironmentWarnings();

        if (!credentials?.email || !credentials.password) {
          logAuthWarning('AUTH_CREDENTIALS_MISSING');
          return null;
        }

        const email = credentials.email.toLowerCase().trim();

        try {
          await connectToDatabase();
          const user = await User.findOne({ email });

          if (!user) {
            logAuthWarning('AUTH_USER_NOT_FOUND', getEmailLogHint(email));
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            logAuthWarning('AUTH_PASSWORD_MISMATCH', { ...getEmailLogHint(email), userId: user._id.toString() });
            return null;
          }

          const role = await getRoleForUser(user._id.toString(), user.email);
          await persistEffectiveRole(user._id.toString(), user.email);

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role,
            image: user.image
          };
        } catch (error) {
          logAuthWarning('AUTH_AUTHORIZE_ERROR', {
            ...getEmailLogHint(email),
            message: error instanceof Error ? error.message : 'Unknown authentication error'
          });
          return null;
        }
      }
    })
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const configuredBaseUrl = getAuthBaseUrl() || baseUrl;

      if (url.startsWith('/')) return `${configuredBaseUrl}${url}`;

      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.origin === configuredBaseUrl || parsedUrl.origin === baseUrl) {
          return url;
        }
      } catch {
        return configuredBaseUrl;
      }

      return configuredBaseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role === 'admin' ? 'admin' : 'contributor';
      }
      if (token.id && token.email) {
        token.role = await getRoleForUser(String(token.id), String(token.email));
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || '';
        session.user.role = token.role || 'contributor';
      }
      return session;
    }
  }
};
