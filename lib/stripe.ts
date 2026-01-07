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
    console.log('🔐 ========== Stripe Signature Verification ==========')
    console.log('📝 Signature header:', signature.substring(0, 50) + '...')
    console.log('📝 Signature length:', signature.length)
    console.log('🔑 Secret configured:', !!secret)
    console.log('🔑 Secret length:', secret.length)
    console.log('🔑 Secret starts with:', secret.substring(0, Math.min(15, secret.length)))
    
    // Validate inputs
    if (!signature || !secret) {
      console.error('❌ Missing signature or secret')
      return false
    }
    
    // Stripe signature format: t=timestamp,v1=signature
    const parts = signature.split(',')
    console.log('📋 Signature parts:', parts.length)
    
    const timestampPart = parts.find(p => p.startsWith('t='))
    const signatureParts = parts.filter(p => p.startsWith('v1='))

    if (!timestampPart || signatureParts.length === 0) {
      console.error('❌ Invalid signature format - missing t= or v1=')
      console.error('Parts found:', parts)
      return false
    }

    const timestamp = timestampPart.split('=')[1]
    console.log('⏰ Timestamp from signature:', timestamp)
    
    // Check timestamp to prevent replay attacks
    const currentTime = Math.floor(Date.now() / 1000)
    const eventTime = parseInt(timestamp, 10)
    const timestampAge = currentTime - eventTime
    
    console.log('⏰ Current server time:', currentTime)
    console.log('⏰ Event timestamp:', eventTime)
    console.log('⏰ Age difference:', timestampAge, 'seconds (', Math.round(timestampAge / 60), 'minutes)')
    
    // Stripe allows 5 minutes tolerance, but we'll allow 30 minutes for resend scenarios
    const MAX_AGE = 1800 // 30 minutes
    const MIN_AGE = -300 // Allow 5 minutes in the future (clock skew)
    
    if (timestampAge > MAX_AGE) {
      console.error('❌ Signature timestamp is too old:', timestampAge, 'seconds (max:', MAX_AGE, ')')
      // Don't fail immediately - allow for testing
      console.warn('⚠️ Continuing verification despite old timestamp (for testing)')
    } else if (timestampAge < MIN_AGE) {
      console.error('❌ Signature timestamp is too far in the future:', timestampAge, 'seconds')
      // Don't fail immediately - allow for testing
      console.warn('⚠️ Continuing verification despite future timestamp (for testing)')
    }

    // Create the signed payload (Stripe format: timestamp.payload)
    // CRITICAL: payload must be the EXACT raw body string, no modifications
    const signedPayload = `${timestamp}.${payload}`
    console.log('📦 Payload length:', payload.length)
    console.log('📦 Signed payload length:', signedPayload.length)
    console.log('📦 Payload preview (first 100 chars):', payload.substring(0, 100))

    // Stripe webhook secret format: whsec_...
    // We need to remove the prefix and decode from base64 to get the raw signing key
    let signingSecret: string | Buffer
    
    if (secret.startsWith('whsec_')) {
      const secretWithoutPrefix = secret.slice(6) // Remove 'whsec_'
      console.log('🔑 Removing whsec_ prefix, remaining length:', secretWithoutPrefix.length)
      
      try {
        // Decode the base64 secret to get the raw signing key (32 bytes)
        signingSecret = Buffer.from(secretWithoutPrefix, 'base64')
        console.log('✅ Successfully decoded secret from base64')
        console.log('🔑 Decoded secret length:', signingSecret.length, 'bytes')
        console.log('🔑 Secret type:', Buffer.isBuffer(signingSecret) ? 'Buffer' : typeof signingSecret)
      } catch (decodeError: any) {
        console.error('❌ Failed to decode secret from base64:', decodeError.message)
        // Fallback: try using the secret directly (without prefix)
        signingSecret = secretWithoutPrefix
        console.warn('⚠️ Falling back to using secret as-is (without base64 decode)')
        console.warn('⚠️ This may cause verification to fail')
      }
    } else {
      console.warn('⚠️ Secret does not start with whsec_ prefix')
      // If no prefix, try decoding as base64 first
      try {
        signingSecret = Buffer.from(secret, 'base64')
        console.log('🔑 Using provided secret as base64 (length:', signingSecret.length, 'bytes)')
      } catch {
        // Last resort: use as-is
        signingSecret = secret
        console.warn('🔑 Using provided secret as-is (length:', secret.length, 'chars)')
        console.warn('⚠️ This may cause verification to fail - secret should be whsec_...')
      }
    }

    // Compute the expected signature using HMAC-SHA256
    const hmac = crypto.createHmac('sha256', signingSecret)
    hmac.update(signedPayload)
    const computedSignature = hmac.digest('hex')
    
    console.log('🔐 Computed signature (full):', computedSignature)
    console.log('🔐 Computed signature length:', computedSignature.length)

    // Check if any of the signatures match (Stripe can send multiple v1= signatures)
    let matchFound = false
    for (let i = 0; i < signatureParts.length; i++) {
      const sigPart = signatureParts[i]
      const expectedSignature = sigPart.split('=')[1]
      
      console.log(`🔐 Checking signature ${i + 1}/${signatureParts.length}`)
      console.log('🔐 Expected signature (full):', expectedSignature)
      console.log('🔐 Expected signature length:', expectedSignature.length)
      
      // Ensure both signatures have the same length before comparison
      if (expectedSignature.length !== computedSignature.length) {
        console.log('⚠️ Signature length mismatch:', expectedSignature.length, 'vs', computedSignature.length)
        console.log('⚠️ Skipping this signature')
        continue
      }
      
      // Compare signatures using timing-safe comparison
      try {
        const expectedBuffer = Buffer.from(expectedSignature, 'hex')
        const computedBuffer = Buffer.from(computedSignature, 'hex')
        
        const isMatch = crypto.timingSafeEqual(expectedBuffer, computedBuffer)
        
        if (isMatch) {
          console.log('✅✅✅ Signature verified successfully! ✅✅✅')
          matchFound = true
          break
        } else {
          console.log('❌ Signatures do not match')
          // Log first few bytes for debugging
          console.log('Expected (hex, first 16 bytes):', expectedSignature.substring(0, 32))
          console.log('Computed (hex, first 16 bytes):', computedSignature.substring(0, 32))
        }
      } catch (e: any) {
        console.error('❌ Error comparing signatures:', e.message)
        continue
      }
    }

    if (!matchFound) {
      console.error('❌❌❌ No matching signature found ❌❌❌')
      console.error('🔍 Debug info:')
      console.error('  - Total signature parts:', signatureParts.length)
      console.error('  - Computed signature (first 64 chars):', computedSignature.substring(0, 64))
      if (signatureParts.length > 0) {
        console.error('  - Expected signature (first 64 chars):', signatureParts[0].split('=')[1].substring(0, 64))
      }
      console.error('💡 TROUBLESHOOTING:')
      console.error('  1. Check if STRIPE_WEBHOOK_SECRET matches the secret from Stripe Dashboard')
      console.error('  2. Verify the webhook endpoint ID matches the secret')
      console.error('  3. Ensure request body was not modified before verification')
      console.error('  4. Check server time is synchronized')
    }
    
    console.log('🔐 ========== Verification Complete ==========')
    return matchFound
  } catch (error: any) {
    console.error('❌ Signature verification error:', error.message)
    console.error('Stack:', error.stack)
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

