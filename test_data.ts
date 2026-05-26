import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const student = await prisma.student.findFirst()
  if (student) {
    console.log('\n\n--- STUDENT MAGIC LINK ---')
    console.log(`http://10.127.131.31:3000/student/${student.loginToken}`)
    console.log('--------------------------\n\n')
  } else {
    console.log('\n\nNo students registered yet! Go register one via the dashboard.\n\n')
  }

  // Create an instructor user if none exists
  const existingInstUser = await prisma.user.findFirst({ where: { role: 'INSTRUCTOR' } })
  if (!existingInstUser) {
    const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
    if (admin) {
      const bcrypt = require('bcryptjs')
      const hash = await bcrypt.hash('instructor123', 10)
      
      const newInstUser = await prisma.user.create({
        data: {
          email: 'instructor@zaya.com',
          fullName: 'Test Instructor',
          passwordHash: hash,
          role: 'INSTRUCTOR',
          schoolId: admin.schoolId,
        }
      })
      
      await prisma.instructor.create({
        data: {
          userId: newInstUser.id,
          schoolId: admin.schoolId,
          fullName: 'Test Instructor',
          phone: "08123456789"
        }
      })
      console.log('--- INSTRUCTOR CREDENTIALS ---')
      console.log('Email: instructor@zaya.com')
      console.log('Password: instructor123')
      console.log('------------------------------')
    }
  } else {
      console.log('Instructor user already exists: instructor@zaya.com / instructor123')
  }
}

main().finally(() => prisma.$disconnect())
