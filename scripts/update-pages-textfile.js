const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const pagesToUpdate = [
  { pageNumber: 11, type: 'image-overlay-text-file', imageUrl: '/course/strona 11/Foto/11.jpg', textPosition: 'bottom' },
  { pageNumber: 17, type: 'simple-text' },
  { pageNumber: 22, type: 'simple-text' },
  { pageNumber: 43, type: 'simple-text' },
]

async function main() {
  try {
    for (const pageData of pagesToUpdate) {
      const page = await prisma.coursePage.findFirst({
        where: { pageNumber: pageData.pageNumber }
      })

      if (!page) {
        console.log(`Strona ${pageData.pageNumber} nie została znaleziona`)
        continue
      }

      let newContent
      if (pageData.type === 'image-overlay-text-file') {
        newContent = JSON.stringify({
          type: pageData.type,
          imageUrl: pageData.imageUrl,
          textFile: `/api/course-content/${pageData.pageNumber}/PL`,
          textPosition: pageData.textPosition,
        })
      } else {
        newContent = JSON.stringify({
          type: pageData.type,
          textFile: `/api/course-content/${pageData.pageNumber}/PL`,
        })
      }

      await prisma.coursePage.update({
        where: { id: page.id },
        data: { content: newContent }
      })

      console.log(`Strona ${pageData.pageNumber} zaktualizowana!`)
    }

    console.log('Wszystkie strony zaktualizowane!')

  } catch (error) {
    console.error('Błąd:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()











