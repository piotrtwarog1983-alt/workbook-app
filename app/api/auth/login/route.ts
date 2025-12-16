import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const dynamic = 'force-dynamic'

// Rate limiting: max 5 nieudanych prób na email w ciągu 15 minut
const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 15

async function checkRateLimit(email: string, ip: string | null): Promise<{ allowed: boolean; remainingAttempts: number }> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)

  try {
    // Sprawdź nieudane próby dla tego emaila w oknie czasowym
    const failedAttempts = await prisma.loginAttempt.count({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: { gte: windowStart },
      },
    })

    return {
      allowed: failedAttempts < MAX_ATTEMPTS,
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - failedAttempts),
    }
  } catch (error) {
    // Jeśli tabela nie istnieje, pozwól na logowanie
    console.error('Rate limit check error:', error)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }
}

async function recordLoginAttempt(email: string, ip: string | null, success: boolean) {
  try {
    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        ip,
        success,
      },
    })

    // Usuń stare próby (starsze niż 24h) - czyszczenie
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: dayAgo } },
    })
  } catch (error) {
    console.error('Record login attempt error:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Pobierz IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               null

    // Sprawdź rate limit
    const { allowed, remainingAttempts } = await checkRateLimit(email, ip)
    if (!allowed) {
      return NextResponse.json(
        { 
          error: `Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za ${WINDOW_MINUTES} minut.`,
          rateLimited: true,
        },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      await recordLoginAttempt(email, ip, false)
      return NextResponse.json(
        { 
          error: 'Nieprawidłowy email lub hasło',
          remainingAttempts: remainingAttempts - 1,
        },
        { status: 401 }
      )
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      await recordLoginAttempt(email, ip, false)
      return NextResponse.json(
        { 
          error: 'Nieprawidłowy email lub hasło',
          remainingAttempts: remainingAttempts - 1,
        },
        { status: 401 }
      )
    }

    // Udane logowanie - zapisz i wyczyść poprzednie nieudane próby
    await recordLoginAttempt(email, ip, true)

    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        uploadId: user.uploadId,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}
