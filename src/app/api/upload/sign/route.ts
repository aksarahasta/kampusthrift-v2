import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

/**
 * POST /api/upload/sign
 * Menghasilkan Presigned Upload URL Supabase Storage
 * Memungkinkan client mengunggah berkas besar (video hingga 50MB, foto HD)
 * langsung ke Supabase Storage tanpa terkena batasan Vercel Serverless payload 4.5MB!
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Anda harus login untuk mengunggah media' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { fileName, fileType, mediaType } = body

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'Informasi file tidak lengkap' },
        { status: 400 }
      )
    }

    const isImage = fileType.startsWith('image/')
    const isVideo = fileType.startsWith('video/')

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Format berkas tidak didukung. Harap unggah foto atau video.' },
        { status: 400 }
      )
    }

    const type = isVideo ? 'VIDEO' : 'IMAGE'
    const ext = fileName.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
    const uniqueFileName = `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`

    if (!supabase) {
      return NextResponse.json(
        { error: 'Konfigurasi storage Supabase belum disetel' },
        { status: 500 }
      )
    }

    // Buat Signed Upload URL (berlaku 10 menit)
    const { data, error } = await supabase.storage
      .from('kampusthrift-media')
      .createSignedUploadUrl(uniqueFileName)

    if (error || !data) {
      console.error('Supabase signed URL error:', error)
      return NextResponse.json(
        { error: error?.message || 'Gagal membuat URL upload' },
        { status: 500 }
      )
    }

    // Ambil public URL yang akan digunakan setelah upload selesai
    const { data: publicData } = supabase.storage
      .from('kampusthrift-media')
      .getPublicUrl(uniqueFileName)

    return NextResponse.json({
      signedUrl: data.signedUrl,
      publicUrl: publicData.publicUrl,
      fileName: uniqueFileName,
      mediaType: type,
    })
  } catch (error) {
    console.error('Error generating signed upload URL:', error)
    return NextResponse.json(
      { error: 'Gagal menyiapkan upload file' },
      { status: 500 }
    )
  }
}

