const MIRROR_STYLE_PROPS = [
  "boxSizing",
  "width",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
] as const

let mirror: HTMLDivElement | null = null

function getMirror() {
  if (mirror) return mirror
  const node = document.createElement("div")
  node.setAttribute("aria-hidden", "true")
  const style = node.style
  style.position = "absolute"
  style.visibility = "hidden"
  style.overflow = "hidden"
  style.whiteSpace = "pre-wrap"
  style.wordWrap = "break-word"
  style.top = "0"
  style.left = "-9999px"
  document.body.appendChild(node)
  mirror = node
  return node
}

export function getTextareaCaretRect(
  textarea: HTMLTextAreaElement,
  position = textarea.selectionEnd ?? textarea.value.length
) {
  const computed = window.getComputedStyle(textarea)
  const node = getMirror()
  const style = node.style
  for (const prop of MIRROR_STYLE_PROPS) {
    style[prop] = computed[prop]
  }
  style.width = `${textarea.clientWidth}px`
  style.height = "auto"

  node.textContent = textarea.value.slice(0, position)
  const marker = document.createElement("span")
  marker.textContent = textarea.value.slice(position) || "."
  node.appendChild(marker)

  const textareaRect = textarea.getBoundingClientRect()
  const markerRect = marker.getBoundingClientRect()
  const mirrorRect = node.getBoundingClientRect()
  const lineHeight =
    markerRect.height || Number.parseFloat(computed.lineHeight) || 28
  const top =
    textareaRect.top +
    (markerRect.top - mirrorRect.top) -
    textarea.scrollTop
  node.textContent = ""

  return { top, height: lineHeight, bottom: top + lineHeight }
}

function getSentinel(scroller: HTMLElement) {
  let sentinel = scroller.querySelector("[data-caret-sentinel]")
  if (sentinel instanceof HTMLElement) return sentinel

  sentinel = document.createElement("div")
  sentinel.setAttribute("data-caret-sentinel", "")
  sentinel.setAttribute("aria-hidden", "true")
  const style = sentinel.style
  style.position = "absolute"
  style.left = "0"
  style.width = "1px"
  style.pointerEvents = "none"
  scroller.appendChild(sentinel)
  return sentinel
}

export function revealTextareaCaret(
  textarea: HTMLTextAreaElement,
  scroller: HTMLElement,
  behavior: ScrollBehavior = "instant"
) {
  if (document.activeElement !== textarea) return

  const caret = getTextareaCaretRect(textarea)
  const scrollerRect = scroller.getBoundingClientRect()
  const sentinel = getSentinel(scroller)
  sentinel.style.top = `${caret.top - scrollerRect.top + scroller.scrollTop}px`
  sentinel.style.height = `${Math.max(caret.height, 28)}px`

  const caretCenter =
    caret.top - scrollerRect.top + scroller.scrollTop + caret.height / 2
  const nextTop = Math.max(0, caretCenter - scroller.clientHeight / 2)
  const viewBehavior = behavior === "smooth" ? "smooth" : "auto"

  if (typeof scroller.scrollTo === "function") {
    scroller.scrollTo({ top: nextTop, behavior: viewBehavior })
  } else {
    scroller.scrollTop = nextTop
  }

  sentinel.scrollIntoView({
    behavior: viewBehavior,
    block: "center",
    inline: "nearest",
  })
}
