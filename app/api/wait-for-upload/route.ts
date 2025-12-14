import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Max 30 sekund dla Edge

// Long-polling endpoint - czeka na upload zdjęcia
export async function GET(request: NextRequest) {
  const uploadId = request.nextUrl.searchParams.get('uploadId')
  const pageNumber = request.nextUrl.searchParams.get('page')
  const startTime = Date.now()
  const timeout = 25000 // 25 sekund (zostawiamy margines)

  if (!uploadId || !pageNumber) {
    return NextResponse.json({ error: 'Missing uploadId or page' }, { status: 400 })
  }

  const page = parseInt(pageNumber)

  // Sprawdzaj bazę danych co 2 sekundy przez max 25 sekund
  while (Date.now() - startTime < timeout) {
    try {
      const progressPhoto = await prisma.progressPhoto.findFirst({
        where: {
          user: { uploadId },
          pageNumber: page,
        },
        select: { imageUrl: true },
      })

      if (progressPhoto) {
        // Znaleziono zdjęcie - zwróć natychmiast
        return NextResponse.json({
          found: true,
          imageUrl: progressPhoto.imageUrl,
        })
      }
    } catch (error) {
      console.error('Error checking for upload:', error)
    }

    // Czekaj 2 sekundy przed kolejnym sprawdzeniem
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  // Timeout - nie znaleziono zdjęcia
  return NextResponse.json({ found: false })
}
