import fs from 'fs'
import path from 'path'
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Load .env secara manual tanpa dependensi eksternal
try {
  const envPath = path.resolve(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const firstEqual = trimmed.indexOf('=')
        if (firstEqual !== -1) {
          const key = trimmed.slice(0, firstEqual).trim()
          let val = trimmed.slice(firstEqual + 1).trim()
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1)
          } else if (val.startsWith("'") && val.endsWith("'")) {
            val = val.slice(1, -1)
          }
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  }
} catch (e) {
  console.warn('Gagal membaca file .env secara manual:', e)
}

const prisma = new PrismaClient()

async function main() {
  console.log('--- SEDANG MEMBUAT / RESET AKUN ADMIN ---')
  const email = 'admin@kampusthrift.id'
  const rawPassword = 'Admin1234!'
  const hashedPassword = await bcrypt.hash(rawPassword, 10)

  // Cek apakah user sudah ada
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log(`User ${email} ditemukan di database. Mengupdate password & role...`)
    const updated = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: Role.ADMIN,
        name: 'Admin Kampus Thrift',
      },
    })
    console.log('✅ SUKSES: Akun Admin berhasil di-UPDATE!')
    console.log(`Email   : ${updated.email}`)
    console.log(`Password: ${rawPassword}`)
    console.log(`Role    : ${updated.role}`)
  } else {
    console.log(`User ${email} belum ada. Membuat akun admin baru...`)
    const created = await prisma.user.create({
      data: {
        name: 'Admin Kampus Thrift',
        email,
        password: hashedPassword,
        phoneWhatsapp: '081234567890',
        role: Role.ADMIN,
        isVerifiedStudent: false,
      },
    })
    console.log('✅ SUKSES: Akun Admin baru berhasil dibuat!')
    console.log(`Email   : ${created.email}`)
    console.log(`Password: ${rawPassword}`)
    console.log(`Role    : ${created.role}`)
  }
}

main()
  .catch((err) => {
    console.error('❌ GAGAL:', err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
