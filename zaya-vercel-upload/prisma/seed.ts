import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. Create a School
  const school = await prisma.school.create({
    data: {
      name: 'Zaya Driving School',
      address: 'Lagos, Nigeria',
      phone: '08012345678',
    },
  })

  // 2. Hash password
  const passwordHash = await bcrypt.hash('admin123', 10)

  // 3. Create Super Admin
  await prisma.user.create({
    data: {
      schoolId: school.id,
      fullName: 'School Owner',
      email: 'admin@school.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })

  console.log('✅ Base data seeded!')
  console.log('---')
  console.log('Email: admin@school.com')
  console.log('Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
