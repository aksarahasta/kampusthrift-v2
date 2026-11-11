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
    <div className={`inline-flex shrink-0 items-center gap-1 font-medium text-warning ${textSize}`}>
      <Star size={starSize} className="fill-warning/20 text-warning" aria-hidden="true" />
      <span className="font-semibold text-foreground">
        {score > 0 ? score.toFixed(1) : 'Baru'}
      </span>
      {showCount && reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-muted-foreground font-normal">
          ({reviewCount})
        </span>
      )}
    </div>
  )
}
