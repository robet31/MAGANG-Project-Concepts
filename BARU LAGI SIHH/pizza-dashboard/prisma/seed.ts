import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create Restaurants
  const restaurants = await Promise.all([
    prisma.restaurant.upsert({
      where: { code: 'DOM' },
      update: {},
      create: {
        name: "Domino's Pizza",
        code: 'DOM',
        location: 'New York, NY',
        description: 'Domino\'s Pizza - International pizza chain'
      }
    }),
    prisma.restaurant.upsert({
      where: { code: 'PZH' },
      update: {},
      create: {
        name: "Pizza Hut",
        code: 'PZH',
        location: 'Miami, FL',
        description: 'Pizza Hut - International pizza chain'
      }
    }),
    prisma.restaurant.upsert({
      where: { code: 'LCP' },
      update: {},
      create: {
        name: "Little Caesars",
        code: 'LCP',
        location: 'Chicago, IL',
        description: 'Little Caesars - Fast food pizza chain'
      }
    }),
    prisma.restaurant.upsert({
      where: { code: 'PJS' },
      update: {},
      create: {
        name: "Papa John's",
        code: 'PJS',
        location: 'Los Angeles, CA',
        description: 'Papa John\'s - International pizza chain'
      }
    }),
    prisma.restaurant.upsert({
      where: { code: 'MCP' },
      update: {},
      create: {
        name: "Marco's Pizza",
        code: 'MCP',
        location: 'Dallas, TX',
        description: 'Marco\'s Pizza - Italian pizza chain'
      }
    })
  ])

  console.log('✅ Created restaurants:', restaurants.length)

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create Users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'gm@pizza.com' },
      update: {},
      create: {
        email: 'gm@pizza.com',
        password: hashedPassword,
        name: 'General Manager',
        role: 'GM',
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'admin@pizza.com' },
      update: {},
      create: {
        email: 'admin@pizza.com',
        password: hashedPassword,
        name: 'Admin Pusat',
        role: 'ADMIN_PUSAT',
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'manager@dominos.com' },
      update: {},
      create: {
        email: 'manager@dominos.com',
        password: hashedPassword,
        name: 'Domino\'s Manager',
        role: 'MANAGER',
        restaurantId: restaurants[0].id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'manager@pizzahut.com' },
      update: {},
      create: {
        email: 'manager@pizzahut.com',
        password: hashedPassword,
        name: 'Pizza Hut Manager',
        role: 'MANAGER',
        restaurantId: restaurants[1].id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: { email: 'staff@dominos.com' },
      update: {},
      create: {
        email: 'staff@dominos.com',
        password: hashedPassword,
        name: 'Domino\'s Staff',
        role: 'STAFF',
        restaurantId: restaurants[0].id,
        isActive: true
      }
    })
  ])

  console.log('✅ Created users:', users.length)

  // Create Settings
  await prisma.settings.upsert({
    where: { key: 'app_settings' },
    update: {},
    create: {
      key: 'app_settings',
      value: '{"appName":"Pizza Delivery Dashboard","dataRetentionDays":365,"maxUploadSize":10,"allowedFileTypes":["xlsx","xls","csv"]}',
      description: 'Application settings'
    }
  })

  console.log('✅ Created settings')
  console.log('🎉 Seed completed!')
  console.log('')
  console.log('📝 Login credentials:')
  console.log('   GM: gm@pizza.com / password123')
  console.log('   Admin Pusat: admin@pizza.com / password123')
  console.log('   Manager Domino\'s: manager@dominos.com / password123')
  console.log('   Manager Pizza Hut: manager@pizzahut.com / password123')
  console.log('   Staff Domino\'s: staff@dominos.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
