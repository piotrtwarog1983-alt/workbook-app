import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { generateRegistrationToken } from '@/lib/lemonsqueezy'
import { z } from 'zod'

const ADMIN_EMAIL = 'peter.twarog@cirrenz.com'

const createTokenSchema = z.object({
  email: z.string().email(),
  expiresInDays: z.number().int().min(1).max(365).default(7),
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authToken =
      request.headers.get('authorization')?.replace('Bearer ', '') || null
    const user = await getUserFromToken(authToken)

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Brak dostępu - tylko administrator' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, expiresInDays } = createTokenSchema.parse(body)

    // Sprawdź czy token dla tego emaila już istnieje i nie jest użyty
    const existingToken = await prisma.registrationToken.findFirst({
      where: {
        email,
        used: false,
        expiresAt: {
          gt: new Date(), // Tylko niewygasłe
        },
      },
    })

    if (existingToken) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const registrationUrl = `${appUrl}/signup?token=${existingToken.token}`

      return NextResponse.json({
        message: 'Token już istnieje dla tego emaila',
        token: existingToken.token,
        registrationUrl,
        expiresAt: existingToken.expiresAt,
      })
    }

    const token = generateRegistrationToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    const defaultCourse = await prisma.course.findFirst({
      where: { slug: 'fotografia-kulinarna' },
    })

    const registrationToken = await prisma.registrationToken.create({
      data: {
        token,
        email,
        expiresAt,
        courseId: defaultCourse?.id,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const registrationUrl = `${appUrl}/signup?token=${token}`

    return NextResponse.json({
      success: true,
      token: registrationToken.token,
      email: registrationToken.email,
      registrationUrl,
      expiresAt: registrationToken.expiresAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create token error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

