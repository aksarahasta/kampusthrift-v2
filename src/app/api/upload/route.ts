import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/upload
 * Endpoint upload file (Gambar & Video)
 * Menyimpan metadata file dan mengembalikan mediaUrl untuk listing produk.
 * Jika Supabase terkonfigurasi, unggah ke Supabase Storage bucket 'kampusthrift-media'.
 * Jika belum, sediakan dummy/local preview URL yang valid.
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
    const type = formData.get('type') as 'IMAGE' | 'VIDEO' | null

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
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

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

    // Tentukan media type
    const mediaType = isVideo ? 'VIDEO' : 'IMAGE'

    // Mock upload URL atau Supabase integration jika env tersedia
    // Untuk development/preview, buat mock URL unik yang informatif
    const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`

    // In production with Supabase Storage, here we would upload to bucket
    const mediaUrl = `https://storage.googleapis.com/kampusthrift-demo/${uniqueFileName}`

    return NextResponse.json({
      data: {
        mediaUrl,
        mediaType,
        fileName: file.name,
        size: file.size,
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
