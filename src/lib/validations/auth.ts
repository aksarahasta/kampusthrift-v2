import { z } from 'zod'

/**
 * Validation schema for user registration
 * Based on REQ-AUTH-01 in SRS.md
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string()
    .email('Format email tidak valid'),
  phoneWhatsapp: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor WhatsApp tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak sama',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Validation schema for login
 */
export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Validation schema for OTP verification
 */
export const otpVerifySchema = z.object({
  email: z.string().email('Format email tidak valid'),
  otpCode: z
    .string()
    .length(6, 'Kode OTP harus 6 digit')
    .regex(/^\d+$/, 'Kode OTP harus berupa angka'),
})

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>

/**
 * Validation schema for updating user profile
 * Based on FR-1.3 in PRD.md
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100).optional(),
  phoneWhatsapp: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor WhatsApp tidak valid')
    .optional()
    .or(z.literal('')),
  campusName: z.string().max(100).optional().or(z.literal('')),
  faculty: z.string().max(100).optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/**
 * Validation schema for password reset request
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * Validation schema for password reset
 */
export const resetPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  otpCode: z.string().length(6, 'Kode OTP harus 6 digit'),
  newPassword: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password tidak sama',
  path: ['confirmPassword'],
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
