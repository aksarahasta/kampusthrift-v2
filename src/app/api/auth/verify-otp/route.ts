import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { otpVerifySchema } from '@/lib/validations/auth'
import { isStudentEmail } from '@/lib/utils'

/**
 * POST /api/auth/verify-otp
 * Verify OTP code for student verification
 * Based on REQ-AUTH-02, REQ-AUTH-03 in SRS.md
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = otpVerifySchema.parse(body)

    // Find the OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        email: validatedData.email.toLowerCase(),
        otpCode: validatedData.otpCode,
        isUsed: false,
        type: 'STUDENT_VERIFICATION',
      },
      include: {
        user: true,
      },
    })

    // OTP not found
    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Kode OTP tidak valid atau sudah digunakan' },
        { status: 400 }
      )
    }

    // Check if OTP is expired (5 minutes)
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { error: 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.' },
        { status: 400 }
      )
    }

    // Check if this is a student email
    const isStudent = isStudentEmail(validatedData.email)

    // Update user and mark OTP as used
    await prisma.$transaction([
      // Mark OTP as used
      prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
      // If student email, update isVerifiedStudent
      ...(isStudent
        ? [
            prisma.user.update({
              where: { id: otpRecord.userId! },
              data: { isVerifiedStudent: true },
            }),
          ]
        : []),
    ])

    return NextResponse.json({
      message: isStudent
        ? 'Verifikasi berhasil! Anda mendapatkan Verified Student Badge dan dapat menggunakan fitur Barter.'
        : 'Verifikasi berhasil!',
      data: {
        userId: otpRecord.userId,
        isVerifiedStudent: isStudent,
      },
    })
  } catch (error) {
    console.error('OTP verification error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat verifikasi OTP' },
      { status: 500 }
    )
  }
}
