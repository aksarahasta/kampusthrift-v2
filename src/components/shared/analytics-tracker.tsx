'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function AnalyticsTracker() {
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    // Avoid double logging on same path render
    if (lastTrackedPath.current === pathname) return
    lastTrackedPath.current = pathname

    try {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathname }),
      }).catch(() => {})
    } catch (e) {
      // Ignore background analytics error
    }
  }, [pathname])

  return null
}

