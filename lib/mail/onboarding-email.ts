import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { sendMail } from "@/lib/mail/mailtrap"

const LOGO_CID = "ctc-logo"
const LOGO_PATH = join(process.cwd(), "public/img/ctc-logo.png")

let logoBase64: string | undefined

async function logoAttachment() {
  logoBase64 ??= (await readFile(LOGO_PATH)).toString("base64")

  return {
    content: logoBase64,
    filename: "ctc-logo.png",
    type: "image/png",
    disposition: "inline" as const,
    content_id: LOGO_CID,
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export async function sendStaffOnboardingEmail(input: {
  to: string
  firstName: string
  roleLabel: string
  temporaryPassword: string
  loginUrl: string
}) {
  await sendWelcomeEmail({
    ...input,
    heading: "You have been added to CTC Hub",
    intro: `A super admin has onboarded you as <strong>${escapeHtml(input.roleLabel)}</strong>. Use the temporary password below, then reset it on first sign-in.`,
    textIntro: `You have been onboarded to CTC Hub as ${input.roleLabel}.`,
    subject: "You have been onboarded to CTC Hub",
  })
}

export async function sendMemberWelcomeEmail(input: {
  to: string
  firstName: string
  temporaryPassword: string
  loginUrl: string
}) {
  await sendWelcomeEmail({
    ...input,
    roleLabel: "Member",
    heading: "Welcome to CTC Hub",
    intro:
      "Your member account is ready. Use the temporary password below, then reset it on first sign-in.",
    textIntro: "Your CTC Hub member account is ready.",
    subject: "Welcome to CTC Hub",
  })
}

async function sendWelcomeEmail(input: {
  to: string
  firstName: string
  roleLabel: string
  temporaryPassword: string
  loginUrl: string
  heading: string
  intro: string
  textIntro: string
  subject: string
}) {
  const name = escapeHtml(input.firstName)
  const password = escapeHtml(input.temporaryPassword)
  const loginUrl = escapeHtml(input.loginUrl)

  const text = `Hello ${input.firstName},

${input.textIntro}

Sign in at ${input.loginUrl}
Temporary password: ${input.temporaryPassword}

You must change this password the first time you sign in.

Christ Treasure Centre`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CTC Hub invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5eef5;">
          <tr>
            <td align="center" style="padding:28px 32px 20px;background:#000000;">
              <img src="cid:${LOGO_CID}" alt="Christ Treasure Centre" width="140" height="140" style="display:block;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background:#1A90C6;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0;font-size:24px;line-height:1.3;">${escapeHtml(input.heading)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
              <p style="margin:0 0 16px;font-size:16px;">Hello ${name},</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:24px;">
                ${input.intro}
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#5b6b7a;">Temporary password</p>
              <p style="margin:0 0 24px;font-size:20px;font-weight:700;letter-spacing:0.04em;color:#1A90C6;">${password}</p>
              <a href="${loginUrl}" style="display:inline-block;background:#1A90C6;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;">Sign in to CTC Hub</a>
              <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:#5b6b7a;">
                If the button does not work, copy this link:<br />
                <a href="${loginUrl}" style="color:#1A90C6;">${loginUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  await sendMail({
    to: input.to,
    subject: input.subject,
    text,
    html,
    attachments: [await logoAttachment()],
  })
}
