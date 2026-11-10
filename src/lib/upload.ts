/**
 * Helper upload langsung ke Supabase Storage via Presigned Upload URL
 * Menghindari limit Vercel 4.5MB (Request Entity Too Large / 413)
 * Mendukung video hingga 50MB dan foto resolusi tinggi
 */
export async function uploadMediaDirect(
  file: File,
  mediaType: 'IMAGE' | 'VIDEO'
): Promise<{ mediaUrl: string; mediaType: string }> {
  // 1. Dapatkan Presigned Signed URL dari API (hanya mengirim metadata JSON kecil)
  const signRes = await fetch('/api/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || (mediaType === 'VIDEO' ? 'video/mp4' : 'image/jpeg'),
      mediaType,
    }),
  })

  // Tangani jika respon bukan JSON (misal edge error)
  if (!signRes.ok) {
    const errorJson = await signRes.json().catch(() => null)
    throw new Error(errorJson?.error || 'Gagal menyiapkan tiket upload ke storage')
  }

  const { signedUrl, publicUrl } = await signRes.json()

  // 2. Upload file stream langsung ke Supabase Storage (bypasses Vercel Serverless proxy)
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || (mediaType === 'VIDEO' ? 'video/mp4' : 'image/jpeg'),
    },
    body: file,
  })

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => '')
    throw new Error(`Gagal mengunggah file ke Supabase Storage (${uploadRes.status} ${errText})`)
  }

  return {
    mediaUrl: publicUrl,
    mediaType,
  }
}

