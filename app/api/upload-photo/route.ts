import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    const formData = await request.formData()
    const file = formData.get('image') as File
    const pageNumber = formData.get('pageNumber') as string
    const uploadId = formData.get('uploadId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Brak pliku' },
        { status: 400 }
      )
    }

    if (!pageNumber || !uploadId) {
      return NextResponse.json(
        { error: 'Brak wymaganych parametrów' },
        { status: 400 }
      )
    }

    // Jeśli użytkownik jest zalogowany, sprawdź czy uploadId pasuje do jego konta
    if (user) {
      if (user.uploadId !== uploadId) {
        return NextResponse.json(
          { error: 'Nieprawidłowy identyfikator uploadu' },
          { status: 403 }
        )
      }
    } else {
      // Jeśli użytkownik nie jest zalogowany, sprawdź czy uploadId istnieje w bazie
      const userWithUploadId = await prisma.user.findUnique({
        where: { uploadId },
      })

      if (!userWithUploadId) {
        return NextResponse.json(
          { error: 'Nieprawidłowy identyfikator uploadu' },
          { status: 403 }
        )
      }
    }

    // Utwórz folder dla uploadów użytkownika
    const uploadDir = join(process.cwd(), 'public', 'uploads', uploadId, `page-${pageNumber}`)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generuj unikalną nazwę pliku
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${originalName}`
    const filePath = join(uploadDir, fileName)

    // Zapisz plik
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Zwróć URL do przesłanego zdjęcia
    const imageUrl = `/uploads/${uploadId}/page-${pageNumber}/${fileName}`

    return NextResponse.json({ 
      success: true,
      imageUrl 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Błąd podczas przesyłania pliku' },
      { status: 500 }
    )
  }
}

