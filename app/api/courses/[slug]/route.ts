import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MOCK_COURSE } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

type Params =
  | { slug: string }
  | Promise<{
      slug: string
    }>

// Mapa tipów z MOCK_COURSE (zawsze aktualna)
const TIPS_MAP = new Map(
  MOCK_COURSE.pages.map((page) => [page.pageNumber, page.tips])
)

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const slug = resolvedParams.slug

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
        },
      },
    })

    if (course) {
      // Nadpisz tipy z MOCK_COURSE (zawsze aktualne)
      const pagesWithUpdatedTips = course.pages.map((page) => ({
        ...page,
        tips: TIPS_MAP.get(page.pageNumber) || page.tips,
      }))

      return NextResponse.json({
        ...course,
        pages: pagesWithUpdatedTips,
      })
    }

    if (slug === MOCK_COURSE.slug) {
      return NextResponse.json(MOCK_COURSE)
    }

    return NextResponse.json(
      { error: 'Kurs nie został znaleziony' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Course fetch error:', error)

    // Fallback do mock data jeśli dostępne
    try {
      const resolvedParams = await Promise.resolve(params)
      if (resolvedParams.slug === MOCK_COURSE.slug) {
        return NextResponse.json(MOCK_COURSE)
      }
    } catch (_) {
      // Ignoruj błąd fallbacku
    }

    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

