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
    <Card className="w-full max-w-md shadow-lg border-slate-200">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
          {isSuccess ? (
            <CheckCircle2 size={28} className="text-emerald-600" />
          ) : (
            <GraduationCap size={28} className="text-blue-600" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold text-slate-800">
          {isSuccess ? 'Verifikasi Berhasil!' : 'Verifikasi Kode OTP'}
        </CardTitle>
        <CardDescription>
          {isSuccess
            ? 'Akun Anda telah berhasil diverifikasi'
            : `Masukkan 6-digit kode OTP yang telah dikirim ke ${emailParam || 'email Anda'}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}
          >
            {message.text}
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4 text-center py-4">
            {isStudentVerified && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-2xl mb-2 block">🎓</span>
                <h4 className="font-semibold text-blue-900">Selamat! Verified Student Aktif</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Anda telah mendapatkan badge resmi mahasiswa dan dapat menggunakan fitur barter barang preloved!
                </p>
              </div>
            )}
            <p className="text-sm text-slate-500">
              Mengalihkan Anda ke halaman login dalam 3 detik...
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Masuk Sekarang
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('email')} />

            <div className="space-y-1">
              <Label htmlFor="otpCode" className="text-center block text-sm font-medium">
                Kode Verifikasi (6 Digit)
              </Label>
              <Input
                id="otpCode"
                placeholder="123456"
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                {...register('otpCode')}
                disabled={loading}
              />
              {errors.otpCode && (
                <p className="text-xs text-red-500 text-center">{errors.otpCode.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
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
        <CardFooter className="flex flex-col gap-2 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Tidak menerima kode? Periksa folder spam atau
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResendOtp}
            disabled={resending}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs"
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={<div>Memuat...</div>}>
        <OtpContent />
      </Suspense>
    </div>
  )
}
