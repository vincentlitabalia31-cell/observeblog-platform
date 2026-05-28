import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from './mongodb';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { getRoleForUser, persistEffectiveRole } from './roles';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;
        const role = await getRoleForUser(user._id.toString(), user.email);
        await persistEffectiveRole(user._id.toString(), user.email);

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role,
          image: user.image
        };
      }
    })
  ],
  callbacks: {
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
