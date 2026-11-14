"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { CloseIcon } from "@/components/ui/icons"
import { useCamera } from "../_hooks/use-camera"
import { gpsColor, useGps } from "../_hooks/use-gps"
import { captureFrame, currentPosition } from "../_lib/compress"
import CameraNotice from "./camera-notice"

interface CameraStepProps {
  jobId: number
  code: string
  expiresAt: number
  busy: boolean
  onSend: (photos: Blob[], position: GeolocationPosition) => void
}

const MAX_PHOTOS = 3

export default function CameraStep({ jobId, code, expiresAt, busy, onSend }: Readonly<CameraStepProps>) {
  const { videoRef, status } = useCamera()
  const gps = useGps()
  const [shots, setShots] = useState<{ blob: Blob; url: string }[]>([])
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [shotError, setShotError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000))
  const gpsOk = gps.status === "ok" && gps.accuracy <= 150
  const canSend = shots.length > 0 && gpsOk && position !== null && secondsLeft > 0 && !busy

  const shoot = async () => {
    if (!videoRef.current || shots.length >= MAX_PHOTOS) return
    setShotError(null)
    try {
      const [blob, pos] = await Promise.all([captureFrame(videoRef.current), currentPosition()])
      setPosition(pos)
      setShots((s) => [...s, { blob, url: URL.createObjectURL(blob) }])
    } catch {
      setShotError("We need your location at the moment you take the photo. Allow location and try again.")
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-bone">
      <div className="flex items-center justify-between px-4 pb-3 pt-[18px]">
        <Link href={`/jobs/${jobId}`} aria-label="Close camera" className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-3"><CloseIcon color="#EFEBE2" /></Link>
        <span className="font-mono text-[13px] text-soft">
          {secondsLeft > 0 ? <>Code expires in <span className="text-kola">{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</span></> : "Code expired"}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-ink-3 px-3 py-2 font-mono text-[12px]">
          <span className="h-2 w-2 rounded-full" style={{ background: gpsColor(gps) }} />
          {gps.status === "ok" ? `GPS ±${gps.accuracy} m` : gps.status === "denied" ? "No location" : "GPS…"}
        </span>
      </div>
      <div className="mx-4 flex items-center justify-between gap-3 rounded-[14px] bg-kola px-4 py-3 text-ink">
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-semibold">Write this on paper</span>
          <span className="text-[13px] text-[#2B2414]">Keep it in the shot with the place</span>
        </div>
        <span className="-rotate-3 font-hand text-[44px] font-bold leading-none tracking-[0.04em]">{code}</span>
      </div>
      <div className="relative mx-4 mt-3.5 flex-1 overflow-hidden rounded-[18px] bg-ink-3">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
        <CameraNotice status={status} gps={gps} />
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <span className="rounded-full bg-ink/80 px-3.5 py-2 text-[13px]">Photo {Math.min(shots.length + 1, MAX_PHOTOS)} of up to {MAX_PHOTOS}</span>
        </div>
      </div>
      {shotError && <p role="alert" className="mx-4 mt-2 text-[13px] text-fail">{shotError}</p>}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 pb-7 pt-[18px]">
        <div className="flex gap-2">
          {shots.map((s, i) => (
            <button key={s.url} type="button" aria-label={`Retake photo ${i + 1}`} onClick={() => setShots((all) => all.filter((x) => x !== s))} className="h-12 w-12 overflow-hidden rounded-[10px] border-2 border-pass p-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={s.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <button type="button" aria-label="Take photo" onClick={() => void shoot()} disabled={status === "denied" || status === "unavailable" || shots.length >= MAX_PHOTOS} className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-bone bg-transparent p-0 disabled:opacity-40">
          <span className="block h-[60px] w-[60px] rounded-full bg-bone" />
        </button>
        <div className="flex justify-end">
          <button type="button" disabled={!canSend} onClick={() => position && onSend(shots.map((s) => s.blob), position)} className="h-11 rounded-full bg-kola px-4 text-[15px] font-semibold text-ink disabled:bg-ink-3 disabled:text-muted">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
