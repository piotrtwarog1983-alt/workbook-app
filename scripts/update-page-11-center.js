const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const page = await prisma.coursePage.findFirst({
      where: { pageNumber: 11 }
    })

    if (!page) {
      console.log('Strona 11 nie została znaleziona')
      return
    }

    const newContent = JSON.stringify({
      type: 'image-overlay-text-file',
      imageUrl: '/course/strona 11/Foto/11.jpg',
      textFile: '/api/course-content/11/PL',
      textPosition: 'center',
    })

    await prisma.coursePage.update({
      where: { id: page.id },
      data: { content: newContent }
    })

    console.log('Strona 11 zaktualizowana - tekst wyśrodkowany!')

  } catch (error) {
    console.error('Błąd:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()



