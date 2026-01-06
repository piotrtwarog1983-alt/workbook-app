import * as crypto from 'crypto'

/**
 * Verify Stripe webhook signature
 * Stripe uses a different signature format than Lemon Squeezy
 */
export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Stripe signature format: t=timestamp,v1=signature
    const parts = signature.split(',')
    const timestampPart = parts.find(p => p.startsWith('t='))
    const signaturePart = parts.find(p => p.startsWith('v1='))

    if (!timestampPart || !signaturePart) {
      return false
    }

    const timestamp = timestampPart.split('=')[1]
    const expectedSignature = signaturePart.split('=')[1]

    // Create the signed payload
    const signedPayload = `${timestamp}.${payload}`

    // Compute the expected signature
    const hmac = crypto.createHmac('sha256', secret)
    const computedSignature = hmac.update(signedPayload).digest('hex')

    // Compare signatures using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(computedSignature)
    )
  } catch {
    return false
  }
}

/**
 * Generate a secure registration token
 */
export function generateRegistrationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Stripe event types we handle
 */
export type StripeEventType = 
  | 'checkout.session.completed'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'

/**
 * Stripe Checkout Session object (simplified)
 */
export interface StripeCheckoutSession {
  id: string
  object: 'checkout.session'
  payment_intent: string | null
  payment_status: 'paid' | 'unpaid' | 'no_payment_required'
  status: 'complete' | 'expired' | 'open'
  customer_email: string | null
  customer_details?: {
    email: string | null
    name: string | null
  }
  amount_total: number | null
  currency: string | null
  metadata?: Record<string, string>
}

/**
 * Stripe webhook event structure
 */
export interface StripeWebhookEvent {
  id: string
  object: 'event'
  type: StripeEventType
  data: {
    object: StripeCheckoutSession
  }
  created: number
}

