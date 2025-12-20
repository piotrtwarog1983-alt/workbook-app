const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Aktualizuj stronę 34 - dodaj powiązanie z plikiem content
    const result = await prisma.coursePage.updateMany({
      where: {
        pageNumber: 34
      },
      data: {
        content: JSON.stringify({
          type: 'black-header-image',
          imageUrl: '/course/strona 34/Foto/34.jpg',
          textFile: '/api/course-content/34/PL',
        })
      }
    })

    console.log('Zaktualizowano stronę 34:', result)
    
    // Sprawdź wynik
    const page = await prisma.coursePage.findFirst({
      where: { pageNumber: 34 }
    })
    console.log('Strona 34 po aktualizacji:', page?.content)
    
  } catch (error) {
    console.error('Błąd:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()









