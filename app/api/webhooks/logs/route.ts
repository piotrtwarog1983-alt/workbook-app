import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/webhooks/logs - Get recent webhook logs
 * Requires admin auth or specific query param for debugging
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const debugKey = searchParams.get('key')
  
  // Simple protection - require debug key
  const expectedKey = process.env.WEBHOOK_DEBUG_KEY || 'debug123'
  if (debugKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const source = searchParams.get('source') || undefined
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  try {
    const logs = await prisma.webhookLog.findMany({
      where: source ? { source } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      count: logs.length,
      logs: logs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching webhook logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: String(error) },
      { status: 500 }
    )
  }
}

