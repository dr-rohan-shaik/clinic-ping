import { NextAuthOptions, Session } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { users, clinics } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      email?: string
      name?: string | null
      image?: string | null
      role?: string
      clinicId?: string
      clinicName?: string
    }
  }
}

// User returned from authorize callback
type AuthUser = {
  id: string
  email: string
  name: string
  role: string
  clinicId: string
  clinicName: string | undefined
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1)

        if (user.length === 0) {
          return null
        }

        const foundUser = user[0]!
        const isValid = await bcrypt.compare(credentials.password, foundUser.passwordHash)

        if (!isValid) {
          return null
        }

        // Get clinic info
        const clinic = await db
          .select()
          .from(clinics)
          .where(eq(clinics.id, foundUser.clinicId))
          .limit(1)

        return {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          role: foundUser.role,
          clinicId: foundUser.clinicId,
          clinicName: clinic[0]?.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthUser
        token.id = authUser.id
        token.role = authUser.role
        token.clinicId = authUser.clinicId
        token.clinicName = authUser.clinicName
        token.email = authUser.email
        token.name = authUser.name
      }
      return token
    },
    async session({ session, token }): Promise<Session> {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.clinicId = token.clinicId as string
        session.user.clinicName = token.clinicName as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}