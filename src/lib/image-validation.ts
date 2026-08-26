/**
 * Client/server-shared "does this look like a real image" check, based on
 * file-signature (magic byte) sniffing rather than the `Content-Type` the
 * browser/multipart form claims.
 *
 * This is intentionally NOT the real security boundary (OWASP A04 -
 * Unrestricted File Upload): a magic-byte check can still be spoofed by a
 * crafted polyglot file. The backend (`services/profile/profile_service.py`)
 * is the actual gate - it fully decodes and re-encodes the image with
 * Pillow, which a fake-signature file cannot survive. This check exists
 * purely as defense-in-depth / fast-fail so obviously-wrong uploads (a
 * renamed .exe, an HTML file, etc.) are rejected immediately in the
 * browser and again in the Next.js proxy route, before ever reaching the
 * backend or being written to disk anywhere.
 */

export const ALLOWED_AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const

export type AllowedAvatarMimeType = (typeof ALLOWED_AVATAR_MIME_TYPES)[number]

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]

function matchesSignature(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) return false
  }
  return true
}

function asciiAt(bytes: Uint8Array, offset: number, text: string): boolean {
  if (bytes.length < offset + text.length) return false
  for (let i = 0; i < text.length; i++) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false
  }
  return true
}

/**
 * Detects PNG/JPEG/WEBP by file signature. Returns the sniffed MIME type,
 * or null if the bytes don't match any of the three allowed image formats.
 */
export function sniffImageMimeType(bytes: Uint8Array): AllowedAvatarMimeType | null {
  if (matchesSignature(bytes, PNG_SIGNATURE)) return "image/png"
  if (matchesSignature(bytes, JPEG_SIGNATURE)) return "image/jpeg"
  // WEBP: "RIFF" .... "WEBP" (RIFF container, WEBP fourcc at byte 8)
  if (asciiAt(bytes, 0, "RIFF") && asciiAt(bytes, 8, "WEBP")) return "image/webp"
  return null
}

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024 // 5MB, must match the backend's cap
