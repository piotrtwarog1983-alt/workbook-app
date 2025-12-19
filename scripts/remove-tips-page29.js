const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const page = await prisma.coursePage.findFirst({
      where: { pageNumber: 29 }
    })

    if (page) {
      await prisma.coursePage.update({
        where: { id: page.id },
        data: { tips: JSON.stringify([]) }
      })
      console.log('Tips usunięte ze strony 29')
    } else {
      console.log('Strona 29 nie znaleziona')
    }
  } catch (error) {
    console.error('Błąd:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()



