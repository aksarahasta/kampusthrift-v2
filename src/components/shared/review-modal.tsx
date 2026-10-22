'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Loader2, CheckCircle2 } from 'lucide-react'

interface ReviewModalProps {
  productId: string
  productTitle: string
  sellerName: string
  onSuccess?: () => void
  onClose?: () => void
}

export function ReviewModal({
  productId,
  productTitle,
  sellerName,
  onSuccess,
  onClose,
}: ReviewModalProps) {
  const [score, setScore] = useState(5)
  const [hoverScore, setHoverScore] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError('Harap tulis ulasan Anda')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          score,
          comment,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Gagal mengirim ulasan')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="max-w-md w-full">
        <CardContent className="py-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-emerald-600" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Terima Kasih!</h3>
          <p className="text-sm text-slate-600 mt-1">
            Ulasan Anda telah dikirim dan membantu penjual meningkatkan kepercayaan.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle className="text-lg">Beri Rating Transaksi</CardTitle>
        <CardDescription>
          Bagaimana pengalaman Anda bertransaksi dengan <strong>{sellerName}</strong> untuk barang <strong>"{productTitle}"</strong>?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Honesty Score</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setScore(star)}
                onMouseEnter={() => setHoverScore(star)}
                onMouseLeave={() => setHoverScore(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={`${
                    (hoverScore || score) >= star
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  } transition-colors`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-semibold text-slate-700">
              {score}/5
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {score === 5
              ? 'Sangat Puas - Barang sesuai deskripsi & penjual ramah'
              : score === 4
                ? 'Puas - Barang sesuai ekspektasi'
                : score === 3
                  ? 'Cukup - Ada sedikit perbedaan dengan deskripsi'
                  : score === 2
                    ? 'Kurang Puas - Barang tidak sesuai ekspektasi'
                    : 'Sangat Kecewa - Transaksi bermasalah'}
          </p>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label htmlFor="comment">Ulasan Anda</Label>
          <textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ceritakan pengalaman transaksi Anda..."
            className="w-full p-3 rounded-md border border-input bg-background text-sm resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Mengirim...
              </>
            ) : (
              'Kirim Ulasan'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
