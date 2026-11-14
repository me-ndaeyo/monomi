import { randomBytes } from "node:crypto"
import { isHex, recoverMessageAddress } from "viem"
import { z } from "zod"

import { getText, parseJson } from "./nearai-http"
import type { EndpointConfig, Result } from "./nearai-http"
import { sha256Hex } from "./proof"

export interface Attestation {
  signing_address: string
  signing_algo: "ecdsa" | "ed25519"
  report_sha256: string
  nonce: string
}

export interface VerifyChatSignatureInput extends EndpointConfig {
  chatId: string
  expectedAddress: string
  requestBody: string
  responseBody: string
}

export interface ChatSignature {
  signature: string
  text: string
  matches: boolean
}

const AttestationResponse = z.object({
  model_attestations: z.array(
    z.object({
      model_name: z.string(),
      signing_address: z.string().min(1),
      signing_algo: z.enum(["ecdsa", "ed25519"]),
      request_nonce: z.string(),
    })
  ),
})

const SignatureResponse = z.object({
  text: z.string(),
  signature: z.string(),
})

export async function fetchAttestation(
  config: EndpointConfig
): Promise<Result<Attestation>> {
  const nonce = randomBytes(32).toString("hex")
  const query = `model=${encodeURIComponent(config.model)}&nonce=${nonce}`
  const body = await getText(config, `/attestation/report?${query}`)
  if (body === null) return { data: null, error: "attestation_request_failed" }

  const report = parseJson(AttestationResponse, body)
  const entry = report?.model_attestations.find(
    (item) => item.model_name === config.model
  )
  if (!entry) return { data: null, error: "attestation_invalid" }
  if (entry.request_nonce.toLowerCase() !== nonce) {
    return { data: null, error: "attestation_nonce_mismatch" }
  }
  return {
    data: {
      signing_address: entry.signing_address,
      signing_algo: entry.signing_algo,
      report_sha256: sha256Hex(body),
      nonce,
    },
    error: null,
  }
}

async function recoverSigner(text: string, signature: `0x${string}`) {
  try {
    return await recoverMessageAddress({ message: text, signature })
  } catch {
    return null
  }
}

export async function verifyChatSignature(
  input: VerifyChatSignatureInput
): Promise<Result<ChatSignature>> {
  const query = `model=${encodeURIComponent(input.model)}&signing_algo=ecdsa`
  const path = `/signature/${encodeURIComponent(input.chatId)}?${query}`
  const body = await getText(input, path)
  if (body === null) return { data: null, error: "signature_request_failed" }

  const parsed = parseJson(SignatureResponse, body)
  if (!parsed || !isHex(parsed.signature)) {
    return { data: null, error: "signature_invalid" }
  }

  const expectedText = [input.requestBody, input.responseBody]
    .map((body) => sha256Hex(body))
    .join(":")
  // NEAR AI signs "<model>:<request sha256>:<response sha256>"; compare the hash pair.
  const signedHashes = parsed.text.split(":").slice(-2).join(":").toLowerCase()
  const signer = await recoverSigner(parsed.text, parsed.signature)
  const matches =
    signedHashes === expectedText &&
    signer !== null &&
    signer.toLowerCase() === input.expectedAddress.toLowerCase()

  return {
    data: { signature: parsed.signature, text: parsed.text, matches },
    error: null,
  }
}
