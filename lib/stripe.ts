import * as crypto from 'crypto'

/**
 * Verify Stripe webhook signature
 * Stripe uses a different signature format than Lemon Squeezy
 * Format: t=timestamp,v1=signature[,v1=signature2,...]
 */
export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    console.log('🔐 Verifying Stripe signature...')
    
    // Stripe signature format: t=timestamp,v1=signature
    const parts = signature.split(',')
    const timestampPart = parts.find(p => p.startsWith('t='))
    const signatureParts = parts.filter(p => p.startsWith('v1='))

    if (!timestampPart || signatureParts.length === 0) {
      console.error('❌ Invalid signature format - missing t= or v1=')
      return false
    }

    const timestamp = timestampPart.split('=')[1]
    
    // Check timestamp to prevent replay attacks (allow 5 minutes tolerance)
    const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)
    if (timestampAge > 300) {
      console.error('❌ Signature timestamp too old:', timestampAge, 'seconds')
      return false
    }

    // Create the signed payload
    const signedPayload = `${timestamp}.${payload}`

    // Compute the expected signature
    const hmac = crypto.createHmac('sha256', secret)
    const computedSignature = hmac.update(signedPayload).digest('hex')

    // Check if any of the signatures match (Stripe can send multiple)
    for (const sigPart of signatureParts) {
      const expectedSignature = sigPart.split('=')[1]
      
      // Ensure both signatures have the same length before comparison
      if (expectedSignature.length !== computedSignature.length) {
        continue
      }
      
      try {
        const isMatch = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'hex'),
          Buffer.from(computedSignature, 'hex')
        )
        if (isMatch) {
          console.log('✅ Signature verified successfully')
          return true
        }
      } catch (e) {
        // Continue checking other signatures
        continue
      }
    }

    console.error('❌ No matching signature found')
    console.error('Expected (first 16 chars):', computedSignature.substring(0, 16))
    return false
  } catch (error) {
    console.error('❌ Signature verification error:', error)
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

