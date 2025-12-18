import Pusher from 'pusher'

// Singleton pattern for Pusher server instance
let pusherInstance: Pusher | null = null

export function getPusherServer(): Pusher | null {
  // Check if all required env vars are present
  if (!process.env.PUSHER_APP_ID || 
      !process.env.PUSHER_KEY || 
      !process.env.PUSHER_SECRET || 
      !process.env.PUSHER_CLUSTER) {
    console.log('Pusher not configured - missing environment variables')
    return null
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true
    })
  }

  return pusherInstance
}

// Helper function to safely trigger Pusher events
export async function triggerPusherEvent(
  channel: string, 
  event: string, 
  data: any
): Promise<boolean> {
  const pusher = getPusherServer()
  if (!pusher) {
    console.log('Pusher not available, skipping event:', event)
    return false
  }

  try {
    await pusher.trigger(channel, event, data)
    return true
  } catch (error) {
    console.error('Pusher trigger error:', error)
    return false
  }
}
