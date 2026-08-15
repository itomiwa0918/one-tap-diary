"use client"

import { PressButton } from "@/components/press-button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { COLOR, type CustomRoutine } from "@/lib/routines"
import { cn } from "@/lib/utils"

export function SettingsSheet({
  open,
  newRoutineName,
  customRoutines,
  onNewRoutineNameChange,
  onAdd,
  onRemove,
  onClose,
}: {
  open: boolean
  newRoutineName: string
  customRoutines: CustomRoutine[]
  onNewRoutineNameChange: (value: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onClose: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[85dvh] gap-0 rounded-t-3xl px-0 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle>⚙️ 設定</SheetTitle>
          <SheetDescription>
            自分用のボタンを追加・削除できます。
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-2">
          <section>
            <p className="mb-2.5 text-sm text-muted-foreground">新ボタン</p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newRoutineName}
                onChange={(event) => onNewRoutineNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    onAdd()
                  }
                }}
                placeholder="ボタン名を入力"
                className="h-12 rounded-2xl bg-background px-3 text-base"
              />
              <PressButton
                onPress={onAdd}
                disabled={!newRoutineName.trim()}
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-primary px-3.5 text-sm font-medium text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                ＋追加
              </PressButton>
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-sm text-muted-foreground">追加したボタン</p>
            {customRoutines.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                まだありません
              </p>
            ) : (
              <ul className="space-y-2">
                {customRoutines.map((routine) => (
                  <li
                    key={routine.id}
                    className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2"
                  >
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate rounded-xl border px-2.5 py-1.5 text-sm font-medium",
                        COLOR.custom
                      )}
                    >
                      {routine.label}
                    </span>
                    <PressButton
                      onPress={() => onRemove(routine.id)}
                      className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      🗑️ 削除
                    </PressButton>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <SheetFooter className="px-5">
          <PressButton
            onPress={onClose}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-background text-base font-medium"
          >
            閉じる
          </PressButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
