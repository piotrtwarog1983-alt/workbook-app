import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

const ADMIN_EMAIL = 'peter.twarog@cirrenz.com'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get('authorization')?.replace('Bearer ', '') || null
    const user = await getUserFromToken(token)

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Brak dostępu' },
        { status: 403 }
      )
    }

    const tokens = await prisma.registrationToken.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Ostatnie 100 tokenów
    })

    return NextResponse.json({ tokens })
  } catch (error) {
    console.error('Get tokens error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

