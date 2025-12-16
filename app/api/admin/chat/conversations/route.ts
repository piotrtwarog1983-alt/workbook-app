import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

const ADMIN_EMAIL = 'peter.twarog@cirrenz.com'

// GET - lista wszystkich konwersacji (tylko dla admina)
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

    // Sprawdź czy to admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    // Pobierz wszystkie konwersacje z ostatnią wiadomością
    const conversations = await prisma.conversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Tylko ostatnia wiadomość
        },
      },
    })

    // Formatuj dane
    const formattedConversations = conversations.map((conv: any) => ({
      id: conv.id,
      userId: conv.userId,
      userEmail: conv.user.email,
      userName: conv.user.name,
      subject: conv.subject,
      lastMessage: conv.messages[0]?.text || '',
      lastMessageAt: conv.lastMessageAt,
      lastMessageSender: conv.messages[0]?.sender || null,
      unreadByAdmin: conv.unreadByAdmin,
      createdAt: conv.createdAt,
    }))

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}


