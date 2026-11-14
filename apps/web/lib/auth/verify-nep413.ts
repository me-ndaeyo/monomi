import "server-only"
import { JsonRpcProvider } from "near-api-js"
import { verifyMessage } from "near-api-js/nep413"
import { z } from "zod"

import { serverEnv } from "@/config/env/server"
import { sql } from "@/lib/db/sql"

export type AuthAction = "challenge" | "proof" | "verify" | "report" | "role"

const NONCE_TTL_MINUTES = 5

const AuthHeader = z.object({
  accountId: z.string().min(2).max(64),
  publicKey: z.string().startsWith("ed25519:"),
  signature: z.string().min(1),
  nonce: z.string().min(1),
  message: z.string().max(200),
})

/** Returns the signer's account id, or an error the route can show. */
export async function verifyAuth(
  request: Request,
  action: AuthAction,
  jobId: number
): Promise<{ data: string | null; error: string | null }> {
  const header = request.headers.get("authorization") ?? ""
  if (!header.startsWith("NEP413 ")) {
    return { data: null, error: "Sign in with your wallet first" }
  }
  const parsed = AuthHeader.safeParse(
    safeJson(Buffer.from(header.slice(7), "base64").toString("utf8"))
  )
  if (!parsed.success) return { data: null, error: "Bad sign-in data" }
  const auth = parsed.data
  const [prefix, signedAction, signedJob, serverNonce] = auth.message.split(":")
  if (
    prefix !== "monomi" ||
    signedAction !== action ||
    signedJob !== String(jobId) ||
    !serverNonce
  ) {
    return { data: null, error: "Signed message does not match this request" }
  }
  const used = await sql`
    update auth_nonces set used_at = now()
    where nonce = ${serverNonce} and used_at is null
      and created_at > now() - make_interval(mins => ${NONCE_TTL_MINUTES})
    returning nonce`
  if (used.length === 0) {
    return { data: null, error: "Sign-in expired. Try again." }
  }
  try {
    await verifyMessage({
      signerAccountId: auth.accountId,
      signerPublicKey: auth.publicKey,
      payload: {
        message: auth.message,
        recipient: "monomi",
        nonce: Buffer.from(auth.nonce, "base64"),
      },
      signature: Buffer.from(auth.signature, "base64"),
      provider: new JsonRpcProvider({ url: serverEnv.NEAR_RPC_URL }),
    })
  } catch {
    return { data: null, error: "Wallet signature could not be verified" }
  }
  return { data: auth.accountId, error: null }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
