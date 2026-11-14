import { createHash, randomBytes } from "node:crypto"

import type { KeyPair } from "near-api-js"

// NEP-413 tag: 2^31 + 413, marks the bytes as an off-chain message.
export const NEP413_TAG = 2147484061
export const NEP413_RECIPIENT = "monomi"

export interface Nep413Payload {
  message: string
  nonce: Uint8Array
  recipient: string
}

export interface Nep413Auth {
  accountId: string
  publicKey: string
  signature: string
  nonce: string
  message: string
}

function u32(value: number): Uint8Array {
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value, true)
  return bytes
}

function borshString(value: string): Uint8Array {
  const utf8 = new TextEncoder().encode(value)
  return Buffer.concat([u32(utf8.length), utf8])
}

export function buildNep413Payload(payload: Nep413Payload): Uint8Array {
  if (payload.nonce.length !== 32) throw new Error("Nonce must be 32 bytes")
  return Buffer.concat([
    u32(NEP413_TAG),
    borshString(payload.message),
    payload.nonce,
    borshString(payload.recipient),
    Uint8Array.of(0),
  ])
}

export function signNep413(
  keyPair: KeyPair,
  accountId: string,
  message: string,
  nonce: Uint8Array = randomBytes(32)
): Nep413Auth {
  const payload = { message, nonce, recipient: NEP413_RECIPIENT }
  const hash = createHash("sha256").update(buildNep413Payload(payload)).digest()
  const { signature, publicKey } = keyPair.sign(hash)
  return {
    accountId,
    publicKey: publicKey.toString(),
    signature: Buffer.from(signature).toString("base64"),
    nonce: Buffer.from(nonce).toString("base64"),
    message,
  }
}

export function nep413Header(auth: Nep413Auth): string {
  const json = JSON.stringify(auth)
  return `NEP413 ${Buffer.from(json).toString("base64")}`
}
