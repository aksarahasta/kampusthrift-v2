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
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <Badge
      variant="default"
      className={`bg-blue-600 hover:bg-blue-700 text-white gap-1 font-medium ${textSize} ${className || ''}`}
    >
      <GraduationCap size={iconSize} />
      {showText && <span>Verified Student</span>}
    </Badge>
  )
}
