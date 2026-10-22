import { PrismaClient, Role, ProductCategory, MediaType, ProductStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create Default Admin System Config (REQ-ADM-01)
  const config = await prisma.systemConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      markupPercentage: 5.0,
      fixedFee: 1000,
    },
  })
  console.log('System Config created:', config)

  // 2. Create Default COD Safe Zones (REQ-ADM-04)
  const codZones = [
    {
      campusName: 'Universitas Indonesia',
      locationName: 'Perpustakaan Pusat UI (Crystal of Knowledge)',
      description: 'Lantai 1 dekat area kafe, ramai dan terang.',
    },
    {
      campusName: 'Universitas Indonesia',
      locationName: 'Kantin Dallas FIB UI',
      description: 'Area kantin dekat pintu masuk utama.',
    },
    {
      campusName: 'Institut Teknologi Bandung',
      locationName: 'Plaza Widya ITB (Depan Labtek V)',
      description: 'Area terbuka, aman untuk COD siang-sore.',
    },
    {
      campusName: 'Universitas Gadjah Mada',
      locationName: 'Gelanggang Mahasiswa UGM',
      description: 'Area lobi gelanggang.',
    },
  ]

  for (const zone of codZones) {
    await prisma.codZone.create({
      data: zone,
    })
  }
  console.log('COD Safe Zones created:', codZones.length)

  // 3. Create Sample Admin User
  const adminPassword = await bcrypt.hash('Admin1234!', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kampusthrift.id' },
    update: {},
    create: {
      name: 'Admin Kampus Thrift',
      email: 'admin@kampusthrift.id',
      password: adminPassword,
      phoneWhatsapp: '081234567890',
      role: Role.ADMIN,
      isVerifiedStudent: false,
    },
  })
  console.log('Admin user created:', admin.email)

  // 4. Create Sample Student User (Verified)
  const studentPassword = await bcrypt.hash('Student1234!', 10)
  const student = await prisma.user.upsert({
    where: { email: 'budi.santoso@ui.ac.id' },
    update: {},
    create: {
      name: 'Budi Santoso',
      email: 'budi.santoso@ui.ac.id',
      password: studentPassword,
      phoneWhatsapp: '081298765432',
      campusName: 'Universitas Indonesia',
      faculty: 'Fakultas Ilmu Komputer',
      role: Role.USER,
      isVerifiedStudent: true, // Auto verified because .ac.id
      honestyScore: 4.8,
    },
  })
  console.log('Student user created:', student.email)

  // 5. Create Sample General Public User
  const publicPassword = await bcrypt.hash('Public1234!', 10)
  const publicUser = await prisma.user.upsert({
    where: { email: 'warga.sekitar@gmail.com' },
    update: {},
    create: {
      name: 'Agus Pratama',
      email: 'warga.sekitar@gmail.com',
      password: publicPassword,
      phoneWhatsapp: '081345678901',
      role: Role.USER,
      isVerifiedStudent: false,
      honestyScore: 4.2,
    },
  })
  console.log('General public user created:', publicUser.email)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
