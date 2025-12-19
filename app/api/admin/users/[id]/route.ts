import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

const ADMIN_EMAIL = 'peter.twarog@cirrenz.com'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Sprawdź autoryzację
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Sprawdź czy to admin
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!admin || admin.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Sprawdź czy użytkownik istnieje
    const userToDelete = await prisma.user.findUnique({
      where: { id },
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Nie pozwól usunąć admina
    if (userToDelete.email === ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Cannot delete admin account' }, { status: 400 })
    }

    // Usuń użytkownika (cascade usunie powiązane dane)
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}






