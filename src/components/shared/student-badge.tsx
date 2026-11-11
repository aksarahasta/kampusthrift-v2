import React from 'react'
import { GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface StudentBadgeProps {
  size?: 'sm' | 'md'
  showText?: boolean
  className?: string
}

export function StudentBadge({
  size = 'md',
  showText = true,
  className,
}: StudentBadgeProps) {
  const iconSize = size === 'sm' ? 12 : 14
  const textSize = 'text-xs'

  return (
    <Badge
      variant="default"
      className={`bg-primary text-primary-foreground gap-1 font-medium ${textSize} ${className || ''}`}
            title="Mahasiswa terverifikasi"
            aria-label={!showText ? 'Mahasiswa terverifikasi' : undefined}
    >
      <GraduationCap size={iconSize} aria-hidden="true" />
      {showText && <span>Verified Student</span>}
    </Badge>
  )
}
