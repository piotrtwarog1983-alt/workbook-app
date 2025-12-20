const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const page = await prisma.coursePage.findFirst({
      where: { pageNumber: 9 }
    })

    if (!page) {
      console.log('Strona 9 nie została znaleziona w bazie danych')
      return
    }

    console.log('Aktualna zawartość strony 9:', page.content)

    const newContent = JSON.stringify({
      type: 'simple-text',
      textFile: '/api/course-content/9/PL',
    })

    await prisma.coursePage.update({
      where: { id: page.id },
      data: { content: newContent }
    })

    console.log('Strona 9 została zaktualizowana!')
    console.log('Nowa zawartość:', newContent)

  } catch (error) {
    console.error('Błąd:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()












