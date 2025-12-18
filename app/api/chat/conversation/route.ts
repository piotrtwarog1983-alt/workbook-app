import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET - Pobierz lub utwórz konwersację użytkownika
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

    // Znajdź istniejącą konwersację lub utwórz nową
    let conversation = await (prisma as any).conversation.findFirst({
      where: { userId: decoded.userId },
      orderBy: { lastMessageAt: 'desc' }
    })

    if (!conversation) {
      conversation = await (prisma as any).conversation.create({
        data: {
          userId: decoded.userId,
          subject: 'Główna konwersacja'
        }
      })
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

