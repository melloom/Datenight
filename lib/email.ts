import nodemailer from 'nodemailer'

interface BillingEmailOptions {
  to: string
  subject: string
  text: string
}

let transporter: nodemailer.Transporter | null = null

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

function isTruthy(value?: string): boolean {
  return value === '1' || value === 'true' || value === 'yes'
}

function getSmtpTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter
  }

  const host = getEnv('SMTP_HOST')
  const port = Number(process.env.SMTP_PORT || '465')
  const secure = isTruthy(process.env.SMTP_SECURE) || port === 465
  const user = getEnv('SMTP_USER')
  const pass = getEnv('SMTP_PASS')

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })

  return transporter
}

export function isBillingEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

export async function sendBillingEmail(options: BillingEmailOptions): Promise<void> {
  if (!isBillingEmailConfigured()) {
    return
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'contact@mellowsites.com'
  await getSmtpTransporter().sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
  })
}

export async function sendBillingTeamEmail(subject: string, text: string): Promise<void> {
  if (!isBillingEmailConfigured()) {
    return
  }

  const teamEmail = process.env.BILLING_ALERT_EMAIL || process.env.SMTP_USER
  if (!teamEmail) {
    return
  }

  await sendBillingEmail({
    to: teamEmail,
    subject,
    text,
  })
}