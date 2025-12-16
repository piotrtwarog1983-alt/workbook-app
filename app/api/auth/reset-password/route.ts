import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
})

export const dynamic = 'force-dynamic'

// GET - weryfikacja tokenu (czy jest ważny)
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Brak tokenu' },
        { status: 400 }
      )
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { valid: false, error: 'Nieprawidłowy link resetowania hasła' },
        { status: 400 }
      )
    }

    if (resetToken.used) {
      return NextResponse.json(
        { valid: false, error: 'Ten link został już użyty' },
        { status: 400 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Link wygasł. Poproś o nowy link resetowania hasła.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.email,
    })
  } catch (error) {
    console.error('Verify reset token error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

// POST - ustawienie nowego hasła
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Znajdź token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Nieprawidłowy link resetowania hasła' },
        { status: 400 }
      )
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Ten link został już użyty' },
        { status: 400 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Link wygasł. Poproś o nowy link resetowania hasła.' },
        { status: 400 }
      )
    }

    // Znajdź użytkownika
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Użytkownik nie istnieje' },
        { status: 400 }
      )
    }

    // Zaktualizuj hasło
    const hashedPassword = await hashPassword(password)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Oznacz token jako użyty
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Hasło zostało zmienione. Możesz się teraz zalogować.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}


