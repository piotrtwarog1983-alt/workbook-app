import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Test endpoint to verify Stripe webhook configuration
 * GET /api/webhooks/stripe/test
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Stripe webhook endpoint is working',
    timestamp: new Date().toISOString(),
    environment: {
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'NOT SET',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'configured' : 'NOT SET',
      EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'NOT SET',
    }
  })
}

