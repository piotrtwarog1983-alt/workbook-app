/**
 * Script to create a test user for development
 * Run with: node scripts/create-test-user.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    const email = 'test@example.com'
    const password = 'test123456'
    const name = 'Test User'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('Użytkownik już istnieje!')
      console.log('Email:', email)
      console.log('Hasło:', password)
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })

    // Find or create course
    let course = await prisma.course.findUnique({
      where: { slug: 'fotografia-kulinarna' },
    })

    if (!course) {
      console.log('Kurs nie istnieje. Uruchom najpierw: npx prisma db seed')
      return
    }

    // Enroll user in course
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        courseId: course.id,
      },
    })

    console.log('✅ Użytkownik testowy utworzony!')
    console.log('Email:', email)
    console.log('Hasło:', password)
    console.log('Możesz się teraz zalogować na /login')
  } catch (error) {
    console.error('Błąd:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()

