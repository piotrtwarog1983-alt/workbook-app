// FAZA 1: Stub dla @prisma/client - używany podczas build gdy nie ma DATABASE_URL
// Ten plik zastępuje @prisma/client podczas build w Fazie 1

module.exports = {
  PrismaClient: class PrismaClientStub {
    constructor() {
      // Pusta klasa stub
    }
  }
}

