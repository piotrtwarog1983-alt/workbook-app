const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const pagesToUpdate = [
  { pageNumber: 4, type: 'image-overlay-text-file', imageUrl: '/course/strona 4/Foto/start.jpg', textPosition: 'bottom-center' },
  { pageNumber: 23, type: 'image-overlay-text-file', imageUrl: '/course/strona 23/Foto/23.jpg', textPosition: 'top-center-lower' },
  { pageNumber: 37, type: 'image-overlay-text-file', imageUrl: '/course/strona 37/Foto/37.jpg', textPosition: 'top-center' },
  { pageNumber: 24, type: 'two-images-container', image1Url: '/course/strona 24/Foto/24-1.jpg', image2Url: '/course/strona 24/Foto/24-2.jpg' },
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
      } else if (pageData.type === 'two-images-container') {
        newContent = JSON.stringify({
          type: pageData.type,
          textFile: `/api/course-content/${pageData.pageNumber}/PL`,
          image1Url: pageData.image1Url,
          image2Url: pageData.image2Url,
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











