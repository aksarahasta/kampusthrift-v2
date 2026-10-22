import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password harus diisi')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user) {
          throw new Error('Email atau password salah')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Email atau password salah')
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerifiedStudent: user.isVerifiedStudent,
          honestyScore: user.honestyScore,
          phoneWhatsapp: user.phoneWhatsapp,
          campusName: user.campusName,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.isVerifiedStudent = (user as any).isVerifiedStudent
        token.honestyScore = (user as any).honestyScore
        token.phoneWhatsapp = (user as any).phoneWhatsapp
        token.campusName = (user as any).campusName
      }

      // Handle session update on client
      if (trigger === 'update' && session) {
        if (session.isVerifiedStudent !== undefined) {
          token.isVerifiedStudent = session.isVerifiedStudent
        }
        if (session.name) {
          token.name = session.name
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.isVerifiedStudent = token.isVerifiedStudent as boolean
        session.user.honestyScore = token.honestyScore as number
        session.user.phoneWhatsapp = token.phoneWhatsapp as string
        session.user.campusName = token.campusName as string | null
      }
      return session
    },
  },
}
