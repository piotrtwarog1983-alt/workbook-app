import { Language, translations } from './translations'

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
    return true // In development mode, return success
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

// Treści emaili w różnych językach
const emailContent = {
  PL: {
    registration: {
      subject: 'Dostęp do kursu WorkBook - Załóż konto',
      greeting: 'Witaj!',
      thanks: 'Dziękujemy za zakup kursu <strong>WorkBook</strong>.',
      instruction: 'Aby uzyskać dostęp do platformy, załóż konto klikając poniższy przycisk:',
      buttonText: 'Załóż konto',
      copyLink: 'Lub skopiuj ten link do przeglądarki:',
      validity: 'Link jest ważny przez 7 dni.',
      footer: 'Pozdrawiamy,<br>Zespół WorkBook',
    },
    reset: {
      subject: 'WorkBook - Resetowanie hasła',
      title: 'Resetowanie hasła',
      intro: 'Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w <strong>WorkBook</strong>.',
      instruction: 'Kliknij poniższy przycisk, aby ustawić nowe hasło:',
      buttonText: 'Zresetuj hasło',
      copyLink: 'Lub skopiuj ten link do przeglądarki:',
      warning: '⚠️ Ważne:',
      warningText: 'Ten link wygasa za 1 godzinę. Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.',
      footer: 'Pozdrawiamy,<br>Zespół WorkBook',
    },
  },
  DE: {
    registration: {
      subject: 'Zugang zum WorkBook-Kurs - Konto erstellen',
      greeting: 'Hallo!',
      thanks: 'Vielen Dank für Ihren Kauf des <strong>WorkBook</strong>-Kurses.',
      instruction: 'Um Zugang zur Plattform zu erhalten, erstellen Sie ein Konto, indem Sie auf die Schaltfläche unten klicken:',
      buttonText: 'Konto erstellen',
      copyLink: 'Oder kopieren Sie diesen Link in Ihren Browser:',
      validity: 'Der Link ist 7 Tage gültig.',
      footer: 'Mit freundlichen Grüßen,<br>Das WorkBook-Team',
    },
    reset: {
      subject: 'WorkBook - Passwort zurücksetzen',
      title: 'Passwort zurücksetzen',
      intro: 'Wir haben eine Anfrage erhalten, das Passwort für Ihr <strong>WorkBook</strong>-Konto zurückzusetzen.',
      instruction: 'Klicken Sie auf die Schaltfläche unten, um ein neues Passwort festzulegen:',
      buttonText: 'Passwort zurücksetzen',
      copyLink: 'Oder kopieren Sie diesen Link in Ihren Browser:',
      warning: '⚠️ Wichtig:',
      warningText: 'Dieser Link läuft in 1 Stunde ab. Wenn Sie kein Zurücksetzen des Passworts angefordert haben, ignorieren Sie diese Nachricht.',
      footer: 'Mit freundlichen Grüßen,<br>Das WorkBook-Team',
    },
  },
}

/**
 * Send registration email with token link
 */
export async function sendRegistrationEmail(
  email: string,
  registrationUrl: string,
  language: Language = 'PL'
): Promise<boolean> {
  const content = emailContent[language].registration
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">${content.greeting}</h1>
        <p>${content.thanks}</p>
        <p>${content.instruction}</p>
        <p style="margin: 20px 0;">
          <a href="${registrationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">${content.buttonText}</a>
        </p>
        <p>${content.copyLink}</p>
        <p style="word-break: break-all; font-size: 14px;">
          <a href="${registrationUrl}" style="color: #4f46e5;">${registrationUrl}</a>
        </p>
        <p><strong>${content.validity}</strong></p>
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
          <p>${content.footer}</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({ to: email, subject: content.subject, html })
}

/**
 * Send password reset email with token link
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  language: Language = 'PL'
): Promise<boolean> {
  const content = emailContent[language].reset
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">${content.title}</h1>
        <p>${content.intro}</p>
        <p>${content.instruction}</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">${content.buttonText}</a>
        </p>
        <p>${content.copyLink}</p>
        <p style="word-break: break-all; font-size: 14px;">
          <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
        </p>
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; margin: 20px 0;">
          <strong>${content.warning}</strong> ${content.warningText}
        </div>
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
          <p>${content.footer}</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({ to: email, subject: content.subject, html })
}
