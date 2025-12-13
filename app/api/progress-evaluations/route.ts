import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const allowedPages = [16, 21, 30, 36, 41, 50]

const evaluationSchema = z.object({
  pageNumber: z.number().int().refine((value) => allowedPages.includes(value), {
    message: 'Nieprawidłowy numer strony',
  }),
  evaluation: z.number().int().refine((value) => [-1, 0, 1].includes(value), {
    message: 'Nieprawidłowa wartość oceny',
  }),
  cumulativeScore: z.number().int().optional(),
})

export const dynamic = 'force-dynamic'

function getToken(request: NextRequest) {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Brak dostępu' },
        { status: 401 }
      )
    }

    const evaluations = await prisma.progressEvaluation.findMany({
      where: { userId: user.id },
      orderBy: { pageNumber: 'asc' },
    })

    return NextResponse.json({ evaluations })
  } catch (error) {
    console.error('Get evaluations error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Brak dostępu' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { pageNumber, evaluation, cumulativeScore = 0 } =
      evaluationSchema.parse(body)

    const savedEvaluation = await prisma.progressEvaluation.upsert({
      where: {
        userId_pageNumber: {
          userId: user.id,
          pageNumber,
        },
      },
      update: {
        evaluation,
        cumulativeScore,
      },
      create: {
        userId: user.id,
        pageNumber,
        evaluation,
        cumulativeScore,
      },
    })

    return NextResponse.json({
      success: true,
      evaluation: savedEvaluation,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Save evaluation error:', error)
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    )
  }
}
