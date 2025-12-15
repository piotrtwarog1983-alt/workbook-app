import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'

const ADMIN_EMAIL = 'peter.twarog@cirrenz.com'

// POST - wyślij wiadomość jako admin
export async function POST(request: NextRequest) {
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

    // Sprawdź czy to admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    const body = await request.json()
    const { conversationId, text } = body

    if (!conversationId || !text || !text.trim()) {
      return NextResponse.json({ error: 'Brak wymaganych danych' }, { status: 400 })
    }

    // Sprawdź czy konwersacja istnieje
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Konwersacja nie znaleziona' }, { status: 404 })
    }

    // Utwórz wiadomość
    const message = await prisma.message.create({
      data: {
        conversationId,
        sender: 'admin',
        text: text.trim(),
        status: 'sent',
      },
    })

    // Zaktualizuj konwersację
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadByUser: true,
        unreadByAdmin: false,
      },
    })

    // Wyślij event przez Pusher
    try {
      await pusherServer.trigger(`chat-${conversationId}`, 'message:new', {
        message,
        conversationId,
      })
    } catch (pusherError) {
      console.error('Pusher error:', pusherError)
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error sending admin message:', error)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
