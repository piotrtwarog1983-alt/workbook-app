import { NextRequest, NextResponse } from 'next/server'

// FAZA 1: Wersja bez bazy danych - zwraca puste dane
// Oceny będą zapisywane tylko w localStorage po stronie klienta

// Pobierz wszystkie oceny użytkownika
export async function GET(request: NextRequest) {
  try {
    // W fazie 1 zwracamy puste dane - oceny są przechowywane tylko w localStorage
    return NextResponse.json({ evaluations: [] })
  } catch (error) {
    console.error('Get evaluations error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

// Zapisz lub zaktualizuj ocenę
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageNumber, evaluation, cumulativeScore } = body

    if (typeof pageNumber !== 'number' || typeof evaluation !== 'number') {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane' },
        { status: 400 }
      )
    }

    // Walidacja: evaluation musi być -1, 0 lub 1
    if (![-1, 0, 1].includes(evaluation)) {
      return NextResponse.json(
        { error: 'Nieprawidłowa wartość oceny' },
        { status: 400 }
      )
    }

    // Walidacja: pageNumber musi być jedną z dozwolonych stron
    const allowedPages = [16, 21, 30, 36, 41, 50]
    if (!allowedPages.includes(pageNumber)) {
      return NextResponse.json(
        { error: 'Nieprawidłowy numer strony' },
        { status: 400 }
      )
    }

    // W fazie 1 zwracamy sukces, ale nie zapisujemy do bazy
    // Dane są przechowywane tylko w localStorage po stronie klienta
    return NextResponse.json({
      success: true,
      evaluation: {
        pageNumber,
        evaluation,
        cumulativeScore: cumulativeScore || 0,
      },
    })
  } catch (error) {
    console.error('Save evaluation error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

