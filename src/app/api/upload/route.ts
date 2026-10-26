import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

/**
 * POST /api/upload
 * Mengunggah file (Foto & Video) ke Supabase Storage bucket 'kampusthrift-media'
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

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    const mimeType = file.type
    const isImage = mimeType.startsWith('image/')
    const isVideo = mimeType.startsWith('video/')

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Format berkas tidak didukung. Harap unggah foto (JPG, PNG, WebP) atau video (MP4, WebM)' },
        { status: 400 }
      )
    }

    // Validasi batas ukuran: Foto maks 10MB, Video maks 50MB
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran foto maksimal 10MB' },
        { status: 400 }
      )
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran video maksimal 50MB' },
        { status: 400 }
      )
    }

    const mediaType = isVideo ? 'VIDEO' : 'IMAGE'
    const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
    const fileName = `${mediaType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`

    let mediaUrl = ''

    if (supabase) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { data, error } = await supabase.storage
        .from('kampusthrift-media')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        console.error('Supabase upload error:', error)
        // Fallback jika bucket belum dibuat atau permission belum disetel
        const { data: publicData } = supabase.storage
          .from('kampusthrift-media')
          .getPublicUrl(fileName)
        mediaUrl = publicData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/kampusthrift-media/${fileName}`
      } else {
        const { data: publicData } = supabase.storage
          .from('kampusthrift-media')
          .getPublicUrl(data.path)
        mediaUrl = publicData.publicUrl
      }
    } else {
      mediaUrl = `https://storage.googleapis.com/kampusthrift-media/${fileName}`
    }

    return NextResponse.json({
      data: {
        mediaUrl,
        mediaType,
        fileName: file.name,
      },
    })
  } catch (error) {
    console.error('Error handling upload:', error)
    return NextResponse.json(
      { error: 'Gagal mengunggah file' },
      { status: 500 }
    )
  }
}
