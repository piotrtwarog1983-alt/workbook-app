import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get('authorization')?.replace('Bearer ', '') || null
    const user = await getUserFromToken(token)

    const searchParams = request.nextUrl.searchParams
    const uploadId = searchParams.get('uploadId')
    const pageNumber = searchParams.get('page')

    if (!uploadId || !pageNumber) {
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

    // Najpierw sprawdź bazę danych (szybsze i bardziej niezawodne)
    const progressPhoto = await prisma.progressPhoto.findUnique({
      where: {
        uploadId_pageNumber: {
          uploadId: uploadId,
          pageNumber: parseInt(pageNumber),
        },
      },
    })

    if (progressPhoto) {
      // AUTOMATYCZNE CZYSZCZENIE: Sprawdź czy plik rzeczywiście istnieje
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 sekund timeout
        
        const response = await fetch(progressPhoto.imageUrl, { 
          method: 'HEAD',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok || response.status === 404) {
          // Plik nie istnieje - usuń osierocony rekord z bazy
          console.log(`Usuwanie osieroconego rekordu: ${progressPhoto.imageUrl}`)
          await prisma.progressPhoto.delete({
            where: {
              uploadId_pageNumber: {
                uploadId: uploadId,
                pageNumber: parseInt(pageNumber),
              },
            },
          })
          return NextResponse.json({ uploaded: false })
        }
      } catch (error: any) {
        // Błąd podczas sprawdzania (np. timeout, sieć, 404) - zakładamy że plik nie istnieje
        if (error.name === 'AbortError') {
          console.log(`Timeout podczas sprawdzania pliku ${progressPhoto.imageUrl}`)
        } else {
          console.log(`Błąd podczas sprawdzania pliku ${progressPhoto.imageUrl}:`, error.message)
        }
        
        try {
          await prisma.progressPhoto.delete({
            where: {
              uploadId_pageNumber: {
                uploadId: uploadId,
                pageNumber: parseInt(pageNumber),
              },
            },
          })
          console.log(`Usunięto osierocony rekord dla strony ${pageNumber}`)
        } catch (deleteError) {
          // Ignoruj błąd usuwania - może już zostać usunięty
          console.log('Błąd podczas usuwania rekordu (może już nie istnieje):', deleteError)
        }
        return NextResponse.json({ uploaded: false })
      }
      
      // Plik istnieje - zwróć URL
      return NextResponse.json({
        uploaded: true,
        imageUrl: progressPhoto.imageUrl,
      })
    }

    // Fallback: Sprawdź pliki w Blob Storage (dla starych uploadów)
    const prefix = `uploads/${uploadId}/page-${pageNumber}/`
    
    const { blobs } = await list({
      prefix,
    })

    if (blobs.length === 0) {
      return NextResponse.json({ uploaded: false })
    }

    // Znajdź najnowszy plik (sortuj po dacie utworzenia)
    const latestBlob = blobs.sort((a, b) => {
      const timeA = new Date(a.uploadedAt).getTime()
      const timeB = new Date(b.uploadedAt).getTime()
      return timeB - timeA
    })[0]

    // Zapisz do bazy danych dla przyszłych zapytań
    try {
      await prisma.progressPhoto.create({
        data: {
          uploadId: uploadId,
          pageNumber: parseInt(pageNumber),
          imageUrl: latestBlob.url,
        },
      })
    } catch (e) {
      // Ignoruj błąd jeśli już istnieje (race condition)
    }

    return NextResponse.json({
      uploaded: true,
      imageUrl: latestBlob.url,
    })
  } catch (error) {
    console.error('Check upload error:', error)
    return NextResponse.json({ uploaded: false })
  }
}
