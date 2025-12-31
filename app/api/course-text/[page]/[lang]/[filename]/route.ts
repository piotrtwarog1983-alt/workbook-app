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
  { params }: { params: Promise<{ page: string; lang: string; filename: string }> | { page: string; lang: string; filename: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { page, lang, filename } = resolvedParams

    // Bezpieczeństwo: tylko dozwolone nazwy plików
    const allowedFiles = ['content.txt', 'tips.txt', 'text1.txt', 'text2.txt', 'text3.txt', 'label1.txt', 'label2.txt']
    if (!allowedFiles.includes(filename)) {
      return NextResponse.json(
        { error: 'Nieprawidłowa nazwa pliku' },
        { status: 400 }
      )
    }

    // Użyj zmapowanej nazwy folderu lub oryginalnej jeśli nie ma mapowania
    const folderName = langFolderMap[lang] || lang

    const filePath = path.join(
      process.cwd(),
      'public',
      'course',
      `strona ${page}`,
      'Wersja',
      folderName,
      filename
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
    console.error('Error reading file:', error)
    return NextResponse.json(
      { error: 'Błąd odczytu pliku' },
      { status: 500 }
    )
  }
}







































