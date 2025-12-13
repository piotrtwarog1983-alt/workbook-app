import { NextRequest, NextResponse } from 'next/server'

// FAZA 1: Wersja bez bazy danych - zwraca mock uploadId
export async function GET(request: NextRequest) {
  try {
    // W fazie 1 zwracamy mock uploadId
    // W produkcji będzie to pobierane z bazy danych użytkownika
    const mockUploadId = 'mock-upload-id-' + Date.now()
    
    return NextResponse.json({
      uploadId: mockUploadId,
    })
  } catch (error) {
    console.error('Get upload ID error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

