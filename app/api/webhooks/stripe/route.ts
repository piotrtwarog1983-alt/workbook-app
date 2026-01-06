import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyStripeSignature,
  generateRegistrationToken,
  type StripeWebhookEvent,
  type StripeCheckoutSession,
} from '@/lib/stripe'
import { sendRegistrationEmail } from '@/lib/email'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature') || ''
    const body = await request.text()

    // Verify webhook signature
    if (STRIPE_WEBHOOK_SECRET) {
      if (!signature || !verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET)) {
        console.error('Invalid Stripe signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else {
      console.warn(
        'STRIPE_WEBHOOK_SECRET is not configured. Skipping signature verification.'
      )
    }

    const event: StripeWebhookEvent = JSON.parse(body)

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as StripeCheckoutSession

      // Only process paid sessions
      if (session.payment_status !== 'paid') {
        return NextResponse.json({ message: 'Payment not completed yet' })
      }

      const customerEmail = 
        session.customer_email || 
        session.customer_details?.email

      if (!customerEmail) {
        console.error('No customer email in Stripe session:', session.id)
        return NextResponse.json(
          { error: 'Brak adresu email klienta' },
          { status: 400 }
        )
      }

      // Check if order was already processed
      const existingOrder = await prisma.stripeOrder.findUnique({
        where: { sessionId: session.id },
      })

      if (existingOrder) {
        return NextResponse.json({ message: 'Order already processed' })
      }

      // Generate registration token
      const token = generateRegistrationToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Token valid for 7 days

      // Find default course
      const defaultCourse = await prisma.course.findFirst({
        where: { slug: 'fotografia-kulinarna' },
      })

      // Create registration token
      const registrationToken = await prisma.registrationToken.create({
        data: {
          token,
          email: customerEmail,
          expiresAt,
          courseId: defaultCourse?.id,
        },
      })

      // Store Stripe order
      await prisma.stripeOrder.create({
        data: {
          sessionId: session.id,
          paymentIntentId: session.payment_intent || null,
          customerEmail,
          status: session.status,
          total: session.amount_total ? session.amount_total / 100 : null, // Stripe amounts are in cents
          currency: session.currency?.toUpperCase() || 'PLN',
          orderData: event as unknown as Record<string, unknown>,
          registrationTokenId: registrationToken.id,
        },
      })

      // Build registration URL
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

      const registrationUrl = `${appUrl?.replace(/\/$/, '') || 'http://localhost:3000'}/signup?token=${token}`

      // Send registration email
      await sendRegistrationEmail(customerEmail, registrationUrl)

      console.log(`Stripe order processed: ${session.id}, email: ${customerEmail}`)

      return NextResponse.json({
        message: 'Order processed successfully',
        token: registrationToken.id,
      })
    }

    // Handle payment_intent.payment_failed for logging purposes
    if (event.type === 'payment_intent.payment_failed') {
      console.error('Payment failed:', event.data.object)
      return NextResponse.json({ message: 'Payment failure logged' })
    }

    // Other events - just acknowledge receipt
    return NextResponse.json({ message: 'Event received but not handled' })

  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

