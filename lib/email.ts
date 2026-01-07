// Email language type - supported languages for emails
export type EmailLanguage = 'PL' | 'EN' | 'DE' | 'IT' | 'FR' | 'ES'

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
  EN: {
    registration: {
      subject: 'Access to WorkBook Course - Create Account',
      greeting: 'Hello!',
      thanks: 'Thank you for purchasing the <strong>WorkBook</strong> course.',
      instruction: 'To access the platform, create an account by clicking the button below:',
      buttonText: 'Create Account',
      copyLink: 'Or copy this link to your browser:',
      validity: 'The link is valid for 7 days.',
      footer: 'Best regards,<br>The WorkBook Team',
    },
    reset: {
      subject: 'WorkBook - Password Reset',
      title: 'Password Reset',
      intro: 'We received a request to reset the password for your <strong>WorkBook</strong> account.',
      instruction: 'Click the button below to set a new password:',
      buttonText: 'Reset Password',
      copyLink: 'Or copy this link to your browser:',
      warning: '⚠️ Important:',
      warningText: 'This link expires in 1 hour. If you did not request a password reset, please ignore this message.',
      footer: 'Best regards,<br>The WorkBook Team',
    },
  },
  IT: {
    registration: {
      subject: 'Accesso al corso WorkBook - Crea account',
      greeting: 'Ciao!',
      thanks: 'Grazie per aver acquistato il corso <strong>WorkBook</strong>.',
      instruction: 'Per accedere alla piattaforma, crea un account cliccando il pulsante qui sotto:',
      buttonText: 'Crea account',
      copyLink: 'Oppure copia questo link nel tuo browser:',
      validity: 'Il link è valido per 7 giorni.',
      footer: 'Cordiali saluti,<br>Il Team WorkBook',
    },
    reset: {
      subject: 'WorkBook - Reimpostazione password',
      title: 'Reimpostazione password',
      intro: 'Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account <strong>WorkBook</strong>.',
      instruction: 'Clicca il pulsante qui sotto per impostare una nuova password:',
      buttonText: 'Reimposta password',
      copyLink: 'Oppure copia questo link nel tuo browser:',
      warning: '⚠️ Importante:',
      warningText: 'Questo link scade tra 1 ora. Se non hai richiesto la reimpostazione della password, ignora questo messaggio.',
      footer: 'Cordiali saluti,<br>Il Team WorkBook',
    },
  },
  FR: {
    registration: {
      subject: 'Accès au cours WorkBook - Créer un compte',
      greeting: 'Bonjour !',
      thanks: 'Merci d\'avoir acheté le cours <strong>WorkBook</strong>.',
      instruction: 'Pour accéder à la plateforme, créez un compte en cliquant sur le bouton ci-dessous :',
      buttonText: 'Créer un compte',
      copyLink: 'Ou copiez ce lien dans votre navigateur :',
      validity: 'Le lien est valable pendant 7 jours.',
      footer: 'Cordialement,<br>L\'équipe WorkBook',
    },
    reset: {
      subject: 'WorkBook - Réinitialisation du mot de passe',
      title: 'Réinitialisation du mot de passe',
      intro: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte <strong>WorkBook</strong>.',
      instruction: 'Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :',
      buttonText: 'Réinitialiser le mot de passe',
      copyLink: 'Ou copiez ce lien dans votre navigateur :',
      warning: '⚠️ Important :',
      warningText: 'Ce lien expire dans 1 heure. Si vous n\'avez pas demandé la réinitialisation du mot de passe, veuillez ignorer ce message.',
      footer: 'Cordialement,<br>L\'équipe WorkBook',
    },
  },
  ES: {
    registration: {
      subject: 'Acceso al curso WorkBook - Crear cuenta',
      greeting: '¡Hola!',
      thanks: 'Gracias por comprar el curso <strong>WorkBook</strong>.',
      instruction: 'Para acceder a la plataforma, crea una cuenta haciendo clic en el botón de abajo:',
      buttonText: 'Crear cuenta',
      copyLink: 'O copia este enlace en tu navegador:',
      validity: 'El enlace es válido durante 7 días.',
      footer: 'Saludos cordiales,<br>El equipo de WorkBook',
    },
    reset: {
      subject: 'WorkBook - Restablecimiento de contraseña',
      title: 'Restablecimiento de contraseña',
      intro: 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de <strong>WorkBook</strong>.',
      instruction: 'Haz clic en el botón de abajo para establecer una nueva contraseña:',
      buttonText: 'Restablecer contraseña',
      copyLink: 'O copia este enlace en tu navegador:',
      warning: '⚠️ Importante:',
      warningText: 'Este enlace expira en 1 hora. Si no solicitaste el restablecimiento de la contraseña, ignora este mensaje.',
      footer: 'Saludos cordiales,<br>El equipo de WorkBook',
    },
  },
}

/**
 * Send registration email with token link
 */
export async function sendRegistrationEmail(
  email: string,
  registrationUrl: string,
  language: EmailLanguage = 'EN'
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
  language: EmailLanguage = 'EN'
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
