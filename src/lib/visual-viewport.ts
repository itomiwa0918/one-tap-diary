const KEYBOARD_OVERLAP_PX = 140

export type ViewportMetrics = {
  visualHeight: number
  keyboardInset: number
  maxHeight: number
}

function isEditableTarget(target: EventTarget | null) {
  if (!target || typeof (target as HTMLElement).matches !== "function") {
    return false
  }
  return (target as HTMLElement).matches(
    "input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]), textarea, select, [contenteditable=true]"
  )
}

const TYPING_OVERLAP_PX = 80
const TYPING_KEYBOARD_FALLBACK_RATIO = 0.42
const TYPING_KEYBOARD_FALLBACK_MAX = 360
const TYPING_SHELL_MIN = 240

export function isCoarsePointer(
  win: Pick<Window, "matchMedia"> = window
) {
  return win.matchMedia("(hover: none), (pointer: coarse)").matches
}

export function readTypingShellRect(
  win: Pick<Window, "innerHeight" | "visualViewport" | "matchMedia"> = window,
  options: { heuristic?: boolean; layoutHeight?: number } = {}
) {
  const heuristic = options.heuristic ?? true
  const visual = win.visualViewport
  const inner = win.innerHeight
  const top = Math.round(visual?.offsetTop ?? 0)
  const visualHeight = Math.round(visual?.height ?? inner)
  const overlap = Math.max(0, inner - visualHeight - top)
  const layoutHeight = options.layoutHeight ?? inner
  const contentResized = layoutHeight - inner >= TYPING_OVERLAP_PX

  if (overlap >= TYPING_OVERLAP_PX) {
    return { top, height: visualHeight }
  }

  if (contentResized) {
    return { top: 0, height: Math.min(inner, visualHeight) }
  }

  if (heuristic && isCoarsePointer(win)) {
    const reserved = Math.min(
      Math.round(inner * TYPING_KEYBOARD_FALLBACK_RATIO),
      TYPING_KEYBOARD_FALLBACK_MAX
    )
    return { top: 0, height: Math.max(TYPING_SHELL_MIN, inner - reserved) }
  }

  return { top, height: visualHeight }
}

export function readViewportMetrics(
  win: Pick<Window, "innerHeight" | "visualViewport"> = window,
  activeElement: EventTarget | null = document.activeElement
): ViewportMetrics {
  const visual = win.visualViewport
  const visualHeight = Math.round(visual?.height ?? win.innerHeight)
  const offsetTop = Math.round(visual?.offsetTop ?? 0)
  const overlap = Math.max(
    0,
    Math.round(win.innerHeight - visualHeight - offsetTop)
  )
  const typing = isEditableTarget(activeElement)
  const keyboardInset = typing || overlap >= KEYBOARD_OVERLAP_PX ? overlap : 0
  const maxHeight = Math.max(
    200,
    Math.round(Math.min(visualHeight, win.innerHeight * 0.8))
  )

  return { visualHeight, keyboardInset, maxHeight }
}

function applyCssVars(metrics: ViewportMetrics) {
  const root = document.documentElement
  root.style.setProperty("--vv-height", `${metrics.visualHeight}px`)
  root.style.setProperty("--keyboard-inset", `${metrics.keyboardInset}px`)
}

const listeners = new Set<(metrics: ViewportMetrics) => void>()
let detach: (() => void) | null = null

function attach() {
  let frame = 0
  const publish = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      const metrics = readViewportMetrics()
      applyCssVars(metrics)
      listeners.forEach((listener) => listener(metrics))
    })
  }

  publish()
  const visual = window.visualViewport
  visual?.addEventListener("resize", publish)
  visual?.addEventListener("scroll", publish)
  window.addEventListener("resize", publish)
  document.addEventListener("focusin", publish)
  document.addEventListener("focusout", publish)

  return () => {
    cancelAnimationFrame(frame)
    visual?.removeEventListener("resize", publish)
    visual?.removeEventListener("scroll", publish)
    window.removeEventListener("resize", publish)
    document.removeEventListener("focusin", publish)
    document.removeEventListener("focusout", publish)
  }
}

export function subscribeKeyboardInsets(
  onChange: (metrics: ViewportMetrics) => void
) {
  listeners.add(onChange)
  if (!detach) detach = attach()
  onChange(readViewportMetrics())

  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) {
      detach?.()
      detach = null
    }
  }
}
