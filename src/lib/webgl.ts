const SOFTWARE_RENDERER_PATTERN =
  /swiftshader|llvmpipe|softpipe|software renderer|software webgl|basic render|microsoft basic|mesa offscreen|indirect renderer/i

export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null
    if (!gl) return false

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
    const renderer = String(
      debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER),
    )
    const vendor = String(
      debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : gl.getParameter(gl.VENDOR),
    )

    gl.getExtension("WEBGL_lose_context")?.loseContext()

    if (SOFTWARE_RENDERER_PATTERN.test(renderer)) return false
    if (SOFTWARE_RENDERER_PATTERN.test(vendor)) return false
    return true
  } catch {
    return false
  }
}
