import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, password, name } = registerSchema.parse(body)

    const registrationToken = await prisma.registrationToken.findUnique({
      where: { token },
    })

    if (!registrationToken) {
      return NextResponse.json(
        { error: 'Nieprawidłowy token rejestracji' },
        { status: 400 }
      )
    }

    if (registrationToken.used) {
      return NextResponse.json(
        { error: 'Token został już wykorzystany' },
        { status: 400 }
      )
    }

    if (new Date() > registrationToken.expiresAt) {
      return NextResponse.json(
        { error: 'Token wygasł' },
        { status: 400 }
      )
    }

    if (registrationToken.email !== email) {
      return NextResponse.json(
        { error: 'Email nie pasuje do tokenu' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Użytkownik już istnieje' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name?.trim() || email.split('@')[0],
      },
    })

    await prisma.registrationToken.update({
      where: { id: registrationToken.id },
      data: { used: true, userId: user.id },
    })

    const defaultCourse = await prisma.course.findFirst({
      where: { slug: 'fotografia-kulinarna' },
    })

    if (defaultCourse) {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: defaultCourse.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          courseId: defaultCourse.id,
        },
      })
    }

    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json({
      success: true,
      token: jwtToken,
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

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

