"use client"

import { PressButton } from "@/components/press-button"
import { COLOR, ROUTINES, type CustomRoutine } from "@/lib/routines"
import { cn } from "@/lib/utils"

function RoutineChip({
  label,
  className,
  onPress,
}: {
  label: string
  className: string
  onPress: () => void
}) {
  return (
    <PressButton
      onPress={onPress}
      className={cn(
        "flex h-auto min-h-10 w-full items-center justify-center rounded-xl border px-2 py-2 text-sm font-medium",
        className
      )}
    >
      {label}
    </PressButton>
  )
}

export function ActionMenu({
  open,
  customRoutines,
  onSelect,
  onSelectTimeOnly,
  onClose,
}: {
  open: boolean
  customRoutines: CustomRoutine[]
  onSelect: (draft: {
    label: string
    time: string
    subActions?: string[]
  }) => void
  onSelectTimeOnly: () => void
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="mt-2 rounded-2xl border border-border bg-card p-2.5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">行動を追加</p>
        <PressButton
          onPress={onClose}
          className="inline-flex h-7 items-center justify-center rounded-lg px-2 text-xs text-muted-foreground hover:bg-muted"
        >
          閉じる
        </PressButton>
      </div>
      <div className="max-h-[36vh] overflow-y-auto">
        <PressButton
          onPress={onSelectTimeOnly}
          className="mb-2 flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-2 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200 active:bg-slate-200"
        >
          ⏱️ 時間のみ
        </PressButton>
        <div className="grid grid-cols-2 gap-2">
          {ROUTINES.map((routine) => (
            <RoutineChip
              key={routine.id}
              label={routine.label}
              className={routine.className}
              onPress={() =>
                onSelect({
                  label: routine.label,
                  time: routine.defaultTime,
                  subActions: routine.subActions,
                })
              }
            />
          ))}
          {customRoutines.map((routine) => (
            <RoutineChip
              key={routine.id}
              label={routine.label}
              className={COLOR.custom}
              onPress={() =>
                onSelect({
                  label: routine.label,
                  time: "",
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
