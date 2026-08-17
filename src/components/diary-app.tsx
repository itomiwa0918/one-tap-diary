"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Send } from "lucide-react"

import { ActionMenu } from "@/components/action-sheet"
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
  const copiedTimerRef = useRef<number | null>(null)
  const cursorRef = useRef({ start: 0, end: 0 })
  const cursorTouchedRef = useRef(false)
  const pendingCursorRef = useRef<number | null>(null)
  const [viewport, setViewport] = useState({ top: 0, height: "100dvh" })

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
  }, [text])

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const visual = window.visualViewport
    const lockDocumentScroll = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    const syncViewport = () => {
      lockDocumentScroll()
      if (!visual) {
        setViewport({ top: 0, height: "100dvh" })
        return
      }
      setViewport({
        top: visual.offsetTop,
        height: `${Math.round(visual.height)}px`,
      })
    }

    syncViewport()
    visual?.addEventListener("resize", syncViewport)
    visual?.addEventListener("scroll", syncViewport)
    window.addEventListener("scroll", lockDocumentScroll, { passive: true })
    return () => {
      visual?.removeEventListener("resize", syncViewport)
      visual?.removeEventListener("scroll", syncViewport)
      window.removeEventListener("scroll", lockDocumentScroll)
    }
  }, [])

  function captureCursor() {
    const el = textareaRef.current
    if (!el || document.activeElement !== el) return
    cursorTouchedRef.current = true
    cursorRef.current = {
      start: el.selectionStart ?? el.value.length,
      end: el.selectionEnd ?? el.value.length,
    }
  }

  function focusDiaryAt(pos: number) {
    const apply = () => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(pos, pos)
      cursorRef.current = { start: pos, end: pos }
      cursorTouchedRef.current = true
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
    const fallback = text.length
    const start = cursorTouchedRef.current ? cursorRef.current.start : fallback
    const end = cursorTouchedRef.current ? cursorRef.current.end : fallback
    const result = insertAtCursor(text, stamp, start, end)
    applyText(result.text, result.cursor)
    focusDiaryAt(result.cursor)
  }

  function toggleActions() {
    captureCursor()
    setActionsOpen((open) => !open)
  }

  function openStampDialog(next: StampDraft) {
    captureCursor()
    setActionsOpen(false)
    const time = next.time || formatTimeInput()
    setDraft({ ...next, time })
    setDialogTime(time)
    setSubAction(next.subActions?.[0] ?? "")
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
    setStartTime(formatTimeInput())
    setEndTime("")
    setTimeOnlyOpen(true)
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
    <div
      className="fixed inset-x-0 z-10 mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background"
      style={{ top: viewport.top, height: viewport.height }}
    >
      <header className="sticky top-0 z-30 shrink-0 bg-background px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <PressButton
          onPress={toggleActions}
          ariaExpanded={actionsOpen}
          className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground"
        >
          {actionsOpen ? "閉じる" : "＋ 行動を追加"}
        </PressButton>
        <ActionMenu
          open={actionsOpen}
          customRoutines={customRoutines}
          onSelect={openStampDialog}
          onSelectTimeOnly={openTimeOnlyDialog}
          onClose={() => setActionsOpen(false)}
        />
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
            onPress={() => setSettingsOpen(true)}
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
            const next = event.target.value
            cursorTouchedRef.current = true
            cursorRef.current = {
              start: event.target.selectionStart ?? next.length,
              end: event.target.selectionEnd ?? next.length,
            }
            applyText(next)
          }}
          onSelect={captureCursor}
          onClick={captureCursor}
          onKeyUp={captureCursor}
          onFocus={() => {
            captureCursor()
            window.scrollTo(0, 0)
          }}
          placeholder={"＋ 行動を追加してから、\n今日の気持ちを書き足せます。"}
          rows={18}
          className="diary-paper mb-3 min-h-[80dvh] w-full resize-none rounded-2xl border-border/80 bg-card px-4 py-4 text-base leading-7 field-sizing-content"
        />
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
    </div>
  )
}
