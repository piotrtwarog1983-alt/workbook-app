/**
 * Script to import course pages from file structure
 * This script reads images from public/course/strona X/Foto/ and creates CoursePage entries
 * 
 * Run with: npx ts-node scripts/import-course-pages.ts
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function importCoursePages() {
  const courseSlug = 'fotografia-kulinarna'
  
  // Find course
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
  })

  if (!course) {
    console.error('Course not found. Please run seed first.')
    process.exit(1)
  }

  const courseDir = path.join(process.cwd(), 'public', 'course')
  const pages: Array<{ pageNumber: number; imageFiles: string[] }> = []

  // Read all page directories
  const dirs = fs.readdirSync(courseDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('strona '))
    .map(dirent => dirent.name)

  for (const dir of dirs) {
    const pageNumber = parseInt(dir.replace('strona ', ''))
    if (isNaN(pageNumber)) continue

    const fotoDir = path.join(courseDir, dir, 'Foto')
    if (!fs.existsSync(fotoDir)) continue

    const imageFiles = fs.readdirSync(fotoDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort()

    pages.push({ pageNumber, imageFiles })
  }

  // Create or update pages
  for (const { pageNumber, imageFiles } of pages.sort((a, b) => a.pageNumber - b.pageNumber)) {
    const imageUrl = imageFiles.length > 0 
      ? `/course/strona ${pageNumber}/Foto/${imageFiles[0]}`
      : null

    await prisma.coursePage.upsert({
      where: {
        courseId_pageNumber: {
          courseId: course.id,
          pageNumber,
        },
      },
      update: {
        imageUrl: imageUrl || undefined,
      },
      create: {
        courseId: course.id,
        pageNumber,
        imageUrl,
        title: `Strona ${pageNumber}`,
      },
    })

    console.log(`Imported page ${pageNumber}${imageUrl ? ` with image: ${imageUrl}` : ''}`)
  }

  console.log(`\nImported ${pages.length} pages`)
}

importCoursePages()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

