import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyLemonSqueezySignature, generateRegistrationToken } from '@/lib/lemonsqueezy'
import { sendRegistrationEmail } from '@/lib/email'

const LEMON_SQUEEZY_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature') || ''
    const body = await request.text()
    
    // Verify webhook signature
    if (!verifyLemonSqueezySignature(body, signature, LEMON_SQUEEZY_SECRET)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    const { meta, data } = event

    // Handle order_created event
    if (meta.event_name === 'order_created') {
      const order = data.attributes
      const customerEmail = order.customer_email || order.user_email
      
      if (!customerEmail) {
        return NextResponse.json(
          { error: 'No customer email' },
          { status: 400 }
        )
      }

      // Check if order already processed
      const existingOrder = await prisma.lemonSqueezyOrder.findUnique({
        where: { orderId: data.id },
      })

      if (existingOrder) {
        return NextResponse.json({ message: 'Order already processed' })
      }

      // Generate registration token
      const token = generateRegistrationToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Token valid for 7 days

      const registrationToken = await prisma.registrationToken.create({
        data: {
          token,
          email: customerEmail,
          expiresAt,
        },
      })

      // Save order
      await prisma.lemonSqueezyOrder.create({
        data: {
          orderId: data.id,
          customerEmail,
          status: order.status,
          total: parseFloat(order.total) || 0,
          currency: order.currency || 'PLN',
          orderData: event,
          registrationTokenId: registrationToken.id,
        },
      })

      // Send registration email
      const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?token=${token}`
      await sendRegistrationEmail(customerEmail, registrationUrl)

      return NextResponse.json({ 
        message: 'Order processed successfully',
        token: registrationToken.id 
      })
    }

    return NextResponse.json({ message: 'Event not handled' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

