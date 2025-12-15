import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - pobierz lub utwórz konwersację dla zalogowanego użytkownika
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 })
    }

    // Znajdź lub utwórz konwersację dla użytkownika
    let conversation = await prisma.conversation.findFirst({
      where: { userId: payload.userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100, // Ostatnie 100 wiadomości
        },
        user: {
          select: { email: true, name: true },
        },
      },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: payload.userId,
        },
        include: {
          messages: true,
          user: {
            select: { email: true, name: true },
          },
        },
      })
    }

    // Oznacz jako przeczytane przez użytkownika
    if (conversation.unreadByUser) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { unreadByUser: false },
      })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
