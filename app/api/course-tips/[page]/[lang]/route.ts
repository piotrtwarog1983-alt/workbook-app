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
  { params }: { params: Promise<{ page: string; lang: string }> | { page: string; lang: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { page, lang } = resolvedParams

    // Użyj zmapowanej nazwy folderu lub oryginalnej jeśli nie ma mapowania
    const folderName = langFolderMap[lang] || lang

    const filePath = path.join(
      process.cwd(),
      'public',
      'course',
      `strona ${page}`,
      'Wersja',
      folderName,
      'tips.txt'
    )

    // Jeśli plik nie istnieje, zwróć pustą tablicę
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ tips: [] })
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    
    // Rozdziel tipy separatorem "---"
    const tips = content
      .split('---')
      .map(tip => tip.trim())
      .filter(tip => tip.length > 0)

    return NextResponse.json({ tips })
  } catch (error) {
    console.error('Error reading tips file:', error)
    return NextResponse.json({ tips: [] })
  }
}










































