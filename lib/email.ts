/**
 * Send registration email with token link
 * In production, integrate with email service like SendGrid, Resend, etc.
 */
export async function sendRegistrationEmail(
  email: string,
  registrationUrl: string
): Promise<void> {
  // TODO: Integrate with actual email service
  console.log('Sending registration email to:', email)
  console.log('Registration URL:', registrationUrl)
  
  // Example email content:
  const subject = 'Dostęp do kursu WorkBook - Załóż konto'
  const body = `
    Witaj!
    
    Dziękujemy za zakup kursu WorkBook. Aby uzyskać dostęp do platformy, 
    załóż konto używając poniższego linku:
    
    ${registrationUrl}
    
    Link jest ważny przez 7 dni.
    
    Pozdrawiamy,
    Zespół WorkBook
  `
  
  // In production, use actual email service:
  // await emailService.send({
  //   to: email,
  //   subject,
  //   html: body,
  // })
}

