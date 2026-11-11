'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isVerified = searchParams.get('verified') === 'true'

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (res?.error) {
        throw new Error(res.error)
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal masuk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="min-w-0 w-full max-w-md shadow-sm border-border">
      <CardHeader className="min-w-0 p-4 sm:p-6 text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
          <span className="text-2xl font-bold text-primary">KT</span>
        </div>
        <CardTitle className="min-w-0 leading-snug [&_svg]:shrink-0 text-xl sm:text-2xl font-bold text-foreground">Masuk Akun</CardTitle>
        <CardDescription className="break-words">
          Selamat datang kembali di Kampus Thrift
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 p-4 pt-0 sm:p-6 sm:pt-0">
        {isVerified && (
          <div className="mb-4 p-3 bg-success/10 border border-border rounded-md text-success text-sm flex items-center gap-2">
            <CheckCircle2 size={16} className="text-success shrink-0" />
            <span>Akun berhasil diverifikasi! Silakan masuk dengan kredensial Anda.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-destructive/10 border border-border rounded-md text-destructive text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              {...register('email')}
              disabled={loading} className="min-h-11 text-base sm:text-sm"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={loading} className="min-h-11 text-base sm:text-sm"
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="min-h-11 w-full mt-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Memproses...
              </>
            ) : (
              <>
                Masuk
                <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="gap-2 flex flex-wrap justify-center text-center border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Daftar di sini
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-8 sm:py-12">
      <Suspense fallback={<div>Memuat...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  )
}
