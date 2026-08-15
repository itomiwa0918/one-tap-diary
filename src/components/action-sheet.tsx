"use client"

import { PressButton } from "@/components/press-button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
        "flex h-auto min-h-12 w-full items-center justify-center rounded-2xl border px-2 py-2.5 text-sm font-medium",
        className
      )}
    >
      {label}
    </PressButton>
  )
}

export function ActionSheet({
  open,
  customRoutines,
  onSelect,
  onClose,
}: {
  open: boolean
  customRoutines: CustomRoutine[]
  onSelect: (draft: {
    label: string
    time: string
    subActions?: string[]
  }) => void
  onClose: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[80dvh] gap-0 rounded-t-3xl px-0 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle>行動を追加</SheetTitle>
          <SheetDescription>
            タップして時刻を確認し、日記に残します。
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 gap-2.5">
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
      </SheetContent>
    </Sheet>
  )
}
