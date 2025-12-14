import Pusher from 'pusher'

// Pusher server-side client
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// Funkcja do powiadomienia o przesłaniu zdjęcia
export async function notifyPhotoUploaded(uploadId: string, pageNumber: number, imageUrl: string) {
  try {
    await pusherServer.trigger(`upload-${uploadId}`, 'photo-uploaded', {
      pageNumber,
      imageUrl,
    })
  } catch (error) {
    console.error('Pusher error:', error)
  }
}
