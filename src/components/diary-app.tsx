"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Send } from "lucide-react"

import { ActionSheet } from "@/components/action-sheet"
import { PressButton } from "@/components/press-button"
import { SettingsSheet } from "@/components/settings-sheet"
import {
  ClearConfirmDialog,
  StampDialog,
  type StampDraft,
} from "@/components/stamp-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  appendRoutineStamp,
  buildSendPayload,
  buildShortcutsUrl,
  clearDiaryText,
  formatDateInput,
  formatTimeInput,
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
  const customRoutines = useSyncExternalStore(
    subscribeCustomRoutines,
    getCustomRoutinesSnapshot,
    getCustomRoutinesServerSnapshot
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const copiedTimerRef = useRef<number | null>(null)

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
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

  function openStampDialog(next: StampDraft) {
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
    setText((current) => appendRoutineStamp(current, label, time))
    window.setTimeout(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.scrollTop = el.scrollHeight
    }, 280)
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
    setText("")
    clearDiaryText()
    setConfirmClear(false)
  }

  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-background px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <header className="mb-3 flex shrink-0 items-center gap-2">
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
      </header>

      <section className="flex min-h-0 flex-1 flex-col">
        <Textarea
          id="diary-text"
          aria-label="日記"
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={"＋ 行動を追加してから、\n今日の気持ちを書き足せます。"}
          className="diary-paper min-h-0 flex-1 resize-none rounded-2xl border-border/80 bg-card px-4 py-4 text-base leading-7 field-sizing-fixed"
        />
      </section>

      <div className="mt-3 flex shrink-0 flex-col gap-2">
        <PressButton
          onPress={() => setActionsOpen(true)}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground"
        >
          ＋ 行動を追加
        </PressButton>
        <div className="grid grid-cols-3 gap-2">
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
      </div>

      <ActionSheet
        open={actionsOpen}
        customRoutines={customRoutines}
        onSelect={openStampDialog}
        onClose={() => setActionsOpen(false)}
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
