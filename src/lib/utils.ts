import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate display price with admin markup
 * Formula: P_display = P_base + M_admin
 * Where M_admin = (P_base * markupPercentage / 100) + fixedFee
 *
 * @param basePrice - Base price set by seller (in Rupiah, no decimals)
 * @param markupPercentage - Admin markup percentage (e.g., 5 for 5%)
 * @param fixedFee - Admin fixed fee (in Rupiah)
 * @returns Display price (integer, rounded)
 */
export function calculateDisplayPrice(
  basePrice: number,
  markupPercentage: number,
  fixedFee: number
): number {
  const markup = Math.round((basePrice * markupPercentage) / 100) + fixedFee
  return basePrice + markup
}

/**
 * Format number to Indonesian Rupiah currency string
 * @param amount - Amount in Rupiah
 * @returns Formatted string (e.g., "Rp 150.000")
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Check if email is a valid student email (.ac.id domain)
 * @param email - Email address to check
 * @returns true if email ends with .ac.id
 */
export function isStudentEmail(email: string): boolean {
  return email.toLowerCase().endsWith('.ac.id')
}

/**
 * Generate a random OTP code
 * @param length - Length of OTP (default: 6)
 * @returns Numeric OTP string
 */
export function generateOtp(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  return otp
}

/**
 * Generate WhatsApp deep link with pre-filled message
 * @param phoneNumber - Seller's WhatsApp number (e.g., "6281234567890")
 * @param sellerName - Seller's name
 * @param productTitle - Product title
 * @param displayPrice - Display price in Rupiah
 * @param codZoneName - COD zone location name
 * @returns WhatsApp URL with encoded message
 */
export function generateWhatsAppLink(
  phoneNumber: string,
  sellerName: string,
  productTitle: string,
  displayPrice: number,
  codZoneName: string
): string {
  // Bersihkan karakter non-digit
  let cleanPhone = (phoneNumber || '').replace(/\D/g, '')

  // Konversi otomatis format Indonesia 08xx -> 628xx
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1)
  } else if (!cleanPhone.startsWith('62') && cleanPhone.length > 0) {
    cleanPhone = '62' + cleanPhone
  }

  const message = `Halo ${sellerName}, saya melihat barang Anda di Kampus Thrift:\n\n📦 *${productTitle}*\n💰 Harga: *${formatRupiah(displayPrice)}*\n📍 Titik COD: *${codZoneName}*\n\nApakah barang ini masih tersedia dan bisa COD di ${codZoneName}? Terima kasih!`
  const encodedMessage = encodeURIComponent(message)

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Calculate average honesty score from reviews
 * @param scores - Array of scores (1-5)
 * @returns Average score rounded to 1 decimal place
 */
export function calculateAverageScore(scores: number[]): number {
  if (scores.length === 0) return 0
  const sum = scores.reduce((acc, score) => acc + score, 0)
  return Math.round((sum / scores.length) * 10) / 10
}

/**
 * Validate condition percentage (1-100)
 * @param condition - Condition percentage
 * @returns true if valid
 */
export function isValidCondition(condition: number): boolean {
  return Number.isInteger(condition) && condition >= 1 && condition <= 100
}

/**
 * Validate price (positive integer, max 1 billion)
 * @param price - Price in Rupiah
 * @returns true if valid
 */
export function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price > 0 && price <= 1_000_000_000
}
