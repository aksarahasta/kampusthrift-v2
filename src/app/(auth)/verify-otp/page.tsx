'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { otpVerifySchema, OtpVerifyInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, ArrowRight, Loader2, CheckCircle2, RotateCcw } from 'lucide-react'

function OtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') || ''

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isStudentVerified, setIsStudentVerified] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OtpVerifyInput>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: {
      email: emailParam,
    },
  })

  useEffect(() => {
    if (emailParam) {
      setValue('email', emailParam)
    }
  }, [emailParam, setValue])

  const onSubmit = async (data: OtpVerifyInput) => {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Verifikasi OTP gagal')
      }

      setIsSuccess(true)
      setIsStudentVerified(result.data?.isVerifiedStudent || false)
      setMessage({ text: result.message, type: 'success' })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?verified=true')
      }, 3000)
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Gagal verifikasi OTP',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!emailParam) {
      setMessage({ text: 'Email tidak ditemukan', type: 'error' })
      return
    }

    setResending(true)
    setMessage(null)

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Gagal mengirim ulang OTP')
      }

      setMessage({ text: result.message, type: 'success' })
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Gagal mengirim ulang OTP',
        type: 'error',
      })
    } finally {
      setResending(false)
    }
  }

  return (
    <Card className="min-w-0 w-full max-w-md shadow-sm border-border">
      <CardHeader className="min-w-0 p-4 sm:p-6 text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          {isSuccess ? (
            <CheckCircle2 size={28} className="text-success" />
          ) : (
            <GraduationCap size={28} className="text-primary" />
          )}
        </div>
        <CardTitle className="min-w-0 leading-snug [&_svg]:shrink-0 text-xl sm:text-2xl font-bold text-foreground">
          {isSuccess ? 'Verifikasi Berhasil!' : 'Verifikasi Kode OTP'}
        </CardTitle>
        <CardDescription className="break-words">
          {isSuccess
            ? 'Akun Anda telah berhasil diverifikasi'
            : `Masukkan 6-digit kode OTP yang telah dikirim ke ${emailParam || 'email Anda'}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
        {message && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-success/10 border border-border text-success'
                : 'bg-destructive/10 border border-border text-destructive'
            }`}
          >
            {message.text}
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4 text-center py-4">
            {isStudentVerified && (
              <div className="p-4 bg-primary/10 border border-border rounded-lg">
                <GraduationCap size={28} className="mx-auto mb-2 text-primary" aria-hidden="true" />
                <h4 className="font-semibold text-primary">Selamat! Verified Student Aktif</h4>
                <p className="text-xs text-primary mt-1">
                  Anda telah mendapatkan badge resmi mahasiswa dan dapat menggunakan fitur barter barang preloved!
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Mengalihkan Anda ke halaman login dalam 3 detik...
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="min-h-11 w-full"
            >
              Masuk Sekarang
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('email')} />

            <div className="min-w-0 space-y-2">
              <Label htmlFor="otpCode" className="text-center block text-sm font-medium">
                Kode Verifikasi (6 Digit)
              </Label>
              <Input
                id="otpCode"
                placeholder="123456"
                maxLength={6}
                inputMode="numeric"
                                autoComplete="one-time-code"
                                className="h-12 text-center text-2xl tracking-[0.3em] sm:tracking-[0.5em] tabular-nums"
                {...register('otpCode')}
                disabled={loading}
              />
              {errors.otpCode && (
                <p className="text-xs text-destructive text-center">{errors.otpCode.message}</p>
              )}
            </div>

            <Button type="submit" className="min-h-11 w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Verifikasi Akun
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
      {!isSuccess && (
        <CardFooter className="gap-2 flex flex-col border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Tidak menerima kode? Periksa folder spam atau
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResendOtp}
            disabled={resending}
            className="min-h-11 text-primary hover:text-primary hover:bg-primary/10 text-sm"
          >
            {resending ? (
              <>
                <Loader2 size={12} className="animate-spin mr-1" />
                Mengirim ulang...
              </>
            ) : (
              <>
                <RotateCcw size={12} className="mr-1" />
                Kirim Ulang Kode OTP
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8 sm:py-12">
      <Suspense fallback={<div>Memuat...</div>}>
        <OtpContent />
      </Suspense>
    </div>
  )
}
