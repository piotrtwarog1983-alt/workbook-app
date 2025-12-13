import { NextRequest, NextResponse } from 'next/server'
import { MOCK_COURSE } from '@/lib/mock-data'

// FAZA 1: Wersja bez bazy danych - używa mock data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    
    // Zwróć mock course jeśli slug się zgadza
    if (resolvedParams.slug === MOCK_COURSE.slug) {
      return NextResponse.json(MOCK_COURSE)
    }

    return NextResponse.json(
      { error: 'Kurs nie został znaleziony' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Course fetch error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

