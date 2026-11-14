import type { CameraStatus } from "../_hooks/use-camera"
import type { GpsState } from "../_hooks/use-gps"

const MESSAGES: Partial<Record<CameraStatus, string>> = {
  denied: "Camera access is off. Allow the camera for this site in your browser settings, then reload.",
  unavailable: "We couldn't find a camera. Open this page on your phone.",
  "front-only": "Only the front camera is available. Hold the phone so it faces the place.",
}

export default function CameraNotice({ status, gps }: Readonly<{ status: CameraStatus; gps: GpsState }>) {
  const message =
    MESSAGES[status] ??
    (gps.status === "denied"
      ? "Location is off. We need it to check you are at the spot. Allow location, then reload."
      : gps.status === "ok" && gps.accuracy > 150
        ? "GPS is too rough right now. Step into the open and wait a moment."
        : null)
  if (!message) return null
  return <p className="absolute inset-x-4 top-4 rounded-xl bg-ink/85 p-3 text-[14px] leading-snug">{message}</p>
}
