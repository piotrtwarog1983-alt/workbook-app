import { NextRequest, NextResponse } from 'next/server'
import { put, list, del } from '@vercel/blob'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyPhotoUploaded } from '@/lib/pusher'
import { PROGRESS_PAGES_SET } from '@/lib/progress-pages'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('=== UPLOAD API START ===')
  
  try {
    // Sprawdź konfigurację Blob Storage NA POCZĄTKU
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BŁĄD: Brak zmiennej środowiskowej BLOB_READ_WRITE_TOKEN')
      console.error('Dostępne zmienne ENV:', Object.keys(process.env).filter(k => k.includes('BLOB') || k.includes('DATABASE')))
      return NextResponse.json(
        {
          error: 'Brak konfiguracji Blob Storage. Ustaw BLOB_READ_WRITE_TOKEN w Vercel.',
        },
        { status: 500 }
      )
    }
    console.log('✓ BLOB_READ_WRITE_TOKEN jest ustawiony')

    const token =
      request.headers.get('authorization')?.replace('Bearer ', '') || null
    console.log('Token autoryzacji:', token ? 'obecny' : 'brak')

    let user = null
    try {
      user = await getUserFromToken(token)
      console.log('User z tokenu:', user ? user.email : 'brak')
    } catch (authError) {
      console.log('Błąd autoryzacji (kontynuuję bez usera):', authError)
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const pageNumber = formData.get('pageNumber') as string
    const uploadId = formData.get('uploadId') as string

    console.log('Dane formularza:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      pageNumber, 
      uploadId: uploadId?.substring(0, 8) + '...' 
    })

    if (!file) {
      return NextResponse.json(
        { error: 'Brak pliku' },
        { status: 400 }
      )
    }

    if (!pageNumber || !uploadId) {
      return NextResponse.json(
        { error: 'Brak wymaganych parametrów (pageNumber lub uploadId)' },
        { status: 400 }
      )
    }

    const numericPage = parseInt(pageNumber, 10)
    if (!Number.isFinite(numericPage) || !PROGRESS_PAGES_SET.has(numericPage)) {
      console.error('PageNumber nie jest dozwolony dla postępów:', pageNumber)
      return NextResponse.json(
        { error: 'Ta strona nie obsługuje przesyłania zdjęć.' },
        { status: 400 }
      )
    }

    // Weryfikacja uploadId
    console.log('Weryfikacja uploadId...')
    if (user) {
      if (user.uploadId !== uploadId) {
        console.error('uploadId użytkownika nie pasuje:', { userUploadId: user.uploadId, requestUploadId: uploadId })
        return NextResponse.json(
          { error: 'Nieprawidłowy identyfikator uploadu' },
          { status: 403 }
        )
      }
      console.log('✓ uploadId zweryfikowany przez token użytkownika')
    } else {
      // Użytkownik nie jest zalogowany - sprawdź uploadId w bazie
      console.log('Sprawdzam uploadId w bazie danych...')
      try {
        const userWithUploadId = await prisma.user.findUnique({
          where: { uploadId },
        })

        if (!userWithUploadId) {
          console.error('Nie znaleziono użytkownika z uploadId:', uploadId)
          return NextResponse.json(
            { error: 'Nieprawidłowy identyfikator uploadu - użytkownik nie istnieje' },
            { status: 403 }
          )
        }
        console.log('✓ uploadId zweryfikowany w bazie danych dla:', userWithUploadId.email)
      } catch (dbError) {
        console.error('Błąd bazy danych przy weryfikacji uploadId:', dbError)
        return NextResponse.json(
          { error: 'Błąd weryfikacji użytkownika. Sprawdź połączenie z bazą danych.' },
          { status: 500 }
        )
      }
    }

    // Generuj unikalną nazwę pliku
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${originalName}`
    
    // Ścieżka w Blob Storage: uploads/{uploadId}/page-{pageNumber}/{fileName}
    const pagePrefix = `uploads/${uploadId}/page-${numericPage}/`
    const blobPath = `${pagePrefix}${fileName}`
    console.log('Ścieżka pliku w Blob:', blobPath)

    // Usuń poprzednie zdjęcia dla tej strony (utrzymujemy max 1)
    console.log('Sprawdzam istniejące zdjęcia dla tej strony...')
    const existingPhotos = await list({ prefix: pagePrefix })
    if (existingPhotos.blobs.length > 0) {
      console.log(`Znaleziono ${existingPhotos.blobs.length} zdjęć - usuwam stare wersje`)
      await Promise.all(
        existingPhotos.blobs.map(async (blob) => {
          await del(blob.url)
          console.log('Usunięto stare zdjęcie:', blob.url)
        })
      )
    }

    // Upload do Vercel Blob Storage
    console.log('Rozpoczynam upload do Vercel Blob...')
    const blob = await put(blobPath, file, {
      access: 'public',
    })
    console.log('✓ Upload zakończony sukcesem:', blob.url)

    // Powiadom desktop przez Pusher (real-time)
    await notifyPhotoUploaded(uploadId, numericPage, blob.url)
    console.log('✓ Pusher notification wysłany')

    return NextResponse.json({
      success: true,
      imageUrl: blob.url,
    })
  } catch (error: unknown) {
    console.error('=== UPLOAD ERROR ===')
    console.error('Typ błędu:', error?.constructor?.name)
    console.error('Treść błędu:', error)
    
    const message =
      error instanceof Error ? error.message : 'Nieznany błąd serwera'
    return NextResponse.json(
      { error: `Błąd podczas przesyłania pliku: ${message}` },
      { status: 500 }
    )
  }
}
