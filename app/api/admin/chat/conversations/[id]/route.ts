import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

const ADMIN_EMAIL = 'peter.twarog@cirrenz.com'

// GET - szczegóły konwersacji z wiadomościami
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 })
    }

    // Sprawdź czy to admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    // Pobierz konwersację z wiadomościami
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Konwersacja nie znaleziona' }, { status: 404 })
    }

    // Oznacz jako przeczytane przez admina
    if (conversation.unreadByAdmin) {
      await prisma.conversation.update({
        where: { id },
        data: { unreadByAdmin: false },
      })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
