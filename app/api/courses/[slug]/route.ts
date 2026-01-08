import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MOCK_COURSE } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

type Params =
  | { slug: string }
  | Promise<{
      slug: string
    }>

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const slug = resolvedParams.slug

    // Zawsze używaj MOCK_COURSE dla kursu "theone" - dane są aktualizowane w mock-data.ts
    if (slug === MOCK_COURSE.slug) {
      return NextResponse.json(MOCK_COURSE)
    }

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
        },
      },
    })

    if (course) {
      return NextResponse.json(course)
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

