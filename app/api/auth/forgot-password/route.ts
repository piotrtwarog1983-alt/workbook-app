import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'
import { Language } from '@/lib/translations'

export async function POST(request: NextRequest) {
  try {
    const { email, language = 'PL' } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email jest wymagany' }, { status: 400 })
    }
    
    // Walidacja języka
    const validLanguage: Language = (language === 'DE' ? 'DE' : 'PL')

    const normalizedEmail = email.toLowerCase().trim()

    // Sprawdź czy użytkownik istnieje
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    // Zawsze zwracamy sukces (zapobiega enumeracji emaili)
    if (!user) {
      console.log('Password reset requested for non-existent email:', normalizedEmail)
      return NextResponse.json({ 
        success: true,
        message: 'Jeśli konto istnieje, link do resetowania hasła został wysłany na podany adres email.'
      })
    }

    // Unieważnij poprzednie tokeny
    await (prisma as any).passwordResetToken.updateMany({
      where: { 
        email: normalizedEmail,
        used: false 
      },
      data: { used: true }
    })

    // Wygeneruj nowy token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 godzina

    await (prisma as any).passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt
      }
    })

    // Wyślij email z linkiem
    let appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl && process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`
    }
    if (!appUrl) {
      appUrl = 'http://localhost:3000'
    }
    // Usuń trailing slash jeśli jest
    appUrl = appUrl.replace(/\/$/, '')
    
    const resetUrl = `${appUrl}/reset-password?token=${token}`

    console.log('Sending password reset email to:', normalizedEmail)
    console.log('Reset URL:', resetUrl)

    const emailSent = await sendPasswordResetEmail(normalizedEmail, resetUrl, validLanguage)

    if (!emailSent) {
      console.error('Failed to send password reset email')
    }

    return NextResponse.json({ 
      success: true,
      message: 'Jeśli konto istnieje, link do resetowania hasła został wysłany na podany adres email.'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}













