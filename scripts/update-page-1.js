const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Aktualizuj stronę 1 - zmień na pojedyncze zdjęcie rozciągnięte na całą powierzchnię
    const result = await prisma.coursePage.updateMany({
      where: {
        pageNumber: 1
      },
      data: {
        content: JSON.stringify({
          type: 'image-overlay',
          imageUrl: '/course/strona 1/Foto/1.jpg',
        })
      }
    })

    console.log('Zaktualizowano stronę 1:', result)
    
    // Sprawdź wynik
    const page = await prisma.coursePage.findFirst({
      where: { pageNumber: 1 }
    })
    console.log('Strona 1 po aktualizacji:', page?.content)
    
  } catch (error) {
    console.error('Błąd:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()









