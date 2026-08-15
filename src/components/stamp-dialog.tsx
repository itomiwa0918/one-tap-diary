"use client"

import { PressButton } from "@/components/press-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

export type StampDraft = {
  label: string
  time: string
  subActions?: string[]
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

  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-sm rounded-3xl p-5"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{draft?.label}の時刻</DialogTitle>
          <DialogDescription>
            時刻を確認して、必要なら直してから確定してください。
          </DialogDescription>
        </DialogHeader>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted-foreground">
            時刻
          </span>
          <Input
            type="time"
            value={time}
            onChange={(event) => onTimeChange(event.target.value)}
            className="h-12 rounded-2xl bg-background px-3 text-base"
          />
        </label>

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
