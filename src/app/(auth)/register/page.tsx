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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8 sm:py-12">
      <Card className="min-w-0 w-full max-w-md shadow-sm border-border">
        <CardHeader className="min-w-0 p-4 sm:p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <span className="text-2xl font-bold text-primary">KT</span>
          </div>
          <CardTitle className="min-w-0 leading-snug [&_svg]:shrink-0 text-xl sm:text-2xl font-bold text-foreground">Daftar Akun Baru</CardTitle>
          <CardDescription className="break-words">
            Bergabung dengan komunitas jual-beli & barter kampus
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
          {errorMessage && (
            <div className="mb-4 p-3 bg-destructive/10 border border-border rounded-md text-destructive text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="cth. Budi Santoso"
                {...register('name')}
                disabled={loading} className="min-h-11 text-base sm:text-sm"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <Label htmlFor="email">Email</Label>
                {isStudent && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-border">
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
                disabled={loading} className="min-h-11 text-base sm:text-sm"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}

              {isStudent && (
                <div className="mt-2 p-2.5 bg-primary/10 border border-border rounded-md text-xs text-primary flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>
                    Gunakan email <strong>.ac.id</strong> untuk otomatis mendapatkan <strong>Verified Student Badge</strong> dan akses fitur <strong>Barter</strong>!
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor="phoneWhatsapp">Nomor WhatsApp</Label>
              <Input
                id="phoneWhatsapp"
                placeholder="cth. 081234567890"
                {...register('phoneWhatsapp')}
                disabled={loading} className="min-h-11 text-base sm:text-sm"
              />
              {errors.phoneWhatsapp && (
                <p className="text-xs text-destructive">{errors.phoneWhatsapp.message}</p>
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter (huruf besar, kecil, angka)"
                {...register('password')}
                disabled={loading} className="min-h-11 text-base sm:text-sm"
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                {...register('confirmPassword')}
                disabled={loading} className="min-h-11 text-base sm:text-sm"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="min-h-11 w-full mt-2" disabled={loading}>
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
        <CardFooter className="gap-2 flex flex-wrap justify-center text-center border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
