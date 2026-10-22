import { z } from 'zod'
import { ProductCategory, ProductStatus, MediaType } from '@prisma/client'

/**
 * Validation schema for creating product listing
 * Based on REQ-PROD-01, REQ-PROD-02, REQ-PROD-03 in SRS.md
 */
export const createProductSchema = z.object({
  title: z
    .string()
    .min(3, 'Judul minimal 3 karakter')
    .max(100, 'Judul maksimal 100 karakter'),
  description: z
    .string()
    .min(10, 'Deskripsi minimal 10 karakter')
    .max(1000, 'Deskripsi maksimal 1000 karakter'),
  category: z.nativeEnum(ProductCategory, {
    errorMap: () => ({ message: 'Kategori tidak valid' }),
  }),
  basePrice: z
    .number()
    .int('Harga harus berupa bilangan bulat')
    .positive('Harga harus positif')
    .max(1_000_000_000, 'Harga maksimal Rp 1.000.000.000'),
  isBarter: z.boolean().default(false),
  barterTarget: z
    .string()
    .max(200, 'Target barter maksimal 200 karakter')
    .optional()
    .or(z.literal('')),
  conditionPercentage: z
    .number()
    .int('Persentase kondisi harus berupa bilangan bulat')
    .min(1, 'Kondisi minimal 1%')
    .max(100, 'Kondisi maksimal 100%'),
  campusName: z.string().min(1, 'Nama kampus harus diisi').max(100),
  codZoneId: z.string().cuid('ID zona COD tidak valid'),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

/**
 * Validation schema for updating product
 */
export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    status: z.nativeEnum(ProductStatus, {
      errorMap: () => ({ message: 'Status tidak valid' }),
    }).optional(),
  })

export type UpdateProductInput = z.infer<typeof updateProductSchema>

/**
 * Validation schema for uploading product media
 */
export const productMediaSchema = z.object({
  mediaUrl: z.string().url('URL media tidak valid'),
  mediaType: z.nativeEnum(MediaType, {
    errorMap: () => ({ message: 'Tipe media tidak valid' }),
  }),
  isPrimary: z.boolean().default(false),
})

export type ProductMediaInput = z.infer<typeof productMediaSchema>

/**
 * Validation schema for creating COD zone
 */
export const createCodZoneSchema = z.object({
  campusName: z.string().min(1, 'Nama kampus harus diisi').max(100),
  locationName: z.string().min(1, 'Nama lokasi harus diisi').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
})

export type CreateCodZoneInput = z.infer<typeof createCodZoneSchema>

/**
 * Validation schema for updating COD zone
 */
export const updateCodZoneSchema = createCodZoneSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type UpdateCodZoneInput = z.infer<typeof updateCodZoneSchema>

/**
 * Validation schema for submitting review
 * Based on REQ-TX-02 in SRS.md
 */
export const createReviewSchema = z.object({
  productId: z.string().cuid('ID produk tidak valid'),
  score: z
    .number()
    .int('Nilai harus berupa bilangan bulat')
    .min(1, 'Nilai minimal 1')
    .max(5, 'Nilai maksimal 5'),
  comment: z
    .string()
    .min(1, 'Ulasan harus diisi')
    .max(500, 'Ulasan maksimal 500 karakter'),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>

/**
 * Validation schema for product search filters
 * Based on REQ-SCH-01, REQ-SCH-02, REQ-SCH-03 in SRS.md
 */
export const productFilterSchema = z.object({
  category: z.nativeEnum(ProductCategory).optional(),
  minPrice: z.number().int().positive().optional(),
  maxPrice: z.number().int().positive().optional(),
  conditionMin: z.number().int().min(1).max(100).optional(),
  conditionMax: z.number().int().min(1).max(100).optional(),
  isBarter: z.boolean().optional(),
  verifiedStudentOnly: z.boolean().default(false),
  campusName: z.string().max(100).optional(),
  radiusKm: z
    .number()
    .int()
    .min(1, 'Radius minimal 1 km')
    .max(5, 'Radius maksimal 5 km')
    .optional(),
})

export type ProductFilterInput = z.infer<typeof productFilterSchema>
