import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

import { serverEnv } from "@/config/env/server"

const TTL_MS = 10 * 60_000

function sign(payload: string) {
  return createHmac("sha256", serverEnv.PHOTO_URL_SECRET).update(payload).digest("base64url")
}

/** A link to one photo that stops working after 10 minutes. */
export function photoUrl(sha256: string) {
  const payload = `${sha256}.${Date.now() + TTL_MS}`
  return `/api/photos/${payload}.${sign(payload)}`
}

export function readPhotoToken(token: string): string | null {
  const [sha256, expires, mac] = token.split(".")
  if (!sha256 || !expires || !mac) return null
  const expected = Buffer.from(sign(`${sha256}.${expires}`))
  const given = Buffer.from(mac)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  return Number(expires) > Date.now() ? sha256 : null
}
