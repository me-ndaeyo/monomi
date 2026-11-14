"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { JOBS_QUERY_KEY } from "@/hooks/use-chain"
import { useWallet } from "@/hooks/use-wallet"
import { formatUsdc, usdToBaseUnits } from "@/lib/format/usdc"
import { ESCROW, USDC } from "@/lib/near/contract"
import { PostCheckSchema, type PostCheckInput } from "../_schemas/post-check"
import Field, { INPUT } from "./field"

const DEFAULTS: PostCheckInput = { title: "", lat: "", lng: "", radius_m: 100, instructions: "", expected_text: "", duration_mins: 180, pay: "5" }

export default function PostCheckForm() {
  const wallet = useWallet()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [values, setValues] = useState<PostCheckInput>(DEFAULTS)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const set = (key: keyof PostCheckInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const useMyLocation = () =>
    navigator.geolocation.getCurrentPosition(({ coords }) => setValues((v) => ({ ...v, lat: coords.latitude.toFixed(6), lng: coords.longitude.toFixed(6) })), () => setErrors((e) => ({ ...e, lat: "Location is blocked. Type the coordinates instead." })))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!wallet.accountId) return wallet.connect()
    const parsed = PostCheckSchema.safeParse(values)
    if (!parsed.success) return setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])))
    setErrors({})
    setSubmitError(null)
    setIsSubmitting(true)
    const v = parsed.data
    const spec = { title: v.title, instructions: v.instructions, lat_e6: Math.round(v.lat * 1e6), lng_e6: Math.round(v.lng * 1e6), radius_m: v.radius_m, expected_text: v.expected_text || null, duration_mins: v.duration_mins, min_reputation: 0 }
    try {
      await wallet.call({ receiverId: USDC, method: "ft_transfer_call", args: { receiver_id: ESCROW, amount: usdToBaseUnits(v.pay), msg: JSON.stringify({ post_job: spec }) }, deposit: 1n })
      await queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY })
      router.push("/agent")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Posting failed. Check your test USDC balance.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const pay = Number(values.pay)
  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-5">
        <Field label="What is the place called?" error={errors.title}><input className={INPUT} value={String(values.title)} onChange={set("title")} placeholder="Adeyemi Foods warehouse" /></Field>
        <Field label="Where is it?" hint="Latitude and longitude of the spot" error={errors.lat ?? errors.lng}>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input className={INPUT} value={String(values.lat)} onChange={set("lat")} placeholder="8.1335" inputMode="decimal" aria-label="Latitude" />
            <input className={INPUT} value={String(values.lng)} onChange={set("lng")} placeholder="4.2405" inputMode="decimal" aria-label="Longitude" />
            <button type="button" onClick={useMyLocation} className="rounded-xl border border-card-line bg-white px-3 text-[13px]">Use my location</button>
          </div>
        </Field>
        <Field label="Must be within">
          <select className={INPUT} value={String(values.radius_m)} onChange={set("radius_m")}><option value="50">50 m</option><option value="100">100 m</option><option value="250">250 m</option></select>
        </Field>
        <Field label="What should they photograph?" hint="Be specific. Things they can see from outside work best." error={errors.instructions}><textarea className={`${INPUT} h-28 py-2`} value={String(values.instructions)} onChange={set("instructions")} /></Field>
        <Field label="What should the sign say? (optional)" error={errors.expected_text}><input className={INPUT} value={String(values.expected_text)} onChange={set("expected_text")} placeholder="ADEYEMI FOODS" /></Field>
        <Field label="How long can it wait?">
          <select className={INPUT} value={String(values.duration_mins)} onChange={set("duration_mins")}><option value="60">1 hour</option><option value="180">3 hours</option><option value="1440">1 day</option></select>
        </Field>
        <Field label="What will you pay? (USDC)" hint="Between 0.50 and 25.00. Higher pay gets taken faster." error={errors.pay}><input className={INPUT} value={String(values.pay)} onChange={set("pay")} inputMode="decimal" /></Field>
        <p className="m-0 text-[13px] text-muted-light">Places only: shops, sites, public spaces. Checks about a private home or a specific person are taken down and refunded.</p>
      </div>
      <aside className="flex h-fit flex-col gap-3 rounded-[20px] bg-ink p-5 text-bone lg:sticky lg:top-6">
        <span className="font-mono text-[11px] tracking-[0.08em] text-muted">SUMMARY</span>
        <span className="text-[16px] font-semibold">{String(values.title) || "Your place"}</span>
        <span className="display text-[32px] text-kola">{Number.isFinite(pay) && pay > 0 ? formatUsdc(usdToBaseUnits(pay)) : "–"}</span>
        <p className="m-0 text-[13px] text-soft">It's held until the check is done. If nobody takes it in time, it comes straight back to you.</p>
        <button type="submit" disabled={isSubmitting} className="h-[52px] rounded-full bg-kola font-semibold text-ink disabled:opacity-60">{!wallet.accountId ? "Connect wallet" : isSubmitting ? "Confirm in your wallet…" : "Lock the pay and post"}</button>
        {submitError && <p role="alert" className="m-0 text-[13px] text-fail">{submitError}</p>}
      </aside>
    </form>
  )
}
