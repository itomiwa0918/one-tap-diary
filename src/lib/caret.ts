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

export function scrollCaretAboveKeyboard(
  textarea: HTMLTextAreaElement,
  scroller: HTMLElement
) {
  if (document.activeElement !== textarea) return

  const visual = window.visualViewport
  const visualTop = visual?.offsetTop ?? 0
  const visualBottom = visualTop + (visual?.height ?? window.innerHeight)
  const scrollerRect = scroller.getBoundingClientRect()
  const clipTop = Math.max(scrollerRect.top, visualTop)
  const clipBottom = Math.min(scrollerRect.bottom, visualBottom)
  const caret = getTextareaCaretRect(textarea)
  const margin = 16

  if (caret.bottom > clipBottom - margin) {
    scroller.scrollTop += caret.bottom - (clipBottom - margin)
  } else if (caret.top < clipTop + margin) {
    scroller.scrollTop -= clipTop + margin - caret.top
  }
}
