import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - pobierz wszystkie zdjęcia postępów (lista dla admina)
export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get('authorization')?.replace('Bearer ', '') || null
    const user = await getUserFromToken(token)

    if (!user || user.email !== 'piotr.twarog1983@gmail.com') {
      return NextResponse.json(
        { error: 'Brak dostępu' },
        { status: 403 }
      )
    }

    const photos = await prisma.progressPhoto.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Grupuj zdjęcia według uploadId
    const groupedPhotos: Record<string, typeof photos> = {}
    for (const photo of photos) {
      if (!groupedPhotos[photo.uploadId]) {
        groupedPhotos[photo.uploadId] = []
      }
      groupedPhotos[photo.uploadId].push(photo)
    }

    return NextResponse.json({
      totalCount: photos.length,
      groupedByUser: groupedPhotos,
      photos: photos,
    })
  } catch (error) {
    console.error('Get progress photos error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

// DELETE - usuń wszystkie zdjęcia postępów lub dla konkretnego uploadId
export async function DELETE(request: NextRequest) {
  try {
    const token =
      request.headers.get('authorization')?.replace('Bearer ', '') || null
    const user = await getUserFromToken(token)

    if (!user || user.email !== 'piotr.twarog1983@gmail.com') {
      return NextResponse.json(
        { error: 'Brak dostępu' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const uploadId = searchParams.get('uploadId')
    const deleteOrphans = searchParams.get('deleteOrphans') === 'true'
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (deleteOrphans) {
      // Usuń osierocone rekordy (te, które mają nieistniejące URL-e)
      const photos = await prisma.progressPhoto.findMany()
      let deletedCount = 0
      const errors: string[] = []

      for (const photo of photos) {
        try {
          // Sprawdź czy plik istnieje w Blob Storage
          const response = await fetch(photo.imageUrl, { method: 'HEAD' })
          
          if (!response.ok || response.status === 404) {
            // Plik nie istnieje - usuń rekord z bazy
            await prisma.progressPhoto.delete({
              where: { id: photo.id },
            })
            deletedCount++
          }
        } catch (e) {
          // Błąd podczas sprawdzania - prawdopodobnie plik nie istnieje
          try {
            await prisma.progressPhoto.delete({
              where: { id: photo.id },
            })
            deletedCount++
          } catch (deleteError) {
            errors.push(`Nie można usunąć ${photo.id}: ${deleteError}`)
          }
        }
      }

      return NextResponse.json({
        success: true,
        deletedCount,
        totalChecked: photos.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Usunięto ${deletedCount} osieroconych rekordów z ${photos.length} sprawdzonych`,
      })
    }

    if (deleteAll) {
      // Usuń wszystkie zdjęcia - najpierw z Blob, potem z bazy
      const photos = await prisma.progressPhoto.findMany()
      
      for (const photo of photos) {
        try {
          await del(photo.imageUrl)
        } catch (e) {
          console.log(`Could not delete blob: ${photo.imageUrl}`)
        }
      }

      const result = await prisma.progressPhoto.deleteMany({})

      return NextResponse.json({
        success: true,
        deletedCount: result.count,
        message: `Usunięto wszystkie ${result.count} zdjęć`,
      })
    }

    if (uploadId) {
      // Usuń wszystkie zdjęcia dla konkretnego użytkownika
      const photos = await prisma.progressPhoto.findMany({
        where: { uploadId },
      })

      for (const photo of photos) {
        try {
          await del(photo.imageUrl)
        } catch (e) {
          console.log(`Could not delete blob: ${photo.imageUrl}`)
        }
      }

      const result = await prisma.progressPhoto.deleteMany({
        where: { uploadId },
      })

      return NextResponse.json({
        success: true,
        deletedCount: result.count,
        message: `Usunięto ${result.count} zdjęć dla uploadId: ${uploadId}`,
      })
    }

    return NextResponse.json(
      { error: 'Podaj uploadId, deleteOrphans=true lub deleteAll=true' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Delete progress photos error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

