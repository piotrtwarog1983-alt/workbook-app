import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null
    
    // Diagnostyka
    console.log('upload-id: Auth header present:', !!authHeader)
    console.log('upload-id: Token present:', !!token)
    console.log('upload-id: Token length:', token?.length || 0)
    
    if (!token) {
      console.log('upload-id: No token provided')
      return NextResponse.json(
        { error: 'Brak tokenu autoryzacji' },
        { status: 401 }
      )
    }
    
    // Sprawdź czy token jest poprawny
    const payload = verifyToken(token)
    console.log('upload-id: Token payload:', payload ? 'valid' : 'invalid')
    
    if (!payload) {
      console.log('upload-id: Token verification failed')
      return NextResponse.json(
        { error: 'Nieprawidłowy lub wygasły token' },
        { status: 401 }
      )
    }
    
    const user = await getUserFromToken(token)
    console.log('upload-id: User found:', !!user)

    if (!user) {
      console.log('upload-id: User not found in database')
      return NextResponse.json(
        { error: 'Użytkownik nie znaleziony' },
        { status: 401 }
      )
    }

    console.log('upload-id: Returning uploadId:', user.uploadId)
    return NextResponse.json({
      uploadId: user.uploadId,
    })
  } catch (error) {
    console.error('Get upload ID error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

