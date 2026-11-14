import type { WalletState } from "@/lib/wallet/wallet-provider"
import { authHeader } from "@/lib/wallet/auth-header"

interface Envelope<T> {
  data: T | null
  error: string | null
}

export interface VerifyResult {
  status: string
  reasons: string[]
}

async function call<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const body = (await res.json().catch(() => ({ data: null, error: "The server did not answer. Try again." }))) as Envelope<T>
  if (body.data === null) throw new Error(body.error ?? "Something went wrong")
  return body.data
}

export async function requestCode(wallet: WalletState, jobId: number) {
  const authorization = await authHeader(wallet, "challenge", jobId)
  return call<{ code: string; expires_at: string }>(`/api/jobs/${jobId}/challenge`, { method: "POST", headers: { authorization } })
}

export async function uploadProof(wallet: WalletState, jobId: number, photos: Blob[], pos: GeolocationPosition) {
  const form = new FormData()
  photos.forEach((p, i) => form.append("photos", new File([p], `photo-${i}.jpg`, { type: "image/jpeg" })))
  form.append("lat", String(pos.coords.latitude))
  form.append("lng", String(pos.coords.longitude))
  form.append("accuracy_m", String(pos.coords.accuracy))
  const authorization = await authHeader(wallet, "proof", jobId)
  return call<{ proof_hash: string }>(`/api/jobs/${jobId}/proof`, { method: "POST", headers: { authorization }, body: form })
}

export async function runVerify(wallet: WalletState, jobId: number) {
  const authorization = await authHeader(wallet, "verify", jobId)
  return call<VerifyResult>(`/api/jobs/${jobId}/verify`, { method: "POST", headers: { authorization } })
}

export async function latestVerification(jobId: number) {
  return call<VerifyResult | null>(`/api/jobs/${jobId}/verify`, { method: "GET" }).catch(() => null)
}
