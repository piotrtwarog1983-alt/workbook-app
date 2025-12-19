import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Weryfikacja tokenu
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Brak tokenu' }, { status: 400 })
    }

    const resetToken = await (prisma as any).passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return NextResponse.json({ valid: false, error: 'Nieprawidłowy token' }, { status: 400 })
    }

    if (resetToken.used) {
      return NextResponse.json({ valid: false, error: 'Token został już wykorzystany' }, { status: 400 })
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ valid: false, error: 'Token wygasł' }, { status: 400 })
    }

    return NextResponse.json({ valid: true, email: resetToken.email })
  } catch (error) {
    console.error('Verify reset token error:', error)
    return NextResponse.json(
      { valid: false, error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

// POST - Resetowanie hasła
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token i hasło są wymagane' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Hasło musi mieć co najmniej 8 znaków' }, { status: 400 })
    }

    // Znajdź i zweryfikuj token
    const resetToken = await (prisma as any).passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 400 })
    }

    if (resetToken.used) {
      return NextResponse.json({ error: 'Token został już wykorzystany' }, { status: 400 })
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json({ error: 'Token wygasł' }, { status: 400 })
    }

    // Znajdź użytkownika
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Użytkownik nie istnieje' }, { status: 400 })
    }

    // Zaktualizuj hasło
    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Oznacz token jako wykorzystany
    await (prisma as any).passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    })

    console.log('Password reset successful for:', resetToken.email)

    return NextResponse.json({ 
      success: true,
      message: 'Hasło zostało zmienione. Możesz się teraz zalogować.'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}





