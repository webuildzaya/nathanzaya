import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function test() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@school.com' },
  })
  if (!user) {
    console.log('User not found!')
    return
  }
  const match = await bcrypt.compare('admin123', user.passwordHash)
  console.log('Match:', match)
}

test()
