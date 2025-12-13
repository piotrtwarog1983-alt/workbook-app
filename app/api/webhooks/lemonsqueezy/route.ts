import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyLemonSqueezySignature,
  generateRegistrationToken,
} from '@/lib/lemonsqueezy'
import { sendRegistrationEmail } from '@/lib/email'

const LEMON_SQUEEZY_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || ''

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature') || ''
    const body = await request.text()

    if (LEMON_SQUEEZY_SECRET) {
      if (
        !signature ||
        !verifyLemonSqueezySignature(body, signature, LEMON_SQUEEZY_SECRET)
      ) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else {
      console.warn(
        'LEMON_SQUEEZY_WEBHOOK_SECRET is not configured. Skipping signature verification.'
      )
    }

    const event = JSON.parse(body)
    const { meta, data } = event

    if (meta?.event_name !== 'order_created') {
      return NextResponse.json({ message: 'Event not handled' })
    }

    const order = data?.attributes
    const customerEmail = order?.customer_email || order?.user_email

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Brak adresu email klienta' },
        { status: 400 }
      )
    }

    const existingOrder = await prisma.lemonSqueezyOrder.findUnique({
      where: { orderId: data.id },
    })

    if (existingOrder) {
      return NextResponse.json({ message: 'Order already processed' })
    }

    const token = generateRegistrationToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const defaultCourse = await prisma.course.findFirst({
      where: { slug: 'fotografia-kulinarna' },
    })

    const registrationToken = await prisma.registrationToken.create({
      data: {
        token,
        email: customerEmail,
        expiresAt,
        courseId: defaultCourse?.id,
      },
    })

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

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

    const registrationUrl = `${appUrl?.replace(/\/$/, '') || 'http://localhost:3000'}/signup?token=${token}`

    await sendRegistrationEmail(customerEmail, registrationUrl)

    return NextResponse.json({
      message: 'Order processed successfully',
      token: registrationToken.id,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

