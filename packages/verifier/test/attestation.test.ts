import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { fetchAttestation, verifyChatSignature } from "../src/attestation"
import { sha256Hex } from "../src/proof"

const fetchMock = vi.fn<typeof fetch>()
const signer = privateKeyToAccount(generatePrivateKey())
const other = privateKeyToAccount(generatePrivateKey())
const REQUEST = '{"model":"m"}'
const RESPONSE = '{"id":"chatcmpl-1"}'
const TEXT = `${sha256Hex(REQUEST)}:${sha256Hex(RESPONSE)}`

async function verifyWith(text: string, account = signer) {
  const signature = await account.signMessage({ message: text })
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify({ text, signature, signing_address: account.address, signing_algo: "ecdsa" }))
  )
  return verifyChatSignature({
    chatId: "chatcmpl-1",
    model: "m",
    apiKey: "k",
    expectedAddress: signer.address.toLowerCase(),
    requestBody: REQUEST,
    responseBody: RESPONSE,
    fetch: fetchMock,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("fetchAttestation", () => {
  test("returns the signing key when the nonce is echoed", async () => {
    fetchMock.mockImplementationOnce(async (url) => {
      const nonce = new URL(String(url)).searchParams.get("nonce")
      const entry = { model_name: "m", signing_address: signer.address, signing_algo: "ecdsa", request_nonce: nonce }
      return new Response(JSON.stringify({ model_attestations: [entry] }))
    })

    const result = await fetchAttestation({ model: "m", apiKey: "k", fetch: fetchMock })

    expect(result.error).toBeNull()
    expect(result.data?.signing_address).toBe(signer.address)
    expect(result.data?.nonce).toMatch(/^[0-9a-f]{64}$/)
    expect(result.data?.report_sha256).toMatch(/^[0-9a-f]{64}$/)
  })

  test("rejects a report that does not echo our nonce", async () => {
    const entry = { model_name: "m", signing_address: signer.address, signing_algo: "ecdsa", request_nonce: "0".repeat(64) }
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ model_attestations: [entry] })))

    const result = await fetchAttestation({ model: "m", apiKey: "k", fetch: fetchMock })

    expect(result).toEqual({ data: null, error: "attestation_nonce_mismatch" })
  })
})

describe("verifyChatSignature", () => {
  test("matches when the attested key signed our request and response hashes", async () => {
    const result = await verifyWith(TEXT)
    expect(result.error).toBeNull()
    expect(result.data?.matches).toBe(true)
  })

  test("matches the live format where the model name prefixes the hashes", async () => {
    const result = await verifyWith(`Qwen/Qwen3-VL-30B-A3B-Instruct:${TEXT}`)
    expect(result.data?.matches).toBe(true)
  })

  test("does not match when a different key signed", async () => {
    const result = await verifyWith(TEXT, other)
    expect(result.data?.matches).toBe(false)
  })

  test("does not match when the signed hashes are for a different response", async () => {
    const result = await verifyWith(`${sha256Hex(REQUEST)}:${sha256Hex("other")}`)
    expect(result.data?.matches).toBe(false)
  })

  test("returns an error when the endpoint fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response("no", { status: 404 }))
    const result = await verifyChatSignature({
      chatId: "c", model: "m", apiKey: "k", expectedAddress: signer.address,
      requestBody: REQUEST, responseBody: RESPONSE, fetch: fetchMock,
    })
    expect(result).toEqual({ data: null, error: "signature_request_failed" })
  })
})
