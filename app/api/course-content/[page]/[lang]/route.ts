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
    console.error('Error reading file:', error)
    return NextResponse.json(
      { error: 'Błąd odczytu pliku' },
      { status: 500 }
    )
  }
}

