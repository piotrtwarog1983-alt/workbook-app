import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default course
  const course = await prisma.course.upsert({
    where: { slug: 'fotografia-kulinarna' },
    update: {},
    create: {
      title: 'WorkBook - Fotografia Kulinarna',
      description: 'Naucz się robić profesjonalne zdjęcia potraw smartfonem',
      slug: 'fotografia-kulinarna',
      pages: {
        create: [
          {
            pageNumber: 1,
            title: 'Wprowadzenie',
            content: JSON.stringify({
              text: 'Nie brakuje nam dostępu do wiedzy. Brakuje czasu.\nDlatego stworzyłam workbook, w którym w ciągu jednego dnia nauczysz się robić zdjęcia warte Twoich dań. To, co wiem - w pigułce. To numer 1: podstawy i zdjęcie z góry na białym tle.',
            }),
            tips: JSON.stringify([
              'Zacznij od przygotowania białego tła - duży karton lub obrus',
              'Upewnij się, że masz dobre światło naturalne',
            ]),
          },
          {
            pageNumber: 2,
            title: 'Gotowy? Zaczynamy!',
            content: JSON.stringify({
              text: 'Do nauki potrzebujesz:\n• Danie\n• Duży biały karton lub obrus\n• Biała kartka\n• Twój smartfon\n\nZachowaj wszystkie 7 zdjęć, które będziesz robił podczas wykonywania zadań w workbooku. Przy każdym następnym zdjęciu zmieniaj tylko to, co opisane w kolejnym kroku. To pokaże ci jasno zasady dobrego zdjęcia.',
            }),
            tips: JSON.stringify([
              'Przygotuj wszystkie materiały przed rozpoczęciem',
              'Rób zdjęcia w tej samej lokalizacji dla spójności',
            ]),
          },
          {
            pageNumber: 3,
            title: 'Ustawienia smartfona',
            content: JSON.stringify({
              text: 'Zacznijmy od ustawień telefonu.\n\nTryb Portret:\nTelefon rozmyje tło, a danie będzie najważniejsze.\n\nTryb RAW:\nZdjęcie będzie lepszej jakości i łatwiej je później poprawić bez utraty jakości podczas obróbki.\n\nJeśli robisz zdjęcie pod kątem 45°, najpierw włącz przybliżenie x3, a potem odsuń się trochę od dania, żeby uchwycić cały talerz. Po co? Dzięki temu danie będzie wyglądało naturalnie i nie będzie zniekształcone.\n\nW tym workbooku staraj się, żeby cały talerz był widoczny.\n\nCo wyłączyć?\nFlash (lampa błyskowa):\nFlash świeci na danie prosto z przodu. To najgorsze światło do jedzenia — danie wygląda wtedy płasko i mniej apetycznie.',
            }),
            tips: JSON.stringify([
              'Zawsze wyłącz flash - użyj naturalnego światła',
              'Tryb RAW daje więcej możliwości w edycji',
              'Przy kącie 45° użyj zoom x3 dla naturalnych proporcji',
            ]),
          },
          {
            pageNumber: 4,
            title: 'Zaczymamy',
            content: JSON.stringify({
              text: 'Wyjątkowe potrawy potrzebują przestrzeni do prezentacji. Duże talerze ją dają. W fotografii jest ta sama zasada.\n\nDzisiaj tworzymy na czystej kartce lub obrusie. Zwracaj uwagę, aby na zdjęciu był tylko talerz z potrawą i białe tło.',
            }),
            tips: JSON.stringify([
              'Użyj większego talerza niż zwykle - daje to więcej przestrzeni',
              'Upewnij się, że tło jest całkowicie białe i czyste',
            ]),
          },
          {
            pageNumber: 5,
            title: 'Zrób zdjęcie',
            content: JSON.stringify({
              text: 'Zrób najpiękniejsze zdjęcie dania jakie potrafisz w tej chwili.',
            }),
            tips: JSON.stringify([
              'Poświęć czas na kompozycję',
              'Sprawdź, czy cały talerz jest widoczny',
            ]),
          },
        ],
      },
    },
  })

  // Add glossary terms
  const glossaryTerms = [
    {
      term: 'Tryb Portret',
      definition: 'Tryb aparatu w smartfonie, który rozmywa tło, pozostawiając główny obiekt (danie) ostrym i wyraźnym.',
      language: 'pl',
    },
    {
      term: 'Tryb RAW',
      definition: 'Format zapisu zdjęć, który zachowuje wszystkie dane z sensora aparatu, umożliwiając większą elastyczność w edycji bez utraty jakości.',
      language: 'pl',
    },
    {
      term: 'Kadrowanie',
      definition: 'Proces wyboru i kompozycji elementów widocznych w kadrze zdjęcia.',
      language: 'pl',
    },
    {
      term: 'Kompozycja',
      definition: 'Układ elementów w kadrze zdjęcia, który wpływa na odbiór i estetykę fotografii.',
      language: 'pl',
    },
    {
      term: 'Światło naturalne',
      definition: 'Światło pochodzące ze słońca, najlepsze do fotografii kulinarnej, dające naturalny i apetyczny wygląd potraw.',
      language: 'pl',
    },
  ]

  for (const term of glossaryTerms) {
    await prisma.glossaryTerm.upsert({
      where: {
        term_language: {
          term: term.term,
          language: term.language,
        },
      },
      update: {},
      create: term,
    })
  }

  console.log('Seed completed successfully!')
  console.log('Course created:', course.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

