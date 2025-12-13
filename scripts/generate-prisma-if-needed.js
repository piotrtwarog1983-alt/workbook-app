// FAZA 1: Skrypt do generowania Prisma Client tylko jeśli DATABASE_URL jest ustawiony
// W Fazie 1 (bez bazy danych) pomijamy generowanie

if (process.env.DATABASE_URL) {
  const { execSync } = require('child_process')
  try {
    console.log('Generating Prisma Client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
  } catch (error) {
    console.warn('Prisma Client generation skipped (Phase 1 - no database)')
  }
} else {
  console.log('Skipping Prisma Client generation (Phase 1 - no DATABASE_URL)')
}
