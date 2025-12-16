import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)
    const normalizedEmail = email.toLowerCase()

    // Zawsze zwracaj sukces - nie ujawniaj czy email istnieje w bazie
    const successResponse = NextResponse.json({
      success: true,
      message: 'Jeśli podany email istnieje w naszej bazie, otrzymasz wiadomość z linkiem do resetowania hasła.',
    })

    // Sprawdź czy użytkownik istnieje
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      // Nie ujawniaj, że użytkownik nie istnieje
      return successResponse
    }

    // Unieważnij poprzednie tokeny resetu dla tego emaila
    await prisma.passwordResetToken.updateMany({
      where: { 
        email: normalizedEmail,
        used: false,
      },
      data: { used: true },
    })

    // Wygeneruj nowy token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 godzina

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    })

    // Wyślij email z linkiem
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'
    const resetUrl = `${appUrl}/reset-password?token=${token}`

    const emailSent = await sendPasswordResetEmail(normalizedEmail, resetUrl)

    if (!emailSent) {
      console.error('Failed to send password reset email to:', normalizedEmail)
    }

    return successResponse
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Nieprawidłowy adres email' },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}


