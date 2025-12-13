import * as crypto from 'crypto'

/**
 * Verify Lemon Squeezy webhook signature
 */
export function verifyLemonSqueezySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  )
}

/**
 * Generate a secure registration token
 */
export function generateRegistrationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

