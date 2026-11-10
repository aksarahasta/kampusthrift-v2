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
          avatarUrl: user.avatarUrl,
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
        token.avatarUrl = (user as any).avatarUrl
      }

      // Handle session update on client
      if (trigger === 'update') {
        if (session?.isVerifiedStudent !== undefined) {
          token.isVerifiedStudent = session.isVerifiedStudent
        }
        if (session?.name) {
          token.name = session.name
        }
        if (session?.avatarUrl !== undefined) {
          token.avatarUrl = session.avatarUrl
        }

        // Fetch fresh from DB if token has user id
        if (token?.id) {
          try {
            const freshUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                name: true,
                avatarUrl: true,
                isVerifiedStudent: true,
                honestyScore: true,
                phoneWhatsapp: true,
                campusName: true,
              },
            })
            if (freshUser) {
              if (freshUser.name) token.name = freshUser.name
              if (freshUser.avatarUrl !== undefined) token.avatarUrl = freshUser.avatarUrl
              token.isVerifiedStudent = freshUser.isVerifiedStudent
              token.honestyScore = freshUser.honestyScore
              token.phoneWhatsapp = freshUser.phoneWhatsapp
              token.campusName = freshUser.campusName
            }
          } catch (err) {
            console.error('Error refreshing token from DB:', err)
          }
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
        session.user.avatarUrl = token.avatarUrl as string | null
      }
      return session
    },
  },
}
