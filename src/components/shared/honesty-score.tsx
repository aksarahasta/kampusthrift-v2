import React from 'react'
import { Star } from 'lucide-react'

interface HonestyScoreProps {
  score: number // 0.0 - 5.0
  reviewCount?: number
  size?: 'sm' | 'md'
  showCount?: boolean
}

export function HonestyScore({
  score,
  reviewCount,
  size = 'md',
  showCount = true,
}: HonestyScoreProps) {
  const starSize = size === 'sm' ? 14 : 16
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className={`inline-flex items-center gap-1 font-medium text-amber-500 ${textSize}`}>
      <Star size={starSize} className="fill-amber-400 text-amber-400" />
      <span className="font-semibold text-slate-800">
        {score > 0 ? score.toFixed(1) : 'Baru'}
      </span>
      {showCount && reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-slate-400 font-normal">
          ({reviewCount})
        </span>
      )}
    </div>
  )
}
