import { createHash, randomInt } from "node:crypto"

export interface ProofBundle {
  job_id: number
  worker: string
  code: string
  photo_sha256s: string[]
  lat: number
  lng: number
  accuracy_m: number
  server_ts: number
}

export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
export const CODE_LENGTH = 4

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const encoded = JSON.stringify(value)
    if (encoded === undefined) {
      throw new Error("canonicalJson: unsupported value")
    }
    return encoded
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item ?? null)).join(",")}]`
  }
  const entries = Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
  return `{${entries.join(",")}}`
}

export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex")
}

export function computeProofHash(bundle: ProofBundle): string {
  return sha256Hex(canonicalJson(bundle))
}

export function generateCode(): string {
  return Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)] ?? ""
  ).join("")
}
