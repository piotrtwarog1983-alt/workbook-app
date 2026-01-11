import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendRegistrationEmail } from '@/lib/email'

const FASTSPRING_WEBHOOK_SECRET = process.env.FASTSPRING_WEBHOOK_SECRET || ''

export const dynamic = 'force-dynamic'

// Generuj token rejestracyjny
function generateRegistrationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Weryfikacja podpisu FastSpring (HMAC-SHA256)
function verifyFastSpringSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) return true // Pomiń weryfikację jeśli brak secretu
  
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload, 'utf8')
  const expectedSignature = hmac.digest('base64')
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

// Logowanie webhooka do bazy danych
async function logWebhook(data: {
  eventType?: string
  eventId?: string
  status: string
  statusCode?: number
  message?: string
  payload?: unknown
}) {
  try {
    await prisma.webhookLog.create({
      data: {
        source: 'fastspring',
        eventType: data.eventType,
        eventId: data.eventId,
        status: data.status,
        statusCode: data.statusCode,
        message: data.message,
        payload: data.payload ? JSON.parse(JSON.stringify(data.payload)) : null,
      },
    })
  } catch (logError) {
    console.error('Failed to log webhook:', logError)
  }
}

// Typy FastSpring
interface FastSpringEvent {
  id: string
  type: string
  live: boolean
  created: number
  data: {
    id?: string
    order?: string
    reference?: string
    customer?: {
      email?: string
      language?: string
    }
    recipient?: {
      email?: string
    }
    total?: {
      value?: number
      currency?: string
    }
    totalInPayoutCurrency?: number
    currency?: string
    tags?: {
      language?: string
      [key: string]: string | undefined
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('🔔 FastSpring webhook received')
  
  await logWebhook({
    status: 'received',
    message: 'Webhook request received',
  })
  
  try {
    const signature = request.headers.get('x-fs-signature') || ''
    const body = await request.text()

    console.log('📋 ========== FastSpring Webhook Received ==========')
    console.log('📋 Webhook body length:', body.length, 'bytes')
    console.log('🔑 Signature header present:', !!signature)
    console.log('🔐 FASTSPRING_WEBHOOK_SECRET configured:', !!FASTSPRING_WEBHOOK_SECRET)

    // Weryfikacja podpisu
    if (FASTSPRING_WEBHOOK_SECRET && FASTSPRING_WEBHOOK_SECRET.length > 0) {
      if (!signature) {
        console.error('❌ Missing FastSpring signature header')
        await logWebhook({
          status: 'error',
          statusCode: 401,
          message: 'Missing FastSpring signature header',
        })
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        )
      }
      
      const isValid = verifyFastSpringSignature(body, signature, FASTSPRING_WEBHOOK_SECRET)
      console.log('✅ Signature verification result:', isValid)
      
      if (!isValid) {
        console.error('❌ Invalid FastSpring signature')
        await logWebhook({
          status: 'error',
          statusCode: 401,
          message: 'Invalid FastSpring signature',
        })
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else {
      console.warn('⚠️ FASTSPRING_WEBHOOK_SECRET not configured - skipping signature verification')
    }

    // Parsowanie eventu FastSpring
    let events: FastSpringEvent[]
    try {
      const parsed = JSON.parse(body)
      // FastSpring wysyła tablicę eventów
      events = Array.isArray(parsed.events) ? parsed.events : [parsed]
      console.log('📨 Number of events:', events.length)
    } catch (parseError) {
      console.error('❌ Failed to parse webhook body:', parseError)
      await logWebhook({
        status: 'error',
        statusCode: 400,
        message: `Failed to parse webhook body: ${parseError}`,
      })
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Przetwarzanie eventów
    for (const event of events) {
      console.log('📨 Processing event type:', event.type)
      console.log('📨 Event ID:', event.id)
      
      await logWebhook({
        eventType: event.type,
        eventId: event.id,
        status: 'processing',
        message: 'Event parsed successfully',
      })

      // Obsługa zakończonego zamówienia
      if (event.type === 'order.completed' || event.type === 'order.completed.extended') {
        console.log('💳 Processing order.completed')
        
        const order = event.data
        const customerEmail = order?.customer?.email || order?.recipient?.email

        console.log('📧 Customer email:', customerEmail)

        if (!customerEmail) {
          console.error('❌ No customer email in FastSpring order')
          await logWebhook({
            eventType: event.type,
            eventId: event.id,
            status: 'error',
            statusCode: 400,
            message: 'No customer email in order',
          })
          continue
        }

        // Sprawdź czy zamówienie już zostało przetworzone
        const existingOrder = await prisma.fastSpringOrder.findUnique({
          where: { orderId: order.id || event.id },
        })

        if (existingOrder) {
          console.log('⚠️ Order already processed:', existingOrder.id)
          await logWebhook({
            eventType: event.type,
            eventId: event.id,
            status: 'success',
            statusCode: 200,
            message: 'Order already processed',
          })
          continue
        }

        // Generuj token rejestracyjny
        console.log('🔑 Generating registration token...')
        const token = generateRegistrationToken()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        // Znajdź domyślny kurs
        const defaultCourse = await prisma.course.findFirst({
          where: { slug: 'fotografia-kulinarna' },
        })
        console.log('📚 Default course found:', defaultCourse?.id || 'NOT FOUND')

        // Utwórz token rejestracyjny
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
          await logWebhook({
            eventType: event.type,
            eventId: event.id,
            status: 'error',
            statusCode: 500,
            message: `Failed to create registration token: ${tokenError}`,
          })
          continue
        }

        // Zapisz zamówienie FastSpring
        try {
          await prisma.fastSpringOrder.create({
            data: {
              orderId: order.id || event.id,
              customerEmail,
              status: 'completed',
              total: order.total?.value || order.totalInPayoutCurrency || 0,
              currency: order.total?.currency || order.currency || 'PLN',
              orderData: JSON.parse(JSON.stringify(event)),
              registrationTokenId: registrationToken.id,
            },
          })
          console.log('✅ FastSpring order stored')
        } catch (orderError) {
          console.error('❌ Error storing FastSpring order:', orderError)
          // Continue - the token is created, we should still send email
        }

        // Zbuduj URL rejestracji
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

        const registrationUrl = `${appUrl?.replace(/\/$/, '') || 'http://localhost:3000'}/signup?token=${token}`
        console.log('🔗 Registration URL:', registrationUrl)

        // Określ język z danych zamówienia
        const rawLanguage = order?.tags?.language || order?.customer?.language || 'en'
        const language = rawLanguage.toUpperCase() as 'PL' | 'EN' | 'DE' | 'IT' | 'FR' | 'ES'
        const validLanguages = ['PL', 'EN', 'DE', 'IT', 'FR', 'ES']
        const validLanguage = validLanguages.includes(language) ? language : 'EN'
        console.log('🌍 Email language:', validLanguage, '(from:', rawLanguage, ')')

        // Wyślij email rejestracyjny
        try {
          const emailSent = await sendRegistrationEmail(customerEmail, registrationUrl, validLanguage)
          console.log('📧 Registration email sent:', emailSent)
        } catch (emailError) {
          console.error('❌ Error sending email:', emailError)
        }

        console.log(`✅ FastSpring order processed: ${order.id || event.id}, email: ${customerEmail}`)

        await logWebhook({
          eventType: event.type,
          eventId: event.id,
          status: 'success',
          statusCode: 200,
          message: `Order processed: ${order.id || event.id}, email: ${customerEmail}`,
        })
      } else {
        // Inne eventy - tylko loguj
        await logWebhook({
          eventType: event.type,
          eventId: event.id,
          status: 'success',
          statusCode: 200,
          message: 'Event received but not handled',
        })
      }
    }

    return NextResponse.json({
      message: 'Webhook processed successfully',
    })

  } catch (error) {
    console.error('FastSpring webhook error:', error)
    await logWebhook({
      status: 'error',
      statusCode: 500,
      message: `Internal server error: ${error}`,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
