import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MOCK_GLOSSARY_TERMS } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const terms = await prisma.glossaryTerm.findMany({
      orderBy: { term: 'asc' },
    })

    if (terms.length === 0) {
      return NextResponse.json({ terms: MOCK_GLOSSARY_TERMS })
    }

    return NextResponse.json({ terms })
  } catch (error) {
    console.error('Glossary fetch error:', error)
    return NextResponse.json({ terms: MOCK_GLOSSARY_TERMS })
  }
}

