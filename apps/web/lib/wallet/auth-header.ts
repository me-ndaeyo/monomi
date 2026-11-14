import type { WalletState } from "./wallet-provider"

type Action = "challenge" | "proof" | "verify" | "report" | "role"

/** Gets a server nonce and signs `monomi:<action>:<job>:<nonce>` (NEP-413). */
export async function authHeader(wallet: WalletState, action: Action, jobId: number) {
  if (!wallet.accountId) throw new Error("Connect your wallet first")
  const res = await fetch("/api/auth/nonce", { method: "POST" })
  const body = (await res.json()) as { data: { nonce: string } | null; error: string | null }
  if (!body.data) throw new Error(body.error ?? "Could not start sign-in")
  const message = `monomi:${action}:${jobId}:${body.data.nonce}`
  const nonce = crypto.getRandomValues(new Uint8Array(32))
  const signed = await wallet.signMessage(message, nonce)
  const payload = {
    accountId: wallet.accountId,
    publicKey: signed.publicKey,
    signature: signed.signature,
    nonce: btoa(String.fromCharCode(...nonce)),
    message,
  }
  return `NEP413 ${btoa(JSON.stringify(payload))}`
}
