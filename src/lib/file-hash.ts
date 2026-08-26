/**
 * Computes the SHA-256 hash of a File entirely in the browser using the
 * Web Crypto API - no bytes are sent to the server for this. Used before
 * upload to ask the backend "have you already analyzed this exact content?"
 * (see /api/check-hash), so a re-upload of a known file never has to pay
 * the cost of a full upload + re-running every analysis tool.
 */
export async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
