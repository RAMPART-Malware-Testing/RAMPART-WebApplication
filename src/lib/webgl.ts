export type RenderTier = "full" | "lite" | "off";

const SOFTWARE_RENDERER_PATTERN =
  /swiftshader|llvmpipe|softpipe|software renderer|software webgl|basic render|microsoft basic|mesa offscreen|indirect renderer/i

const CACHE_KEY = "rampart:render-tier:v2"
const OVERRIDE_KEY = "rampart:render-tier"

const FULL_TIER_MIN_CORES = 4
const FULL_TIER_MIN_MEMORY_GB = 4

type NavigatorWithHints = Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

type WebGLInfo = {
  ok: boolean
  renderer: string
  vendor: string
}

function probeWebGL(): WebGLInfo {
  if (typeof window === "undefined") return { ok: false, renderer: "", vendor: "" }
  try {
    const canvas = document.createElement("canvas")
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null
    if (!gl) return { ok: false, renderer: "", vendor: "" }

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

    return { ok: true, renderer, vendor }
  } catch {
    return { ok: false, renderer: "", vendor: "" }
  }
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false
}

function isLowPowerHint(): boolean {
  if (typeof navigator === "undefined") return false
  const nav = navigator as NavigatorWithHints
  return nav.connection?.saveData === true
}

function isSoftwareRenderer(info: WebGLInfo): boolean {
  return (
    SOFTWARE_RENDERER_PATTERN.test(info.renderer) ||
    SOFTWARE_RENDERER_PATTERN.test(info.vendor)
  )
}

function decideTier(): RenderTier {
  const info = probeWebGL()
  if (!info.ok) return "off"
  if (isSoftwareRenderer(info)) return "off"
  if (prefersReducedMotion()) return "off"
  if (isLowPowerHint()) return "off"

  const nav = typeof navigator === "undefined" ? undefined : (navigator as NavigatorWithHints)
  const cores = nav?.hardwareConcurrency ?? 0
  const memoryGb = nav?.deviceMemory ?? 0

  if (cores > 0 && cores <= 2) return "off"
  if (memoryGb > 0 && memoryGb <= 2) return "off"

  const belowFull =
    (cores > 0 && cores < FULL_TIER_MIN_CORES) ||
    (memoryGb > 0 && memoryGb < FULL_TIER_MIN_MEMORY_GB)

  return belowFull ? "lite" : "full"
}

export function getRenderTier(): RenderTier {
  if (typeof window === "undefined") return "off"

  try {
    const override = window.localStorage.getItem(OVERRIDE_KEY)
    if (override === "full" || override === "lite" || override === "off") return override
  } catch {}

  try {
    const cached = window.sessionStorage.getItem(CACHE_KEY)
    if (cached === "full" || cached === "lite" || cached === "off") return cached
  } catch {}

  const tier = decideTier()

  try {
    window.sessionStorage.setItem(CACHE_KEY, tier)
  } catch {}

  return tier
}

export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false
  try {
    const cached = window.sessionStorage.getItem(CACHE_KEY)
    if (cached) return cached !== "off"
  } catch {}
  const info = probeWebGL()
  return info.ok && !isSoftwareRenderer(info)
}