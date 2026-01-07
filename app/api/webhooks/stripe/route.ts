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
  console.log('🔔 Stripe webhook received')
  
  try {
    const signature = request.headers.get('stripe-signature') || ''
    const body = await request.text()

    console.log('📋 Webhook body length:', body.length)
    console.log('🔑 Signature present:', !!signature)
    console.log('🔐 STRIPE_WEBHOOK_SECRET configured:', !!STRIPE_WEBHOOK_SECRET)

    // Verify webhook signature (only if secret is configured)
    if (STRIPE_WEBHOOK_SECRET && STRIPE_WEBHOOK_SECRET.length > 0) {
      if (!signature) {
        console.error('❌ Missing Stripe signature header')
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        )
      }
      
      const isValid = verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET)
      console.log('✅ Signature verification result:', isValid)
      
      if (!isValid) {
        console.error('❌ Invalid Stripe signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else {
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET not configured - skipping signature verification (NOT RECOMMENDED FOR PRODUCTION)')
    }

    let event: StripeWebhookEvent
    try {
      event = JSON.parse(body)
      console.log('📨 Event type:', event.type)
      console.log('📨 Event ID:', event.id)
    } catch (parseError) {
      console.error('❌ Failed to parse webhook body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      console.log('💳 Processing checkout.session.completed')
      const session = event.data.object as StripeCheckoutSession
      console.log('📋 Session ID:', session.id)
      console.log('💰 Payment status:', session.payment_status)

      // Only process paid sessions
      if (session.payment_status !== 'paid') {
        console.log('⏳ Payment not completed yet, waiting...')
        return NextResponse.json({ message: 'Payment not completed yet' })
      }

      const customerEmail = 
        session.customer_email || 
        session.customer_details?.email

      console.log('📧 Customer email:', customerEmail)

      if (!customerEmail) {
        console.error('❌ No customer email in Stripe session:', session.id)
        console.error('Session data:', JSON.stringify(session, null, 2))
        return NextResponse.json(
          { error: 'Brak adresu email klienta' },
          { status: 400 }
        )
      }

      // Check if order was already processed
      console.log('🔍 Checking for existing order...')
      try {
        const existingOrder = await prisma.stripeOrder.findUnique({
          where: { sessionId: session.id },
        })

        if (existingOrder) {
          console.log('⚠️ Order already processed:', existingOrder.id)
          return NextResponse.json({ message: 'Order already processed' })
        }
      } catch (dbError) {
        console.error('❌ Database error checking existing order:', dbError)
        // Continue - maybe the table doesn't exist yet
      }

      // Generate registration token
      console.log('🔑 Generating registration token...')
      const token = generateRegistrationToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Token valid for 7 days

      // Find default course
      console.log('📚 Finding default course...')
      let defaultCourse = null
      try {
        defaultCourse = await prisma.course.findFirst({
          where: { slug: 'fotografia-kulinarna' },
        })
        console.log('📚 Default course found:', defaultCourse?.id || 'NOT FOUND')
      } catch (courseError) {
        console.error('⚠️ Error finding course:', courseError)
      }

      // Create registration token
      console.log('💾 Creating registration token...')
      let registrationToken
      try {
        registrationToken = await prisma.registrationToken.create({
          data: {
            token,
            email: customerEmail,
            expiresAt,
            courseId: defaultCourse?.id,
          },
        })
        console.log('✅ Registration token created:', registrationToken.id)
      } catch (tokenError) {
        console.error('❌ Error creating registration token:', tokenError)
        return NextResponse.json(
          { error: 'Failed to create registration token' },
          { status: 500 }
        )
      }

      // Store Stripe order
      console.log('💾 Storing Stripe order...')
      try {
        await prisma.stripeOrder.create({
          data: {
            sessionId: session.id,
            paymentIntentId: session.payment_intent || null,
            customerEmail,
            status: session.status,
            total: session.amount_total ? session.amount_total / 100 : null,
            currency: session.currency?.toUpperCase() || 'PLN',
            orderData: JSON.parse(JSON.stringify(event)),
            registrationTokenId: registrationToken.id,
          },
        })
        console.log('✅ Stripe order stored')
      } catch (orderError) {
        console.error('❌ Error storing Stripe order:', orderError)
        // Continue - the token is created, we should still send email
      }

      // Build registration URL
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

      console.log('🌐 App URL:', appUrl)
      const registrationUrl = `${appUrl?.replace(/\/$/, '') || 'http://localhost:3000'}/signup?token=${token}`
      console.log('🔗 Registration URL:', registrationUrl)

      // Send registration email
      console.log('📧 Sending registration email...')
      try {
        const emailSent = await sendRegistrationEmail(customerEmail, registrationUrl)
        console.log('📧 Email send result:', emailSent)
      } catch (emailError) {
        console.error('❌ Error sending email:', emailError)
        // Don't fail the webhook - the token is created
      }

      console.log(`✅ Stripe order processed: ${session.id}, email: ${customerEmail}`)

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

