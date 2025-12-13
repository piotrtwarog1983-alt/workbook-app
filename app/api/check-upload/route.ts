import { NextRequest, NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const uploadId = searchParams.get('uploadId')
    const pageNumber = searchParams.get('page')

    if (!uploadId || !pageNumber) {
      return NextResponse.json(
        { error: 'Brak wymaganych parametrów' },
        { status: 400 }
      )
    }

    const uploadOwner = await prisma.user.findUnique({
      where: { uploadId },
    })

    if (!uploadOwner) {
      return NextResponse.json(
        { error: 'Nieprawidłowy identyfikator uploadu' },
        { status: 403 }
      )
    }

    const uploadDir = join(
      process.cwd(),
      'public',
      'uploads',
      uploadId,
      `page-${pageNumber}`
    )

    if (!existsSync(uploadDir)) {
      return NextResponse.json({ uploaded: false })
    }

    const files = await readdir(uploadDir)
    const latestFile = files.sort().reverse()[0]

    if (latestFile) {
      return NextResponse.json({
        uploaded: true,
        imageUrl: `/uploads/${uploadId}/page-${pageNumber}/${latestFile}`,
      })
    }

    return NextResponse.json({ uploaded: false })
  } catch (error) {
    console.error('Check upload error:', error)
    return NextResponse.json({ uploaded: false })
  }
}

