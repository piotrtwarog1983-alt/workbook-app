import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { triggerPusherEvent } from '@/lib/pusher'

// GET - Pobierz wiadomości konwersacji (dla admina)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 })
    }

    // Sprawdź czy użytkownik jest adminem
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.email.includes('eulalia')) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Brak ID konwersacji' }, { status: 400 })
    }

    // Pobierz wiadomości
    const messages = await (prisma as any).message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    })

    // Oznacz konwersację jako przeczytaną przez admina
    await (prisma as any).conversation.update({
      where: { id: conversationId },
      data: { unreadByAdmin: false }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Get admin messages error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

// POST - Wyślij wiadomość jako admin
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 })
    }

    // Sprawdź czy użytkownik jest adminem
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.email.includes('eulalia')) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    const { conversationId, text } = await request.json()

    if (!conversationId || !text?.trim()) {
      return NextResponse.json({ error: 'Brak wymaganych danych' }, { status: 400 })
    }

    // Utwórz wiadomość
    const message = await (prisma as any).message.create({
      data: {
        conversationId,
        sender: 'admin',
        text: text.trim(),
        status: 'sent'
      }
    })

    // Aktualizuj konwersację
    await (prisma as any).conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadByUser: true,
        unreadByAdmin: false
      }
    })

    // Wyślij event przez Pusher
    await triggerPusherEvent(`chat-${conversationId}`, 'message:new', message)

    return NextResponse.json(message)
  } catch (error) {
    console.error('Send admin message error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}
