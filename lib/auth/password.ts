import { randomBytes } from "node:crypto"

export function generateTemporaryPassword() {
  return `${randomBytes(9).toString("base64url")}Aa1`
}
