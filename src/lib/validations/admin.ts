import { z } from 'zod'

/**
 * Validation schema for admin system configuration
 * Based on REQ-ADM-01 in SRS.md
 */
export const systemConfigSchema = z.object({
  markupPercentage: z
    .number()
    .min(0, 'Persentase markup minimal 0%')
    .max(50, 'Persentase markup maksimal 50%')
    .default(5.0),
  fixedFee: z
    .number()
    .int('Biaya tetap harus berupa bilangan bulat')
    .min(0, 'Biaya tetap minimal 0')
    .max(100000, 'Biaya tetap maksimal 100.000')
    .default(1000),
})

export type SystemConfigInput = z.infer<typeof systemConfigSchema>

/**
 * Validation schema for banning/unbanning users
 * Based on REQ-ADM-03 in SRS.md
 */
export const userActionSchema = z.object({
  userId: z.string().cuid('ID pengguna tidak valid'),
  action: z.enum(['SUSPEND', 'UNSUSPEND', 'BAN']),
  reason: z.string().max(500, 'Alasan maksimal 500 karakter').optional(),
})

export type UserActionInput = z.infer<typeof userActionSchema>

/**
 * Validation schema for moderating products
 * Based on REQ-ADM-02 in SRS.md
 */
export const productModerationSchema = z.object({
  productId: z.string().cuid('ID produk tidak valid'),
  action: z.enum(['HIDE', 'UNHIDE', 'DELETE']),
  reason: z.string().max(500, 'Alasan maksimal 500 karakter').optional(),
})

export type ProductModerationInput = z.infer<typeof productModerationSchema>

/**
 * Validation schema for admin statistics filters
 */
export const adminStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  campusName: z.string().max(100).optional(),
})

export type AdminStatsInput = z.infer<typeof adminStatsSchema>
