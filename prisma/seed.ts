import { PrismaClient } from '@prisma/client'
import { MOCK_COURSE, MOCK_GLOSSARY_TERMS } from '../lib/mock-data'

const prisma = new PrismaClient()

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

