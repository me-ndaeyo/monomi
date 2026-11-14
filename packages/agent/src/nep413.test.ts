import { KeyPair, KeyPairSigner } from "near-api-js"
import { describe, expect, it } from "vitest"

import { buildNep413Payload, nep413Header, signNep413 } from "./nep413.js"

const NONCE = new Uint8Array(32).fill(7)

describe("buildNep413Payload", () => {
  it("lays out tag, message, nonce, recipient and an empty callback", () => {
    const bytes = buildNep413Payload({
      message: "hi",
      nonce: NONCE,
      recipient: "monomi",
    })
    const expected = Buffer.concat([
      Buffer.from([0x9d, 0x01, 0x00, 0x80]),
      Buffer.from([2, 0, 0, 0]),
      Buffer.from("hi"),
      Buffer.from(NONCE),
      Buffer.from([6, 0, 0, 0]),
      Buffer.from("monomi"),
      Buffer.from([0]),
    ])
    expect(Buffer.from(bytes).equals(expected)).toBe(true)
  })

  it("rejects a nonce that is not 32 bytes", () => {
    const payload = { message: "x", nonce: new Uint8Array(8), recipient: "m" }
    expect(() => buildNep413Payload(payload)).toThrow("32 bytes")
  })
})

describe("signNep413", () => {
  it("produces the same signature as near-api-js signNep413Message", async () => {
    const keyPair = KeyPair.fromRandom("ed25519")
    const message = "monomi:report:3:server-nonce"
    const ours = signNep413(keyPair, "agent.testnet", message, NONCE)
    const theirs = await new KeyPairSigner(keyPair).signNep413Message(
      "agent.testnet",
      { message, recipient: "monomi", nonce: NONCE }
    )
    expect(ours.signature).toBe(
      Buffer.from(theirs.signature).toString("base64")
    )
    expect(ours.publicKey).toBe(theirs.publicKey.toString())
  })

  it("encodes the auth JSON as a base64 NEP413 header", () => {
    const keyPair = KeyPair.fromRandom("ed25519")
    const auth = signNep413(keyPair, "agent.testnet", "m", NONCE)
    const header = nep413Header(auth)
    expect(header.startsWith("NEP413 ")).toBe(true)
    const decoded = Buffer.from(header.slice(7), "base64").toString("utf8")
    expect(JSON.parse(decoded)).toEqual(auth)
  })
})
