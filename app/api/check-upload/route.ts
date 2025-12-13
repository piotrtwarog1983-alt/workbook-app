import { NextRequest, NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// FAZA 1: Wersja bez bazy danych - sprawdza tylko pliki, bez weryfikacji w bazie
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const uploadId = searchParams.get('uploadId')
    const pageNumber = searchParams.get('page')

    if (!uploadId || !pageNumber) {
      return NextResponse.json(
        { error: 'Brak wymaganych parametrów' },
        { status: 400 }
      )
    }

    // W fazie 1 pomijamy sprawdzanie w bazie danych
    // Sprawdź tylko, czy istnieje plik dla tego uploadId i strony
    const uploadDir = join(process.cwd(), 'public', 'uploads', uploadId, `page-${pageNumber}`)
    
    if (!existsSync(uploadDir)) {
      return NextResponse.json({ uploaded: false })
    }

    const files = await readdir(uploadDir)
    // Zwróć najnowszy plik
    const latestFile = files.sort().reverse()[0]

    if (latestFile) {
      return NextResponse.json({
        uploaded: true,
        imageUrl: `/uploads/${uploadId}/page-${pageNumber}/${latestFile}`
      })
    }

    return NextResponse.json({ uploaded: false })
  } catch (error) {
    console.error('Check upload error:', error)
    return NextResponse.json({ uploaded: false })
  }
}

