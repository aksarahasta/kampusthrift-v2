import { PrismaClient, Role, ProductCategory, MediaType, ProductStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create Default Admin System Config (REQ-ADM-01)
  const config = await prisma.systemConfig.upsert({
    where: { id: 'default-config' },
    update: {
      markupPercentage: 5.0,
      fixedFee: 1000,
    },
    create: {
      id: 'default-config',
      markupPercentage: 5.0,
      fixedFee: 1000,
    },
  })
  console.log('System Config created/updated:', config)

  // 2. Create Default COD Safe Zones (REQ-ADM-04)
  const codZonesData = [
    // --- Universitas Negeri Semarang (UNNES) Only ---
    {
      campusName: 'Universitas Negeri Semarang (UNNES)',
      locationName: 'Fakultas Teknik (FT)',
      description: 'Area lobi dekanat FT / gazebo teknik yang ramai dan aman.',
    },
    {
      campusName: 'Universitas Negeri Semarang (UNNES)',
      locationName: 'Fakultas Ilmu Keolahragaan (FIK)',
      description: 'Area depan gedung dekanat FIK / lapangan olahraga.',
    },
    {
      campusName: 'Universitas Negeri Semarang (UNNES)',
      locationName: 'Fakultas Hukum (FH)',
      description: 'Lobi utama gedung dekanat FH UNNES.',
    },
    {
      campusName: 'Universitas Negeri Semarang (UNNES)',
      locationName: 'Fakultas Ilmu Sosial dan Ilmu Politik (FISIP)',
      description: 'Area taman / lobi gedung C FISIP UNNES.',
    },
    {
      campusName: 'Universitas Negeri Semarang (UNNES)',
      locationName: 'Fakultas Ilmu Pendidikan dan Psikologi (FIPP)',
      description: 'Lobi gedung A FIPP UNNES.',
    },
    {
      campusName: 'Universitas Negeri Semarang (UNNES)',
      locationName: 'Fakultas Matematika dan Ilmu Pengetahuan Alam (FMIPA)',
      description: 'Area lobi dekanat FMIPA / gedung D.',
    },
    {
      campusName: 'Universitas Negeri Semarang (UNNES)',
      locationName: 'Fakultas Bahasa dan Seni (FBS)',
      description: 'Area B7 / panggung terbuka FBS UNNES.',
    },  
  ]

  const createdZones: any[] = []
  for (const zone of codZonesData) {
    const existing = await prisma.codZone.findFirst({
      where: {
        campusName: zone.campusName,
        locationName: zone.locationName,
      },
    })
    if (!existing) {
      const z = await prisma.codZone.create({ data: zone })
      createdZones.push(z)
    } else {
      createdZones.push(existing)
    }
  }

  // Nonaktifkan zona COD selain UNNES
  await prisma.codZone.updateMany({
    where: {
      campusName: {
        not: 'Universitas Negeri Semarang (UNNES)',
      },
    },
    data: {
      isActive: false,
    },
  })
  console.log(`COD Safe Zones UNNES created & ready: ${createdZones.length}`)

  // 3. Create Sample Admin User
  const adminPassword = await bcrypt.hash('Admin1234!', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kampusthrift.id' },
    update: { password: adminPassword },
    create: {
      name: 'Admin Kampus Thrift',
      email: 'admin@kampusthrift.id',
      password: adminPassword,
      phoneWhatsapp: '081234567890',
      role: Role.ADMIN,
      isVerifiedStudent: false,
    },
  })
  console.log('Admin user ready:', admin.email)

  // 4. Create Sample Student User (Verified)
  const studentPassword = await bcrypt.hash('Student1234!', 10)
  const student = await prisma.user.upsert({
    where: { email: 'budi.santoso@ui.ac.id' },
    update: {
      password: studentPassword,
      isVerifiedStudent: true,
      honestyScore: 4.8,
    },
    create: {
      name: 'Budi Santoso',
      email: 'budi.santoso@ui.ac.id',
      password: studentPassword,
      phoneWhatsapp: '081298765432',
      campusName: 'Universitas Indonesia',
      faculty: 'Fakultas Ilmu Komputer',
      role: Role.USER,
      isVerifiedStudent: true,
      honestyScore: 4.8,
    },
  })
  console.log('Student user ready:', student.email)

  // 5. Create Sample General Public User
  const publicPassword = await bcrypt.hash('Public1234!', 10)
  const publicUser = await prisma.user.upsert({
    where: { email: 'warga.sekitar@gmail.com' },
    update: {
      password: publicPassword,
      honestyScore: 4.2,
    },
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
  console.log('General public user ready:', publicUser.email)

  // 6. Create Sample Products if none exist
  const existingProductCount = await prisma.product.count()
  if (existingProductCount === 0) {
    const uiZone = createdZones.find((z) => z.campusName === 'Universitas Indonesia') || createdZones[0]
    const itbZone = createdZones.find((z) => z.campusName === 'Institut Teknologi Bandung') || createdZones[0]
    const ugmZone = createdZones.find((z) => z.campusName === 'Universitas Gadjah Mada') || createdZones[0]

    const sampleProducts = [
      {
        sellerId: student.id,
        title: 'Buku Kalkulus Purcell Edisi 9 (Original Bahasa Indo)',
        description: 'Buku teks kuliah wajib Fasilkom / Teknik. Kondisi masih sangat mulus, ada sedikit coretan pensil di bab 2. Dijual karena sudah lulus mata kuliahnya.',
        category: ProductCategory.BUKU_KULIAH,
        basePrice: 65000,
        displayPrice: 69250, // 65000 + 5% + 1000
        isBarter: true,
        barterTarget: 'Buku Aljabar Linear atau Kalkulus Lanjut',
        conditionPercentage: 90,
        campusName: 'Universitas Indonesia',
        codZoneId: uiZone.id,
        status: ProductStatus.ACTIVE,
        media: [
          {
            mediaUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
            mediaType: MediaType.IMAGE,
            isPrimary: true,
          },
          {
            mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-person-typing-on-a-laptop-42994-large.mp4',
            mediaType: MediaType.VIDEO,
            isPrimary: false,
          },
        ],
      },
      {
        sellerId: student.id,
        title: 'Kipas Angin Meja Miyako 9 Inch (Angin Kencang)',
        description: 'Cocok buat anak kosan yang kamarnya gerah. Kondisi normal putaran 2 speed mantap, suara halus, tidak ada retak.',
        category: ProductCategory.ALAT_KOS_RUMAH_TANGGA,
        basePrice: 75000,
        displayPrice: 79750,
        isBarter: false,
        conditionPercentage: 85,
        campusName: 'Universitas Indonesia',
        codZoneId: uiZone.id,
        status: ProductStatus.ACTIVE,
        media: [
          {
            mediaUrl: 'https://images.unsplash.com/photo-1591143896568-d36c1e57c66d?auto=format&fit=crop&q=80&w=800',
            mediaType: MediaType.IMAGE,
            isPrimary: true,
          },
          {
            mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-person-typing-on-a-laptop-42994-large.mp4',
            mediaType: MediaType.VIDEO,
            isPrimary: false,
          },
        ],
      },
      {
        sellerId: publicUser.id,
        title: 'Monitor LED Samsung 20 Inch HDMI & VGA Normal',
        description: 'Monitor second normal no dead pixel. Bonus kabel power dan kabel HDMI. COD di perpustakaan ITB.',
        category: ProductCategory.ELEKTRONIK,
        basePrice: 380000,
        displayPrice: 400000,
        isBarter: false,
        conditionPercentage: 88,
        campusName: 'Institut Teknologi Bandung',
        codZoneId: itbZone.id,
        status: ProductStatus.ACTIVE,
        media: [
          {
            mediaUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800',
            mediaType: MediaType.IMAGE,
            isPrimary: true,
          },
          {
            mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-person-typing-on-a-laptop-42994-large.mp4',
            mediaType: MediaType.VIDEO,
            isPrimary: false,
          },
        ],
      },
      {
        sellerId: student.id,
        title: 'Hoodie Uniqlo Fleece Navy Size L Original',
        description: 'Warna masih pekat, karet rib tangan dan bawah kencang. Nyaman buat kuliah pagi atau nugas di perpus dingin.',
        category: ProductCategory.FASHION,
        basePrice: 90000,
        displayPrice: 95500,
        isBarter: true,
        barterTarget: 'Kemeja flanel flanel size L / XL',
        conditionPercentage: 92,
        campusName: 'Universitas Gadjah Mada',
        codZoneId: ugmZone.id,
        status: ProductStatus.ACTIVE,
        media: [
          {
            mediaUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800',
            mediaType: MediaType.IMAGE,
            isPrimary: true,
          },
          {
            mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-person-typing-on-a-laptop-42994-large.mp4',
            mediaType: MediaType.VIDEO,
            isPrimary: false,
          },
        ],
      },
      {
        sellerId: student.id,
        title: 'Kalkulator Scientific Casio fx-991EX ClassWiz',
        description: 'Kalkulator sakti buat anak teknik dan sains. Fungsi matriks, integral, equation semua normal lancar. Layar jernih.',
        category: ProductCategory.ELEKTRONIK,
        basePrice: 160000,
        displayPrice: 169000,
        isBarter: false,
        conditionPercentage: 95,
        campusName: 'Universitas Indonesia',
        codZoneId: uiZone.id,
        status: ProductStatus.ACTIVE,
        media: [
          {
            mediaUrl: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&q=80&w=800',
            mediaType: MediaType.IMAGE,
            isPrimary: true,
          },
          {
            mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-person-typing-on-a-laptop-42994-large.mp4',
            mediaType: MediaType.VIDEO,
            isPrimary: false,
          },
        ],
      },
    ]

    for (const p of sampleProducts) {
      const { media, ...productData } = p
      const created = await prisma.product.create({
        data: productData,
      })
      for (const m of media) {
        await prisma.productMedia.create({
          data: {
            productId: created.id,
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
            isPrimary: m.isPrimary,
          },
        })
      }
    }
    console.log(`Seeded ${sampleProducts.length} sample products with media`)
  }

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
