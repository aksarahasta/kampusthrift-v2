import { NextRequest, NextResponse } from 'next/server'
import { recordVisit } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = body?.path || '/'
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'client'

    await recordVisit(path, ip)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 200 })
  }
}

