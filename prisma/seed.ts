import { PrismaClient } from '@prisma/client'
import * as crypto from 'crypto'
import { MOCK_COURSE, MOCK_GLOSSARY_TERMS } from '../lib/mock-data'

const prisma = new PrismaClient()

// Email administratora - tylko ten email może się zarejestrować bez płatności
const ADMIN_EMAIL = 'peter.twarog@cirrenz.com'

async function main() {
  const course = await prisma.course.upsert({
    where: { slug: MOCK_COURSE.slug },
    update: {
      title: MOCK_COURSE.title,
      description: MOCK_COURSE.description,
    },
    create: {
      title: MOCK_COURSE.title,
      description: MOCK_COURSE.description,
      slug: MOCK_COURSE.slug,
    },
  })

  for (const page of MOCK_COURSE.pages) {
    await prisma.coursePage.upsert({
      where: {
        courseId_pageNumber: {
          courseId: course.id,
          pageNumber: page.pageNumber,
        },
      },
      update: {
        title: page.title || null,
        content: page.content || null,
        imageUrl: page.imageUrl || null,
        tips: page.tips || null,
      },
      create: {
        courseId: course.id,
        pageNumber: page.pageNumber,
        title: page.title || null,
        content: page.content || null,
        imageUrl: page.imageUrl || null,
        tips: page.tips || null,
      },
    })
  }

  for (const term of MOCK_GLOSSARY_TERMS) {
    await prisma.glossaryTerm.upsert({
      where: {
        term_language: {
          term: term.term,
          language: 'pl', // Domyślny język dla wszystkich terminów
        },
      },
      update: {
        definition: term.definition,
      },
      create: {
        term: term.term,
        definition: term.definition,
        language: 'pl', // Domyślny język dla wszystkich terminów
      },
    })
  }

  // Sprawdź, czy administrator już istnieje
  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })

  if (existingAdmin) {
    console.log(`\n✅ Administrator już istnieje: ${ADMIN_EMAIL}`)
  } else {
    // Sprawdź, czy istnieje aktywny token dla administratora
    const existingToken = await prisma.registrationToken.findFirst({
      where: {
        email: ADMIN_EMAIL,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (existingToken) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      console.log(`\n✅ Token rejestracyjny dla administratora już istnieje!`)
      console.log(`📧 Email: ${ADMIN_EMAIL}`)
      console.log(`🔗 Link do rejestracji: ${appUrl}/signup?token=${existingToken.token}`)
      console.log(`📅 Ważny do: ${existingToken.expiresAt.toLocaleDateString('pl-PL')}`)
    } else {
      // Utwórz nowy token rejestracyjny dla administratora
      const adminToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1) // Token ważny przez 1 rok

      await prisma.registrationToken.create({
        data: {
          token: adminToken,
          email: ADMIN_EMAIL,
          expiresAt,
          courseId: course.id,
        },
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      console.log(`\n✅ Token rejestracyjny dla administratora utworzony!`)
      console.log(`📧 Email: ${ADMIN_EMAIL}`)
      console.log(`🔗 Link do rejestracji: ${appUrl}/signup?token=${adminToken}`)
      console.log(`📅 Ważny do: ${expiresAt.toLocaleDateString('pl-PL')}`)
      console.log(`\n⚠️  ZAPISZ TEN LINK - będzie potrzebny do rejestracji administratora!\n`)
    }
  }

  console.log(`Seed completed successfully for course ${course.slug}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

