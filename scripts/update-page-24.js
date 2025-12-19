const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const page = await prisma.coursePage.findFirst({
      where: { pageNumber: 24 }
    })

    if (!page) {
      console.log('Strona 24 nie została znaleziona')
      return
    }

    const newContent = JSON.stringify({
      type: 'two-images-container',
      textFile: '/api/course-content/24/PL',
      image1Url: '/course/strona 24/Foto/24-1.jpg',
      image2Url: '/course/strona 24/Foto/24-2.jpg',
    })

    await prisma.coursePage.update({
      where: { id: page.id },
      data: { content: newContent }
    })

    console.log('Strona 24 zaktualizowana!')

  } catch (error) {
    console.error('Błąd:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()






