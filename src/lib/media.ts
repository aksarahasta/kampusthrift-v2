/**
 * Media optimization utilities for images and videos
 * Based on NFR-Performance requirements in PRD.md & SRS.md
 */

/**
 * Validasi dan optimasi video sebelum upload
 * Batasan: MP4/WebM, resolution rekomendasi 720p, max 50MB, duration 5-30 detik
 */
export interface VideoValidationResult {
  isValid: boolean
  error?: string
  duration?: number
  dimensions?: { width: number; height: number }
}

export function validateVideoFile(file: File): Promise<VideoValidationResult> {
  return new Promise((resolve) => {
    // Check file size (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_SIZE) {
      return resolve({
        isValid: false,
        error: 'Ukuran video maksimal 50MB',
      })
    }

    // Check mime type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!validTypes.includes(file.type)) {
      return resolve({
        isValid: false,
        error: 'Format video harus MP4, WebM, atau MOV',
      })
    }

    // Check duration and dimensions using video element
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      const duration = video.duration

      // Duration: 5 - 60 seconds
      if (duration < 5) {
        return resolve({
          isValid: false,
          error: 'Durasi video minimal 5 detik untuk membuktikan kondisi riil',
          duration,
        })
      }

      if (duration > 60) {
        return resolve({
          isValid: false,
          error: 'Durasi video maksimal 60 detik',
          duration,
        })
      }

      resolve({
        isValid: true,
        duration,
        dimensions: {
          width: video.videoWidth,
          height: video.videoHeight,
        },
      })
    }

    video.onerror = () => {
      resolve({
        isValid: false,
        error: 'Berkas video rusak atau tidak dapat diputar',
      })
    }

    video.src = URL.createObjectURL(file)
  })
}

/**
 * Kompresi gambar sisi klien menggunakan Canvas API
 * Mengurangi ukuran gambar hingga ~70-80% sebelum upload ke cloud
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return reject(new Error('Canvas context not available'))
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Canvas to Blob conversion failed'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Image load failed'))
    }
    reader.onerror = () => reject(new Error('File read failed'))
  })
}
