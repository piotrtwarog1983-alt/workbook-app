import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ page: string; lang: string }> | { page: string; lang: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { page, lang } = resolvedParams

    const filePath = path.join(
      process.cwd(),
      'public',
      'course',
      `strona ${page}`,
      'Wersja',
      lang,
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

