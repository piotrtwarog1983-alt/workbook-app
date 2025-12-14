import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const token =
      request.headers.get('authorization')?.replace('Bearer ', '') || null
    const user = await getUserFromToken(token)

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

    // Weryfikacja uploadId
    if (user) {
      if (user.uploadId !== uploadId) {
        return NextResponse.json(
          { error: 'Nieprawidłowy identyfikator uploadu' },
          { status: 403 }
        )
      }
    } else {
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

    // Generuj unikalną nazwę pliku
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${originalName}`
    
    // Ścieżka w Blob Storage: uploads/{uploadId}/page-{pageNumber}/{fileName}
    const blobPath = `uploads/${uploadId}/page-${pageNumber}/${fileName}`

    // Upload do Vercel Blob Storage
    const blob = await put(blobPath, file, {
      access: 'public', // Plik będzie publicznie dostępny
    })

    return NextResponse.json({
      success: true,
      imageUrl: blob.url, // URL z Blob Storage
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Błąd podczas przesyłania pliku' },
      { status: 500 }
    )
  }
}
