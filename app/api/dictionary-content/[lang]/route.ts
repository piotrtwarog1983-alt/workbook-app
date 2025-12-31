import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Mapowanie kodów języków na nazwy folderów
const langFolderMap: { [key: string]: string } = {
  'EN': 'EN Usa',
  'PL': 'PL',
  'DE': 'DE',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lang: string }> | { lang: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { lang } = resolvedParams

    // Użyj zmapowanej nazwy folderu lub oryginalnej jeśli nie ma mapowania
    const folderName = langFolderMap[lang] || lang

    const filePath = path.join(
      process.cwd(),
      'public',
      'course',
      'słownik',
      'Wersja',
      folderName,
      'content.txt'
    )

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Plik nie został znaleziony' },
        { status: 404 }
      )
    }

    const content = fs.readFileSync(filePath, 'utf-8')

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error reading dictionary file:', error)
    return NextResponse.json(
      { error: 'Błąd odczytu pliku' },
      { status: 500 }
    )
  }
}


































