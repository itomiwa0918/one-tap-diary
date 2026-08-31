"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Send } from "lucide-react"

import { ActionSheet } from "@/components/action-sheet"
import { PressButton } from "@/components/press-button"
import { SettingsSheet } from "@/components/settings-sheet"
import {
  ClearConfirmDialog,
  StampDialog,
  TimeOnlyDialog,
  type StampDraft,
} from "@/components/stamp-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  buildSendPayload,
  buildShortcutsUrl,
  clearDiaryText,
  formatDateInput,
  formatRoutineStamp,
  formatTimeInput,
  formatTimeOnlyStamp,
  insertAtCursor,
  getCustomRoutinesServerSnapshot,
  getCustomRoutinesSnapshot,
  loadDiaryText,
  ROUTINES,
  saveDiaryText,
  subscribeCustomRoutines,
  writeCustomRoutines,
} from "@/lib/routines"
import { revealTextareaCaret } from "@/lib/caret"
import { isCoarsePointer, readTypingShellRect } from "@/lib/visual-viewport"
import { cn } from "@/lib/utils"

export function DiaryApp() {
  const [diaryDate, setDiaryDate] = useState(formatDateInput)
  const [text, setText] = useState("")
  const [textReady, setTextReady] = useState(false)
  const [newRoutineName, setNewRoutineName] = useState("")
  const [draft, setDraft] = useState<StampDraft | null>(null)
  const [dialogTime, setDialogTime] = useState("")
  const [subAction, setSubAction] = useState("")
  const [confirmClear, setConfirmClear] = useState(false)
  const [copied, setCopied] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [timeOnlyOpen, setTimeOnlyOpen] = useState(false)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const customRoutines = useSyncExternalStore(
    subscribeCustomRoutines,
    getCustomRoutinesSnapshot,
    getCustomRoutinesServerSnapshot
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLSectionElement>(null)
  const copiedTimerRef = useRef<number | null>(null)
  const cursorRef = useRef({ start: 0, end: 0 })
  const cursorTouchedRef = useRef(false)
  const pendingCursorRef = useRef<number | null>(null)
  const diaryFocusedRef = useRef(false)
  const revealTimersRef = useRef<number[]>([])
  const layoutHeightRef = useRef(0)
  const [typingViewport, setTypingViewport] = useState<{
    top: number
    height: number
  } | null>(null)
  const [compactPaper, setCompactPaper] = useState(false)

  function setTypingClass(on: boolean) {
    document.documentElement.classList.toggle("diary-typing", on)
    document.body.classList.toggle("diary-typing", on)
  }

  function syncTypingViewport(heuristic = true) {
    if (!diaryFocusedRef.current) {
      layoutHeightRef.current = window.innerHeight
      setTypingClass(false)
      setTypingViewport(null)
      setCompactPaper(false)
      return
    }
    setCompactPaper(isCoarsePointer())
    const next = readTypingShellRect(window, {
      heuristic,
      layoutHeight: layoutHeightRef.current || window.innerHeight,
    })
    const shrinking = next.height < window.innerHeight - 40
    if (!shrinking) {
      setTypingClass(false)
      setTypingViewport(null)
      return
    }
    setTypingClass(true)
    setTypingViewport((current) => {
      if (current?.top === next.top && current.height === next.height) {
        return current
      }
      return next
    })
  }

  function revealCaret(behavior: ScrollBehavior = "instant") {
    const run = (nextBehavior: ScrollBehavior) => {
      const el = textareaRef.current
      const scroller = scrollRef.current
      if (!el || !scroller || document.activeElement !== el) return
      revealTextareaCaret(el, scroller, nextBehavior)
    }

    run(behavior)
    revealTimersRef.current.forEach((id) => window.clearTimeout(id))
    revealTimersRef.current = [50, 180, 350, 600].map((ms, index) =>
      window.setTimeout(() => run(index === 0 ? behavior : "instant"), ms)
    )
  }

  useEffect(() => {
    const saved = loadDiaryText()
    const frame = requestAnimationFrame(() => {
      setText(saved)
      setTextReady(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!textReady) return
    saveDiaryText(text)
  }, [text, textReady])

  useEffect(() => {
    const pos = pendingCursorRef.current
    if (pos === null) return
    pendingCursorRef.current = null
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(pos, pos)
    cursorRef.current = { start: pos, end: pos }
    cursorTouchedRef.current = true
    revealCaret("smooth")
  }, [text])

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const lockDocumentScroll = () => {
      if (diaryFocusedRef.current) return
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    const onViewport = () => {
      syncTypingViewport(true)
      if (diaryFocusedRef.current) revealCaret("smooth")
    }

    const onSelectionChange = () => {
      if (document.activeElement !== textareaRef.current) return
      revealCaret("instant")
    }

    const onInput = () => {
      if (document.activeElement !== textareaRef.current) return
      revealCaret("instant")
    }

    layoutHeightRef.current = window.innerHeight
    lockDocumentScroll()
    const visual = window.visualViewport
    visual?.addEventListener("resize", onViewport)
    visual?.addEventListener("scroll", onViewport)
    window.addEventListener("resize", onViewport)
    window.addEventListener("scroll", lockDocumentScroll, { passive: true })
    document.addEventListener("selectionchange", onSelectionChange)
    const textarea = textareaRef.current
    textarea?.addEventListener("input", onInput)

    return () => {
      visual?.removeEventListener("resize", onViewport)
      visual?.removeEventListener("scroll", onViewport)
      window.removeEventListener("resize", onViewport)
      window.removeEventListener("scroll", lockDocumentScroll)
      document.removeEventListener("selectionchange", onSelectionChange)
      textarea?.removeEventListener("input", onInput)
      revealTimersRef.current.forEach((id) => window.clearTimeout(id))
      setTypingClass(false)
    }
  }, [])

  function rememberCursor(
    el: HTMLTextAreaElement,
    source: "input" | "click" | "keyup" | "select"
  ) {
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    const collapsedAtStart = start === 0 && end === 0
    const hadLaterCaret =
      cursorRef.current.start > 0 || cursorRef.current.end > 0

    // iOS Safari は blur 時に selection を 0 に戻し、select が発火する。
    if (
      source === "select" &&
      collapsedAtStart &&
      hadLaterCaret &&
      el.value.length > 0
    ) {
      return
    }

    cursorRef.current = { start, end }
    cursorTouchedRef.current = true
  }

  function captureCursor() {
    const el = textareaRef.current
    if (!el || document.activeElement !== el) return
    rememberCursor(el, "select")
  }

  function getInsertRange() {
    const el = textareaRef.current
    if (el && document.activeElement === el) {
      const start = el.selectionStart ?? 0
      const end = el.selectionEnd ?? 0
      const looksLikeIosReset =
        start === 0 &&
        end === 0 &&
        el.value.length > 0 &&
        (cursorRef.current.start > 0 || cursorRef.current.end > 0)
      if (!looksLikeIosReset) {
        return { start, end }
      }
    }
    if (cursorTouchedRef.current) return cursorRef.current
    const len = text.length
    return { start: len, end: len }
  }

  function focusDiaryAt(pos: number) {
    const apply = () => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(pos, pos)
      cursorRef.current = { start: pos, end: pos }
      cursorTouchedRef.current = true
      revealCaret("smooth")
    }
    requestAnimationFrame(apply)
    window.setTimeout(apply, 280)
  }

  function applyText(next: string, cursor?: number) {
    saveDiaryText(next)
    if (cursor !== undefined) {
      pendingCursorRef.current = cursor
      cursorRef.current = { start: cursor, end: cursor }
      cursorTouchedRef.current = true
    }
    setText(next)
  }

  function insertStamp(stamp: string) {
    const { start, end } = getInsertRange()
    const result = insertAtCursor(text, stamp, start, end)
    applyText(result.text, result.cursor)
    focusDiaryAt(result.cursor)
  }

  function dismissKeyboard() {
    const el = textareaRef.current
    if (el && document.activeElement === el) {
      rememberCursor(el, "select")
      el.blur()
      return
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  function openActions() {
    captureCursor()
    dismissKeyboard()
    setActionsOpen(true)
  }

  function openStampDialog(next: StampDraft) {
    captureCursor()
    setActionsOpen(false)
    const time = next.time || formatTimeInput()
    window.setTimeout(() => {
      setDraft({ ...next, time })
      setDialogTime(time)
      setSubAction(next.subActions?.[0] ?? "")
    }, 160)
  }

  function closeStampDialog() {
    setDraft(null)
    setSubAction("")
  }

  function stampRoutine(label: string, time: string) {
    insertStamp(formatRoutineStamp(label, time))
  }

  function openTimeOnlyDialog() {
    captureCursor()
    setActionsOpen(false)
    window.setTimeout(() => {
      setStartTime(formatTimeInput())
      setEndTime("")
      setTimeOnlyOpen(true)
    }, 160)
  }

  function confirmTimeOnly() {
    if (!startTime) return
    insertStamp(formatTimeOnlyStamp(startTime, endTime))
    setTimeOnlyOpen(false)
  }

  function confirmStamp() {
    if (!draft) return
    const time = dialogTime || draft.time || formatTimeInput()
    const label =
      draft.subActions?.length && subAction ? subAction : draft.label
    stampRoutine(label, time)
    closeStampDialog()
  }

  function addCustomRoutine() {
    const label = newRoutineName.trim()
    if (!label) return

    const exists = [...ROUTINES, ...customRoutines].some(
      (routine) => routine.label === label
    )
    if (exists) {
      setNewRoutineName("")
      return
    }

    writeCustomRoutines([
      ...customRoutines,
      { id: `custom-${Date.now()}`, label },
    ])
    setNewRoutineName("")
  }

  function removeCustomRoutine(id: string) {
    writeCustomRoutines(customRoutines.filter((routine) => routine.id !== id))
  }

  function sendToShortcuts() {
    const payload = buildSendPayload(diaryDate || formatDateInput(), text)
    if (!text.trim()) return
    window.location.href = buildShortcutsUrl(payload)
  }

  function markCopied() {
    setCopied(true)
    if (copiedTimerRef.current !== null) {
      window.clearTimeout(copiedTimerRef.current)
    }
    copiedTimerRef.current = window.setTimeout(() => {
      setCopied(false)
      copiedTimerRef.current = null
    }, 2000)
  }

  async function copyDiary() {
    const payload = buildSendPayload(diaryDate || formatDateInput(), text)
    if (!text.trim()) return

    try {
      await navigator.clipboard.writeText(payload)
      markCopied()
    } catch {
      const helper = document.createElement("textarea")
      helper.value = payload
      helper.setAttribute("readonly", "")
      helper.style.position = "fixed"
      helper.style.left = "-9999px"
      document.body.appendChild(helper)
      helper.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(helper)
      if (ok) markCopied()
    }
  }

  function resetDiary() {
    pendingCursorRef.current = 0
    cursorRef.current = { start: 0, end: 0 }
    cursorTouchedRef.current = false
    setText("")
    clearDiaryText()
    setConfirmClear(false)
  }

  return (
    <>
      <div
        className={cn(
          "z-10 mx-auto flex w-full max-w-md flex-col overflow-hidden bg-background",
          typingViewport ? "fixed inset-x-0" : "fixed inset-0"
        )}
        style={
          typingViewport
            ? {
                top: typingViewport.top,
                height: typingViewport.height,
                bottom: "auto",
              }
            : undefined
        }
      >
        <header className="shrink-0 bg-background px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <PressButton
            onPress={openActions}
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground"
          >
            ＋ 行動を追加
          </PressButton>
        </header>

        <section
          ref={scrollRef}
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain [overflow-anchor:none] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
        <div className="flex items-center gap-2 py-2">
          <Input
            id="diary-date"
            type="date"
            aria-label="日付"
            value={diaryDate}
            onChange={(event) => setDiaryDate(event.target.value)}
            className="h-10 min-w-0 flex-1 rounded-xl bg-card px-3 text-base"
          />
          <PressButton
            onPress={() => {
              dismissKeyboard()
              setSettingsOpen(true)
            }}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            ⚙️ 設定
          </PressButton>
        </div>
        <Textarea
          id="diary-text"
          aria-label="日記"
          ref={textareaRef}
          value={text}
          onChange={(event) => {
            const next = event.currentTarget.value
            rememberCursor(event.currentTarget, "input")
            applyText(next)
            revealCaret("instant")
          }}
          onSelect={() => {
            const el = textareaRef.current
            if (el) rememberCursor(el, "select")
          }}
          onClick={(event) => {
            rememberCursor(event.currentTarget, "click")
            revealCaret("instant")
          }}
          onKeyUp={(event) => {
            rememberCursor(event.currentTarget, "keyup")
            revealCaret("instant")
          }}
          onTouchEnd={(event) => rememberCursor(event.currentTarget, "click")}
          onFocus={(event) => {
            diaryFocusedRef.current = true
            layoutHeightRef.current = window.innerHeight
            rememberCursor(event.currentTarget, "select")
            setCompactPaper(isCoarsePointer())
            syncTypingViewport(true)
            revealCaret("smooth")
          }}
          onBlur={() => {
            diaryFocusedRef.current = false
            layoutHeightRef.current = window.innerHeight
            setTypingClass(false)
            setTypingViewport(null)
            setCompactPaper(false)
            revealTimersRef.current.forEach((id) => window.clearTimeout(id))
            revealTimersRef.current = []
          }}
          placeholder={"＋ 行動を追加してから、\n今日の気持ちを書き足せます。"}
          rows={compactPaper ? 8 : 18}
          className={cn(
            "diary-paper mb-3 w-full resize-none rounded-2xl border-border/80 bg-card px-4 py-4 text-base leading-7 field-sizing-content",
            compactPaper ? "min-h-0" : "min-h-[80dvh]"
          )}
        />
        {compactPaper ? (
          <div className="h-40 shrink-0" aria-hidden="true" />
        ) : null}
        <div className="grid grid-cols-3 gap-2 pb-2">
          <PressButton
            onPress={sendToShortcuts}
            disabled={!text.trim()}
            className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl bg-primary/90 px-1 text-xs font-medium text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="size-3.5" />
            メモ送信
          </PressButton>
          <PressButton
            onPress={() => {
              void copyDiary()
            }}
            disabled={!text.trim()}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-2xl border px-1 text-xs font-medium disabled:pointer-events-none disabled:opacity-50",
              copied
                ? "border-green-200 bg-green-100 text-green-800"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
            )}
          >
            {copied ? "✅ 完了" : "📋 コピー"}
          </PressButton>
          <PressButton
            onPress={() => setConfirmClear(true)}
            disabled={!text}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-gray-200 bg-white px-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-50"
          >
            🗑️ クリア
          </PressButton>
        </div>
      </section>
      </div>

      <ActionSheet
        open={actionsOpen}
        customRoutines={customRoutines}
        onSelect={openStampDialog}
        onSelectTimeOnly={openTimeOnlyDialog}
        onClose={() => setActionsOpen(false)}
      />
      <TimeOnlyDialog
        open={timeOnlyOpen}
        startTime={startTime}
        endTime={endTime}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        onConfirm={confirmTimeOnly}
        onClose={() => setTimeOnlyOpen(false)}
      />
      <StampDialog
        draft={draft}
        time={dialogTime}
        subAction={subAction}
        onTimeChange={setDialogTime}
        onSubActionChange={setSubAction}
        onConfirm={confirmStamp}
        onClose={closeStampDialog}
      />
      <ClearConfirmDialog
        open={confirmClear}
        onConfirm={resetDiary}
        onClose={() => setConfirmClear(false)}
      />
      <SettingsSheet
        open={settingsOpen}
        newRoutineName={newRoutineName}
        customRoutines={customRoutines}
        onNewRoutineNameChange={setNewRoutineName}
        onAdd={addCustomRoutine}
        onRemove={removeCustomRoutine}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
