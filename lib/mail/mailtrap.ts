const MAILTRAP_SEND_URL = "https://send.api.mailtrap.io/api/send"

function fromEmail() {
  return process.env.MAILTRAP_FROM_EMAIL
}

function isConfigured() {
  return Boolean(process.env.MAILTRAP_API_TOKEN && fromEmail())
}

export type MailAttachment = {
  content: string
  filename: string
  type: string
  disposition?: "inline" | "attachment"
  content_id?: string
}

export async function sendMail(options: {
  to: string
  subject: string
  text: string
  html: string
  attachments?: MailAttachment[]
}) {
  const sender = fromEmail()
  const token = process.env.MAILTRAP_API_TOKEN
  if (!isConfigured() || !sender || !token) {
    throw new Error(
      "Email is not configured. Set MAILTRAP_API_TOKEN and MAILTRAP_FROM_EMAIL."
    )
  }

  const response = await fetch(MAILTRAP_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "ctc-hub",
    },
    body: JSON.stringify({
      from: {
        email: sender,
        name: process.env.MAILTRAP_SENDER_NAME ?? "CTC Hub",
      },
      to: [{ email: options.to }],
      subject: options.subject,
      text: options.text,
      html: options.html,
      category: "staff-onboarding",
      ...(options.attachments?.length
        ? { attachments: options.attachments }
        : {}),
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean
    errors?: string[]
  }

  if (!response.ok || payload.success === false) {
    const detail =
      payload.errors?.join(" ") || `Mailtrap returned ${response.status}`
    throw new Error(detail)
  }
}
