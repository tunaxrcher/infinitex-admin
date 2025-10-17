import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create demo admin account
  const hashedPassword = await bcrypt.hash('demo123', 10)

  const admin = await prisma.admin.upsert({
    where: { email: 'demo@kt.com' },
    update: {},
    create: {
      email: 'demo@kt.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Created admin:', admin.email)

  // You can add more seed data here for other models
  // For example: Users, Banners, Rewards, etc.

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

