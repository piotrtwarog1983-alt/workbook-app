import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PROGRESS_PAGES_SET } from '@/lib/progress-pages'

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

    const numericPage = parseInt(pageNumber, 10)
    if (!Number.isFinite(numericPage) || !PROGRESS_PAGES_SET.has(numericPage)) {
      return NextResponse.json(
        { error: 'Strona nie obsługuje galerii postępów' },
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

    // Sprawdź pliki w Blob Storage
    const prefix = `uploads/${uploadId}/page-${numericPage}/`
    
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

    return NextResponse.json({
      uploaded: true,
      imageUrl: latestBlob.url,
    })
  } catch (error) {
    console.error('Check upload error:', error)
    return NextResponse.json({ uploaded: false })
  }
}
