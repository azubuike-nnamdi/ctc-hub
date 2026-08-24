import { readFile } from "node:fs/promises"
import { join } from "node:path"

import QRCode from "qrcode"
import sharp from "sharp"

const QR_SIZE = 1024
const LOGO_RATIO = 0.2
const PLATE_RATIO = 1.18

export async function loadDefaultWatermark() {
  return readFile(join(process.cwd(), "public/img/ctc-logo.png"))
}

export async function generateFirstTimerQrPng({
  targetUrl,
  watermarkPng,
}: {
  targetUrl: string
  watermarkPng: Buffer
}) {
  const qrPng = await QRCode.toBuffer(targetUrl, {
    type: "png",
    width: QR_SIZE,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
  })

  const logoSize = Math.round(QR_SIZE * LOGO_RATIO)
  const plateSize = Math.round(logoSize * PLATE_RATIO)
  const inset = Math.round((plateSize - logoSize) / 2)

  const logo = await sharp(watermarkPng)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer()

  const plate = await sharp({
    create: {
      width: plateSize,
      height: plateSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logo, left: inset, top: inset }])
    .png()
    .toBuffer()

  const imagePng = await sharp(qrPng)
    .composite([{ input: plate, gravity: "centre" }])
    .png()
    .toBuffer()

  return { imagePng, watermarkPng: logo }
}
