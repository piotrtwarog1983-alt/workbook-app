import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Pobierz wszystkie konwersacje (dla admina)
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

    // Sprawdź czy użytkownik jest adminem (email kończy się na odpowiedniej domenie)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || !user.email.includes('eulalia')) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
    }

    // Pobierz wszystkie konwersacje z ostatnią wiadomością
    const conversations = await (prisma as any).conversation.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    // Formatuj odpowiedź
    const formattedConversations = conversations.map((conv: any) => ({
      id: conv.id,
      userId: conv.userId,
      user: conv.user,
      subject: conv.subject,
      lastMessage: conv.messages[0]?.text || '',
      lastMessageAt: conv.lastMessageAt,
      unreadByAdmin: conv.unreadByAdmin,
      createdAt: conv.createdAt
    }))

    return NextResponse.json(formattedConversations)
  } catch (error) {
    console.error('Get admin conversations error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}














