import { MarketplaceTransactionStatus, Prisma, PrismaClient, ProductStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export class MarketplaceTransactionError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'MarketplaceTransactionError'
  }
}

export async function runSerializable<T>(
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  client: PrismaClient = prisma
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await client.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt < 2
      ) {
        continue
      }
      throw error
    }
  }
}

/** Lazily releases reservations whose 24-hour acceptance window elapsed. */
export async function expireStaleReservations(now = new Date()): Promise<void> {
  const staleReservations = await prisma.marketplaceTransaction.findMany({
    where: {
      status: MarketplaceTransactionStatus.RESERVED,
      expiresAt: { lte: now },
    },
    select: { id: true, productId: true },
  })

  for (const reservation of staleReservations) {
    await runSerializable(async (transaction) => {
      const expired = await transaction.marketplaceTransaction.updateMany({
        where: {
          id: reservation.id,
          status: MarketplaceTransactionStatus.RESERVED,
          expiresAt: { lte: now },
        },
        data: {
          status: MarketplaceTransactionStatus.EXPIRED,
          updatedAt: now,
        },
      })

      if (expired.count > 0) {
        await transaction.product.updateMany({
          where: {
            id: reservation.productId,
            status: ProductStatus.RESERVED,
          },
          data: { status: ProductStatus.ACTIVE, updatedAt: now },
        })
      }
    })
  }
}

