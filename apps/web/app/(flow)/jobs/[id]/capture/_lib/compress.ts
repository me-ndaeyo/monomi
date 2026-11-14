const MAX_SIDE = 1600
const QUALITY = 0.8

/** Grabs the current video frame as a JPEG, longest side at most 1600 px. */
export function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not take the photo"))), "image/jpeg", QUALITY)
  )
}

/** Plain-language reason for a failed location read. */
export function locationError(error: unknown): string {
  const code = error instanceof GeolocationPositionError ? error.code : 0
  if (code === 1) return "Location is blocked for this site. Click the icon left of the address bar, set Location to Allow, then reload."
  if (code === 2) return "Your device can't find its location. On a Mac, turn on Location Services for your browser in System Settings > Privacy & Security."
  if (code === 3) return "Finding your location took too long. Step outside or near a window and try again."
  return "We need your location at the moment you take the photo."
}

export function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 })
  )
}
