/**
 * Email service for WorkBook platform
 * Uses Resend for sending emails (configure RESEND_API_KEY in environment)
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM || 'WorkBook <onboarding@resend.dev>'
  
  if (!apiKey) {
    console.log('⚠️ RESEND_API_KEY not set, logging email instead:')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('From:', emailFrom)
    console.log('Body (first 200 chars):', options.html.substring(0, 200))
    return true // W trybie deweloperskim zwracamy sukces
  }

  console.log('📧 Sending email via Resend...')
  console.log('From:', emailFrom)
  console.log('To:', options.to)
  console.log('Subject:', options.subject)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('❌ Resend API error:', responseData)
      return false
    }

    console.log('✅ Email sent successfully:', responseData)
    return true
  } catch (error) {
    console.error('❌ Email send error:', error)
    return false
  }
}

/**
 * Send registration email with token link
 */
export async function sendRegistrationEmail(
  email: string,
  registrationUrl: string
): Promise<boolean> {
  const subject = 'Dostęp do kursu WorkBook - Załóż konto'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; background: #4f46e5; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Witaj!</h1>
        <p>Dziękujemy za zakup kursu WorkBook. Aby uzyskać dostęp do platformy, załóż konto używając poniższego linku:</p>
        <a href="${registrationUrl}" class="button">Załóż konto</a>
        <p>Lub skopiuj ten link do przeglądarki:</p>
        <p><small>${registrationUrl}</small></p>
        <p><strong>Link jest ważny przez 7 dni.</strong></p>
        <div class="footer">
          <p>Pozdrawiamy,<br>Zespół WorkBook</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({ to: email, subject, html })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<boolean> {
  const subject = 'WorkBook - Resetowanie hasła'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; background: #4f46e5; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Resetowanie hasła</h1>
        <p>Otrzymaliśmy prośbę o resetowanie hasła do Twojego konta w WorkBook.</p>
        <p>Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>
        <a href="${resetUrl}" class="button">Ustaw nowe hasło</a>
        <p>Lub skopiuj ten link do przeglądarki:</p>
        <p><small>${resetUrl}</small></p>
        <div class="warning">
          <strong>⏰ Link wygasa za 1 godzinę.</strong>
        </div>
        <p>Jeśli nie prosiłeś o resetowanie hasła, zignoruj tę wiadomość. Twoje hasło pozostanie niezmienione.</p>
        <div class="footer">
          <p>Pozdrawiamy,<br>Zespół WorkBook</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({ to: email, subject, html })
}
