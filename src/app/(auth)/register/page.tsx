'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterInput } from '@/lib/validations/auth'
import { isStudentEmail } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  // Watch email field to detect .ac.id domain dynamically
  const emailValue = watch('email') || ''
  const isStudent = isStudentEmail(emailValue)

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Terjadi kesalahan saat pendaftaran')
      }

      // Redirect to OTP verification page with email parameter
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal mendaftar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <span className="text-2xl font-bold text-blue-600">KT</span>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Daftar Akun Baru</CardTitle>
          <CardDescription>
            Bergabung dengan komunitas jual-beli & barter kampus
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="cth. Budi Santoso"
                {...register('name')}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="email">Email</Label>
                {isStudent && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <GraduationCap size={13} />
                    Email Kampus Terdeteksi
                  </span>
                )}
              </div>
              <Input
                id="email"
                type="email"
                placeholder="nama@kampus.ac.id atau email@domain.com"
                {...register('email')}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}

              {isStudent && (
                <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Gunakan email <strong>.ac.id</strong> untuk otomatis mendapatkan <strong>Verified Student Badge</strong> dan akses fitur <strong>Barter</strong>!
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phoneWhatsapp">Nomor WhatsApp</Label>
              <Input
                id="phoneWhatsapp"
                placeholder="cth. 081234567890"
                {...register('phoneWhatsapp')}
                disabled={loading}
              />
              {errors.phoneWhatsapp && (
                <p className="text-xs text-red-500">{errors.phoneWhatsapp.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter (huruf besar, kecil, angka)"
                {...register('password')}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                {...register('confirmPassword')}
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
