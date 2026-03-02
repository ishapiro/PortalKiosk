const FROM_ADDRESS = 'The Brody Country Club <countryclub@cogitations.com>'

type CloudflareEnv = {
  RESEND_API_KEY?: string
}

async function sendEmail(env: CloudflareEnv | undefined, to: string, subject: string, html: string) {
  const apiKey = env?.RESEND_API_KEY
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.warn('[orders][email] RESEND_API_KEY missing; skipping email send', {
      to,
      subject,
    })
    return
  }
  if (!to) {
    // eslint-disable-next-line no-console
    console.warn('[orders][email] No recipient email; skipping email send', { subject })
    return
  }

  try {
    // eslint-disable-next-line no-console
    console.log('[orders][email] Sending email via Resend', {
      to,
      subject,
    })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      // eslint-disable-next-line no-console
      console.error('[orders][email] Resend API responded with error', {
        status: res.status,
        statusText: res.statusText,
        body: text,
      })
    } else {
      // eslint-disable-next-line no-console
      console.log('[orders][email] Email sent successfully')
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[orders][email] Failed to send email', err)
  }
}

export async function sendOrderPlacedEmail(env: CloudflareEnv | undefined, to: string, orderNumber: number, customerName: string) {
  const subject = 'Your order from the Brody Country Club'
  const safeName = customerName || 'Friend'
  const html = `<p>Thank you, ${safeName}, for your order at The Brody Country Club.</p><p>Your order number is <strong>#${orderNumber}</strong>.</p><p>We will email you again when your order is ready for pickup.</p>`

  await sendEmail(env, to, subject, html)
}

export async function sendOrderReadyEmail(env: CloudflareEnv | undefined, to: string, orderNumber: number | null, customerName: string) {
  const subject = 'Your order is ready for pickup at the Brody\'s house'
  const safeName = customerName || 'Friend'
  const numberText = orderNumber != null ? ` Your order number is <strong>#${orderNumber}</strong>.` : ''
  const html = `<p>Hi ${safeName},</p><p>Your order from The Brody Country Club is now <strong>ready for pickup at the Brody's house</strong>.</p><p>${numberText}</p>`

  await sendEmail(env, to, subject, html)
}

