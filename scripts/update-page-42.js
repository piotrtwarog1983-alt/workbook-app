const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Znajdź stronę 42
    const page = await prisma.coursePage.findFirst({
      where: { pageNumber: 42 }
    })

    if (!page) {
      console.log('Strona 42 nie została znaleziona w bazie danych')
      return
    }

    console.log('Aktualna zawartość strony 42:', page.content)

    // Zaktualizuj typ i textFile
    const newContent = JSON.stringify({
      type: 'image-overlay-text-file',
      imageUrl: '/course/strona 42/Foto/42.jpg',
      textFile: '/api/course-content/42/PL',
      textPosition: 'top-center',
    })

    await prisma.coursePage.update({
      where: { id: page.id },
      data: { content: newContent }
    })

    console.log('Strona 42 została zaktualizowana!')
    console.log('Nowa zawartość:', newContent)

  } catch (error) {
    console.error('Błąd:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()








































