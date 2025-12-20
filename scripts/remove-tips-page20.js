const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const page = await prisma.coursePage.findFirst({
      where: { pageNumber: 20 }
    })

    if (page) {
      await prisma.coursePage.update({
        where: { id: page.id },
        data: { tips: JSON.stringify([]) }
      })
      console.log('Tips usunięte ze strony 20')
    } else {
      console.log('Strona 20 nie znaleziona')
    }
  } catch (error) {
    console.error('Błąd:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()










