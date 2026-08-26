"use client"

import { useEffect, useRef } from "react"

import { PressButton } from "@/components/press-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { formatTimeInput, replaceTimeMinutes } from "@/lib/routines"
import { cn } from "@/lib/utils"

export type StampDraft = {
  label: string
  time: string
  subActions?: string[]
}

const chipClassName =
  "inline-flex h-11 min-h-11 items-center justify-center rounded-2xl border px-3 text-sm font-medium"

function TimeQuickActions({
  time,
  onTimeChange,
}: {
  time: string
  onTimeChange: (time: string) => void
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <PressButton
        onPress={() => onTimeChange(formatTimeInput())}
        className={cn(
          chipClassName,
          "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"
        )}
      >
        現在時刻
      </PressButton>
      <PressButton
        onPress={() => onTimeChange(replaceTimeMinutes(time, "00"))}
        className={cn(
          chipClassName,
          "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
        )}
      >
        00分
      </PressButton>
      <PressButton
        onPress={() => onTimeChange(replaceTimeMinutes(time, "30"))}
        className={cn(
          chipClassName,
          "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
        )}
      >
        30分
      </PressButton>
    </div>
  )
}

export function StampDialog({
  draft,
  time,
  subAction,
  onTimeChange,
  onSubActionChange,
  onConfirm,
  onClose,
}: {
  draft: StampDraft | null
  time: string
  subAction: string
  onTimeChange: (time: string) => void
  onSubActionChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
}) {
  const subActions = draft?.subActions ?? []
  const timeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!draft) return
    const frame = requestAnimationFrame(() => {
      timeInputRef.current?.blur()
    })
    return () => cancelAnimationFrame(frame)
  }, [draft])

  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        initialFocus={false}
        className="top-[38%] z-[60] max-h-[85dvh] max-w-sm overflow-y-auto rounded-3xl p-5"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{draft?.label}の時刻</DialogTitle>
          <DialogDescription>
            時刻が合っていれば、そのまま確定できます。
          </DialogDescription>
        </DialogHeader>

        <div>
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted-foreground">
              時刻
            </span>
            <input
              ref={timeInputRef}
              type="time"
              autoFocus={false}
              value={time}
              onChange={(event) => onTimeChange(event.target.value)}
              className={cn(
                "h-12 w-full rounded-2xl border border-input bg-background px-3 text-base outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              )}
            />
          </label>
          <TimeQuickActions time={time} onTimeChange={onTimeChange} />
        </div>

        {subActions.length > 0 ? (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">内容</p>
            <RadioGroup
              value={subAction}
              onValueChange={onSubActionChange}
              className="gap-2"
            >
              {subActions.map((item) => (
                <label
                  key={item}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-3 touch-manipulation",
                    subAction === item
                      ? "border-green-300 bg-green-100 text-green-800"
                      : "border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                  )}
                >
                  <RadioGroupItem value={item} />
                  <span className="text-base font-medium">{item}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
        ) : null}

        <DialogFooter className="mx-0 mb-0 flex-row rounded-none border-0 bg-transparent p-0">
          <PressButton
            onPress={onClose}
            className="inline-flex h-12 min-h-12 flex-1 items-center justify-center rounded-2xl border border-border bg-background text-base font-medium"
          >
            キャンセル
          </PressButton>
          <PressButton
            onPress={onConfirm}
            className="inline-flex h-12 min-h-12 flex-1 items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground"
          >
            確定
          </PressButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const timeFieldClassName = cn(
  "h-12 w-full rounded-2xl border border-input bg-background px-3 text-base outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
)

export function TimeOnlyDialog({
  open,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  onConfirm,
  onClose,
}: {
  open: boolean
  startTime: string
  endTime: string
  onStartTimeChange: (value: string) => void
  onEndTimeChange: (value: string) => void
  onConfirm: () => void
  onClose: () => void
}) {
  const startRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      startRef.current?.blur()
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        initialFocus={false}
        className="top-[38%] z-[60] max-h-[85dvh] max-w-sm overflow-y-auto rounded-3xl p-5"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>⏱️ 時間のみ</DialogTitle>
          <DialogDescription>
            開始時刻を入れて確定すると、日記に時刻だけ残ります。
          </DialogDescription>
        </DialogHeader>

        <div>
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted-foreground">
              開始時刻（必須）
            </span>
            <input
              ref={startRef}
              type="time"
              autoFocus={false}
              required
              value={startTime}
              onChange={(event) => onStartTimeChange(event.target.value)}
              className={timeFieldClassName}
            />
          </label>
          <TimeQuickActions time={startTime} onTimeChange={onStartTimeChange} />
        </div>

        <div>
          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-sm text-muted-foreground">
              終了時刻（任意）
              {endTime ? (
                <button
                  type="button"
                  className="text-xs text-foreground/70 underline-offset-2 hover:underline"
                  onClick={() => onEndTimeChange("")}
                >
                  クリア
                </button>
              ) : null}
            </span>
            <input
              type="time"
              autoFocus={false}
              value={endTime}
              onChange={(event) => onEndTimeChange(event.target.value)}
              className={timeFieldClassName}
            />
          </label>
          <TimeQuickActions time={endTime} onTimeChange={onEndTimeChange} />
        </div>

        <DialogFooter className="mx-0 mb-0 flex-row rounded-none border-0 bg-transparent p-0">
          <PressButton
            onPress={onClose}
            className="inline-flex h-12 min-h-12 flex-1 items-center justify-center rounded-2xl border border-border bg-background text-base font-medium"
          >
            キャンセル
          </PressButton>
          <PressButton
            onPress={onConfirm}
            disabled={!startTime}
            className="inline-flex h-12 min-h-12 flex-1 items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            確定
          </PressButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ClearConfirmDialog({
  open,
  onConfirm,
  onClose,
}: {
  open: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        className="max-w-sm rounded-3xl p-5"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>入力内容をリセットしますか？</DialogTitle>
          <DialogDescription>
            今日の記録と自動保存した下書きを削除します。この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0 sm:flex-row">
          <PressButton
            onPress={onClose}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-border bg-background text-base font-medium"
          >
            キャンセル
          </PressButton>
          <PressButton
            onPress={onConfirm}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground"
          >
            OK
          </PressButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
