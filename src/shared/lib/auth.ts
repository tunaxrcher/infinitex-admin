import bcrypt from 'bcrypt';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  // Use JWT strategy (no adapter for custom auth)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Configure pages
  pages: {
    signIn: '/signin',
    error: '/signin', // Redirect to signin on error
  },

  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),

    // Credentials Provider for Admin email/password login
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'checkbox' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(
            JSON.stringify({
              message: 'Please provide both email and password.',
            }),
          );
        }

        // Find admin by email with permissions
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
          include: {
            permissions: true,
          },
        });

        if (!admin) {
          throw new Error(
            JSON.stringify({
              message: 'Invalid email or password.',
            }),
          );
        }

        // Check if admin is active
        if (!admin.isActive) {
          throw new Error(
            JSON.stringify({
              message: 'Your account is not active. Please contact support.',
            }),
          );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          admin.password,
        );

        if (!isPasswordValid) {
          throw new Error(
            JSON.stringify({
              message: 'Invalid email or password.',
            }),
          );
        }

        // Update last login time
        await prisma.admin.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        });

        // Return admin object
        return {
          id: admin.id,
          email: admin.email,
          name: `${admin.firstName} ${admin.lastName}`,
          avatar: null,
          roleId: admin.role,
          roleName: admin.role,
          status: admin.isActive ? 'ACTIVE' : 'INACTIVE',
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatar = user.avatar;
        token.roleId = user.roleId;
        token.roleName = user.roleName;
        token.status = user.status;
      }

      // Handle account linking (OAuth)
      if (account?.provider === 'google') {
        const admin = await prisma.admin.findUnique({
          where: { email: token.email! },
        });

        if (admin && admin.isActive) {
          token.id = admin.id;
          token.roleId = admin.role;
          token.roleName = admin.role;
          token.name = `${admin.firstName} ${admin.lastName}`;

          // Update last login
          await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
          });
        } else {
          // Don't allow Google login for non-admin users
          throw new Error('Access denied');
        }
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.avatar = token.avatar as string | null;
        session.user.roleId = token.roleId as string | null;
        session.user.roleName = token.roleName as string | null;
        session.user.status = token.status as string;
      }

      return session;
    },

    async signIn({ account, profile }) {
      // Allow credentials sign in
      if (account?.provider === 'credentials') {
        return true;
      }

      // Handle OAuth sign in (Google) - only for existing admins
      if (account?.provider === 'google' && profile?.email) {
        const existingAdmin = await prisma.admin.findUnique({
          where: { email: profile.email },
        });

        // Only allow Google login for existing active admins
        if (existingAdmin && existingAdmin.isActive) {
          return true;
        }

        // Reject Google login for non-admins
        return false;
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',

  // Secret for JWT
  secret: process.env.NEXTAUTH_SECRET,
};
