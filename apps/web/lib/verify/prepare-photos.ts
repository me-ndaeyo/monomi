import "server-only"
import sharp from "sharp"
import { sha256Hex } from "verifier"

const MAX_BYTES = 4 * 1024 * 1024

export interface PreparedPhoto {
  jpeg: Buffer
  sha256: string
}

/** Re-encodes each photo, which drops all EXIF and other metadata. */
export async function preparePhotos(
  files: File[]
): Promise<{ data: PreparedPhoto[] | null; error: string | null }> {
  if (files.length < 1 || files.length > 3) {
    return { data: null, error: "Send 1 to 3 photos" }
  }
  const photos: PreparedPhoto[] = []
  for (const file of files) {
    if (file.type !== "image/jpeg") {
      return { data: null, error: "Photos must be JPEG from the in-app camera" }
    }
    if (file.size > MAX_BYTES) {
      return { data: null, error: "Each photo must be under 4 MB" }
    }
    const jpeg = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .jpeg({ quality: 85 })
      .toBuffer()
    photos.push({ jpeg, sha256: sha256Hex(jpeg) })
  }
  return { data: photos, error: null }
}
