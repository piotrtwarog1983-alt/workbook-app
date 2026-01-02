import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { triggerPusherEvent } from '@/lib/pusher'

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

    // Zapisz URL w bazie danych (upsert - aktualizuj jeśli istnieje)
    await prisma.progressPhoto.upsert({
      where: {
        uploadId_pageNumber: {
          uploadId: uploadId,
          pageNumber: parseInt(pageNumber),
        },
      },
      update: {
        imageUrl: blob.url,
        updatedAt: new Date(),
      },
      create: {
        uploadId: uploadId,
        pageNumber: parseInt(pageNumber),
        imageUrl: blob.url,
      },
    })

    // Wyślij event przez Pusher - real-time update dla desktop view
    await triggerPusherEvent(`progress-${uploadId}`, 'photo:uploaded', {
      pageNumber: parseInt(pageNumber),
      imageUrl: blob.url,
      timestamp: timestamp
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

// DELETE - usuwa zdjęcie postępu z bazy danych i opcjonalnie z Blob Storage
export async function DELETE(request: NextRequest) {
  try {
    const token =
      request.headers.get('authorization')?.replace('Bearer ', '') || null
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const pageNumber = searchParams.get('pageNumber')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (deleteAll) {
      // Usuń wszystkie zdjęcia użytkownika z bazy danych
      const photos = await prisma.progressPhoto.findMany({
        where: { uploadId: user.uploadId },
      })

      // Próba usunięcia z Blob Storage (ignoruj błędy dla nieistniejących plików)
      for (const photo of photos) {
        try {
          await del(photo.imageUrl)
        } catch (e) {
          // Ignoruj błędy - plik mógł już zostać usunięty
          console.log(`Could not delete blob: ${photo.imageUrl}`)
        }
      }

      // Usuń wszystkie rekordy z bazy danych
      const result = await prisma.progressPhoto.deleteMany({
        where: { uploadId: user.uploadId },
      })

      return NextResponse.json({
        success: true,
        deletedCount: result.count,
        message: `Usunięto ${result.count} zdjęć z bazy danych`,
      })
    }

    if (!pageNumber) {
      return NextResponse.json(
        { error: 'Brak numeru strony' },
        { status: 400 }
      )
    }

    // Znajdź zdjęcie w bazie danych
    const photo = await prisma.progressPhoto.findUnique({
      where: {
        uploadId_pageNumber: {
          uploadId: user.uploadId,
          pageNumber: parseInt(pageNumber),
        },
      },
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Zdjęcie nie istnieje' },
        { status: 404 }
      )
    }

    // Próba usunięcia z Blob Storage
    try {
      await del(photo.imageUrl)
    } catch (e) {
      console.log(`Could not delete blob: ${photo.imageUrl}`)
    }

    // Usuń rekord z bazy danych
    await prisma.progressPhoto.delete({
      where: {
        uploadId_pageNumber: {
          uploadId: user.uploadId,
          pageNumber: parseInt(pageNumber),
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Usunięto zdjęcie ze strony ${pageNumber}`,
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Błąd podczas usuwania zdjęcia' },
      { status: 500 }
    )
  }
}
