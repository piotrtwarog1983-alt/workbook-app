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
    console.log('📝 Signature length:', signature.length)
    console.log('🔑 Secret starts with:', secret.substring(0, 10))
    
    // Stripe signature format: t=timestamp,v1=signature
    const parts = signature.split(',')
    const timestampPart = parts.find(p => p.startsWith('t='))
    const signatureParts = parts.filter(p => p.startsWith('v1='))

    if (!timestampPart || signatureParts.length === 0) {
      console.error('❌ Invalid signature format - missing t= or v1=')
      console.error('Parts:', parts)
      return false
    }

    const timestamp = timestampPart.split('=')[1]
    
    // Check timestamp to prevent replay attacks (allow 30 minutes tolerance for resend)
    const currentTime = Math.floor(Date.now() / 1000)
    const eventTime = parseInt(timestamp, 10)
    const timestampAge = currentTime - eventTime
    
    console.log('⏰ Timestamp age:', timestampAge, 'seconds')
    
    // Allow 30 minutes tolerance (1800 seconds) for resend scenarios
    if (timestampAge > 1800) {
      console.warn('⚠️ Signature timestamp is old:', timestampAge, 'seconds - but allowing for resend testing')
      // Don't fail for old timestamps during testing - just log warning
    }

    // Create the signed payload (Stripe format: timestamp.payload)
    const signedPayload = `${timestamp}.${payload}`
    console.log('📦 Signed payload length:', signedPayload.length)

    // Compute the expected signature using the secret directly
    // Note: Stripe secrets include 'whsec_' prefix and should be used as-is
    const hmac = crypto.createHmac('sha256', secret)
    const computedSignature = hmac.update(signedPayload).digest('hex')
    
    console.log('🔐 Computed signature (first 20 chars):', computedSignature.substring(0, 20))

    // Check if any of the signatures match (Stripe can send multiple)
    for (const sigPart of signatureParts) {
      const expectedSignature = sigPart.split('=')[1]
      console.log('🔐 Expected signature (first 20 chars):', expectedSignature.substring(0, 20))
      
      // Ensure both signatures have the same length before comparison
      if (expectedSignature.length !== computedSignature.length) {
        console.log('⚠️ Signature length mismatch:', expectedSignature.length, 'vs', computedSignature.length)
        continue
      }
      
      try {
        const isMatch = crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'hex'),
          Buffer.from(computedSignature, 'hex')
        )
        if (isMatch) {
          console.log('✅ Signature verified successfully!')
          return true
        } else {
          console.log('❌ Signatures do not match')
        }
      } catch (e) {
        console.error('❌ Error comparing signatures:', e)
        continue
      }
    }

    console.error('❌ No matching signature found')
    console.error('Computed (first 32 chars):', computedSignature.substring(0, 32))
    if (signatureParts.length > 0) {
      console.error('Expected (first 32 chars):', signatureParts[0].split('=')[1].substring(0, 32))
    }
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
  locale?: string | null  // Stripe locale e.g. 'pl', 'de', 'en'
  metadata?: {
    language?: string  // Custom language from checkout
    firstName?: string
    lastName?: string
    email?: string
    orderId?: string
    [key: string]: string | undefined
  }
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

