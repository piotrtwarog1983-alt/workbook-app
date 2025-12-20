import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { triggerPusherEvent } from '@/lib/pusher'

// GET - Pobierz wiadomości z konwersacji
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

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!conversationId) {
      return NextResponse.json({ error: 'Brak ID konwersacji' }, { status: 400 })
    }

    // Sprawdź czy konwersacja należy do użytkownika
    const conversation = await (prisma as any).conversation.findFirst({
      where: {
        id: conversationId,
        userId: decoded.userId
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Konwersacja nie znaleziona' }, { status: 404 })
    }

    // Pobierz wiadomości z paginacją
    const messages = await (prisma as any).message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor }
      })
    })

    // Oznacz konwersację jako przeczytaną przez użytkownika
    if (conversation.unreadByUser) {
      await (prisma as any).conversation.update({
        where: { id: conversationId },
        data: { unreadByUser: false }
      })
    }

    return NextResponse.json({
      messages,
      nextCursor: messages.length === limit ? messages[messages.length - 1]?.id : null
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

// POST - Wyślij nową wiadomość
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

    const { conversationId, text } = await request.json()

    if (!conversationId || !text?.trim()) {
      return NextResponse.json({ error: 'Brak wymaganych danych' }, { status: 400 })
    }

    // Sprawdź czy konwersacja należy do użytkownika
    const conversation = await (prisma as any).conversation.findFirst({
      where: {
        id: conversationId,
        userId: decoded.userId
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Konwersacja nie znaleziona' }, { status: 404 })
    }

    // Utwórz wiadomość
    const message = await (prisma as any).message.create({
      data: {
        conversationId,
        sender: 'user',
        text: text.trim(),
        status: 'sent'
      }
    })

    // Aktualizuj konwersację
    await (prisma as any).conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadByAdmin: true
      }
    })

    // Wyślij event przez Pusher (jeśli skonfigurowany)
    await triggerPusherEvent(`chat-${conversationId}`, 'message:new', message)
    
    // Powiadom admin inbox
    await triggerPusherEvent('admin-inbox', 'conversation:updated', {
      conversationId,
      lastMessage: text.trim(),
      unreadByAdmin: true
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}














