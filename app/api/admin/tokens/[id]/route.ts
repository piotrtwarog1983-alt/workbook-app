import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { sendRegistrationEmail, type EmailLanguage } from '@/lib/email'

const ADMIN_EMAIL = 'peter.twarog@cirrenz.com'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/admin/tokens/[id] - Delete a registration token
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tokenId = params.id

    // Check if token exists
    const token = await prisma.registrationToken.findUnique({
      where: { id: tokenId },
    })

    if (!token) {
      return NextResponse.json(
        { error: 'Token nie istnieje' },
        { status: 404 }
      )
    }

    // Delete the token
    await prisma.registrationToken.delete({
      where: { id: tokenId },
    })

    return NextResponse.json({
      success: true,
      message: 'Token został usunięty',
    })
  } catch (error) {
    console.error('Delete token error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/tokens/[id] - Send registration email for a token
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tokenId = params.id

    // Get optional language from request body
    let language: EmailLanguage = 'EN'
    try {
      const body = await request.json()
      if (body.language && ['PL', 'EN', 'DE', 'IT', 'FR', 'ES'].includes(body.language)) {
        language = body.language as EmailLanguage
      }
    } catch {
      // No body or invalid JSON - use default language
    }

    // Check if token exists
    const token = await prisma.registrationToken.findUnique({
      where: { id: tokenId },
    })

    if (!token) {
      return NextResponse.json(
        { error: 'Token nie istnieje' },
        { status: 404 }
      )
    }

    // Check if token is already used
    if (token.used) {
      return NextResponse.json(
        { error: 'Token został już użyty' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date(token.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Token wygasł' },
        { status: 400 }
      )
    }

    // Build registration URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const registrationUrl = `${appUrl.replace(/\/$/, '')}/signup?token=${token.token}`

    // Send email
    const emailSent = await sendRegistrationEmail(token.email, registrationUrl, language)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Nie udało się wysłać emaila' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Email został wysłany do ${token.email}`,
      email: token.email,
      language,
    })
  } catch (error) {
    console.error('Send token email error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

