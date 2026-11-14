"use client"

import { useEffect, useRef, useState } from "react"

export type CameraStatus = "starting" | "ready" | "front-only" | "denied" | "unavailable"

/** Rear camera stream; falls back to the front camera with a warning. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<CameraStatus>("starting")

  useEffect(() => {
    let stream: MediaStream | null = null
    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setStatus("unavailable")
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } }, audio: false })
        setStatus("ready")
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotAllowedError") return setStatus("denied")
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          setStatus("front-only")
        } catch {
          return setStatus("unavailable")
        }
      }
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
    }
    void start()
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [])

  return { videoRef, status }
}
