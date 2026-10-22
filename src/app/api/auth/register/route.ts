import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'
import { generateOtp, isStudentEmail } from '@/lib/utils'
import { sendOtpEmail } from '@/lib/mail'

/**
 * POST /api/auth/register
 * Register a new user and send OTP verification
 * Based on REQ-AUTH-01, REQ-AUTH-02 in SRS.md
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = registerSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Check if phone number already exists
    const existingPhone = await prisma.user.findFirst({
      where: { phoneWhatsapp: validatedData.phoneWhatsapp },
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp sudah terdaftar' },
        { status: 400 }
      )
    }

    // Hash password with bcrypt (salt factor 10 as per SRS.md security requirement)
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Determine if this is a student email (.ac.id)
    const isStudent = isStudentEmail(validatedData.email)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        phoneWhatsapp: validatedData.phoneWhatsapp,
        isVerifiedStudent: false, // Will be set to true after OTP verification
      },
    })

    // Generate OTP code (6 digits)
    const otpCode = generateOtp(6)

    // Set expiration time (5 minutes from now as per SRS.md)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    // Save OTP to database
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
    const emailResult = await sendOtpEmail(user.email, otpCode, isStudent)

    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error)
      // Don't fail registration, but log the error
    }

    return NextResponse.json(
      {
        message: 'Registrasi berhasil. Silakan cek email untuk kode verifikasi OTP.',
        data: {
          userId: user.id,
          email: user.email,
          isStudentEmail: isStudent,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat registrasi' },
      { status: 500 }
    )
  }
}
