import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { generateOtp, isStudentEmail } from '@/lib/utils'
import { sendOtpEmail } from '@/lib/mail'

/**
 * POST /api/auth/resend-otp
 * Resend OTP code for email verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    })

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        message: 'Jika email terdaftar, kode OTP baru akan dikirim.',
      })
    }

    // Check if user is already verified (for student emails)
    if (user.isVerifiedStudent) {
      return NextResponse.json(
        { error: 'Akun sudah terverifikasi' },
        { status: 400 }
      )
    }

    // Invalidate previous OTPs
    await prisma.otpVerification.updateMany({
      where: {
        email: user.email,
        type: 'STUDENT_VERIFICATION',
        isUsed: false,
      },
      data: { isUsed: true },
    })

    // Generate new OTP
    const otpCode = generateOtp(6)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Save new OTP
    await prisma.otpVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        otpCode,
        type: 'STUDENT_VERIFICATION',
        expiresAt,
      },
    })

    // Send OTP email
    const isStudent = isStudentEmail(user.email)
    await sendOtpEmail(user.email, otpCode, isStudent)

    return NextResponse.json({
      message: 'Kode OTP baru telah dikirim ke email Anda.',
    })
  } catch (error) {
    console.error('Resend OTP error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengirim ulang OTP' },
      { status: 500 }
    )
  }
}
