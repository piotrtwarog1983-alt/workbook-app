import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'

// POST - wyślij wiadomość (user)
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

    const body = await request.json()
    const { text } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Tekst wiadomości jest wymagany' }, { status: 400 })
    }

    // Znajdź lub utwórz konwersację
    let conversation = await prisma.conversation.findFirst({
      where: { userId: payload.userId },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId: payload.userId },
      })
    }

    // Utwórz wiadomość
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'user',
        text: text.trim(),
        status: 'sent',
      },
    })

    // Zaktualizuj konwersację
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadByAdmin: true,
      },
    })

    // Wyślij event przez Pusher
    try {
      await pusherServer.trigger(`chat-${conversation.id}`, 'message:new', {
        message,
        conversationId: conversation.id,
      })
      // Powiadom panel admin o nowej wiadomości
      await pusherServer.trigger('admin-inbox', 'conversation:updated', {
        conversationId: conversation.id,
      })
    } catch (pusherError) {
      console.error('Pusher error:', pusherError)
      // Nie przerywaj - wiadomość i tak została zapisana
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
