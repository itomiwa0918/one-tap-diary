export type Routine = {
  id: string
  label: string
  className: string
  defaultTime: string
  subActions?: string[]
}

export type CustomRoutine = {
  id: string
  label: string
}

export const COLOR = {
  pink: "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200 active:bg-pink-200",
  yellow:
    "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 active:bg-yellow-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 active:bg-blue-200",
  green:
    "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 active:bg-green-200",
  gray: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 active:bg-gray-200",
  custom:
    "bg-white text-gray-700 border-gray-200 hover:bg-gray-100 active:bg-gray-100",
  indigo:
    "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200 active:bg-indigo-200",
} as const

export const ROUTINES: Routine[] = [
  {
    id: "wake",
    label: "☀️起床",
    defaultTime: "08:00",
    className: COLOR.pink,
  },
  {
    id: "drop-off",
    label: "👶子供送り",
    defaultTime: "08:30",
    className: COLOR.yellow,
  },
  {
    id: "work",
    label: "👩‍💻 仕事",
    defaultTime: "09:00",
    className: COLOR.indigo,
  },
  {
    id: "housework",
    label: "🧹家事",
    defaultTime: "10:00",
    className: COLOR.green,
    subActions: ["🧺家事洗濯", "🍴家事食器", "🧽家事風呂掃除"],
  },
  {
    id: "lunch",
    label: "🍚昼食",
    defaultTime: "12:00",
    className: COLOR.blue,
  },
  {
    id: "pickup",
    label: "👶子供迎え",
    defaultTime: "18:15",
    className: COLOR.yellow,
  },
  {
    id: "dinner",
    label: "🍚夕食",
    defaultTime: "19:00",
    className: COLOR.blue,
  },
  {
    id: "bath",
    label: "♨️風呂",
    defaultTime: "20:00",
    className: COLOR.green,
  },
  {
    id: "sleep",
    label: "🛌就寝",
    defaultTime: "22:30",
    className: COLOR.pink,
  },
  {
    id: "workout",
    label: "🏋️筋トレ",
    defaultTime: "15:00",
    className: COLOR.gray,
  },
  {
    id: "youtube",
    label: "🎥Youtube",
    defaultTime: "15:00",
    className: COLOR.gray,
  },
]

export const CUSTOM_ROUTINES_STORAGE_KEY = "one-tap-diary:custom-routines"
export const DIARY_TEXT_STORAGE_KEY = "one-tap-diary:diary-text"

export function loadDiaryText() {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(DIARY_TEXT_STORAGE_KEY) ?? ""
}

export function saveDiaryText(text: string) {
  window.localStorage.setItem(DIARY_TEXT_STORAGE_KEY, text)
}

export function clearDiaryText() {
  window.localStorage.removeItem(DIARY_TEXT_STORAGE_KEY)
}

export function pad2(value: number) {
  return String(value).padStart(2, "0")
}

export function formatDateInput(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function formatTimeInput(date = new Date()) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function formatTitleDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-")
  if (!year || !month || !day) return isoDate.replaceAll("-", "/")
  return `${year}/${month}/${day}`
}

export function formatRoutineStamp(label: string, time: string) {
  return `・${time} ${label}`
}

export function formatTimeOnlyStamp(start: string, end?: string) {
  const range = end ? `${start}〜${end}` : start
  return `・${range} `
}

export function insertAtCursor(
  current: string,
  stamp: string,
  start: number,
  end: number
) {
  const from = Math.max(0, Math.min(start, current.length))
  const to = Math.max(from, Math.min(end, current.length))
  const before = current.slice(0, from)
  const after = current.slice(to)
  const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : ""
  const chunk = `${prefix}${stamp}`
  return {
    text: `${before}${chunk}${after}`,
    cursor: before.length + chunk.length,
  }
}

export function buildSendPayload(isoDate: string, text: string) {
  const title = formatTitleDate(isoDate)
  const body = text.replace(/^\uFEFF/, "").replace(/^\s+/, "")
  return body ? `${title}\n${body}` : title
}

export function buildShortcutsUrl(text: string) {
  return `shortcuts://run-shortcut?name=AddDiary&input=text&text=${encodeURIComponent(text)}`
}

const EMPTY_CUSTOM_ROUTINES: CustomRoutine[] = []
const customRoutineListeners = new Set<() => void>()
let cachedCustomRoutinesRaw: string | null = null
let cachedCustomRoutines: CustomRoutine[] = EMPTY_CUSTOM_ROUTINES

function parseCustomRoutines(raw: string): CustomRoutine[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY_CUSTOM_ROUTINES

    const routines = parsed.flatMap((item, index) => {
      if (!item || typeof item !== "object") return []
      const label = "label" in item ? String(item.label).trim() : ""
      if (!label) return []
      const id =
        "id" in item && typeof item.id === "string" && item.id
          ? item.id
          : `custom-${index}-${label}`
      return [{ id, label }]
    })

    return routines.length > 0 ? routines : EMPTY_CUSTOM_ROUTINES
  } catch {
    return EMPTY_CUSTOM_ROUTINES
  }
}

export function subscribeCustomRoutines(onStoreChange: () => void) {
  customRoutineListeners.add(onStoreChange)
  const onStorage = (event: StorageEvent) => {
    if (event.key === CUSTOM_ROUTINES_STORAGE_KEY || event.key === null) {
      cachedCustomRoutinesRaw = null
      onStoreChange()
    }
  }
  window.addEventListener("storage", onStorage)
  return () => {
    customRoutineListeners.delete(onStoreChange)
    window.removeEventListener("storage", onStorage)
  }
}

export function getCustomRoutinesSnapshot() {
  const raw = window.localStorage.getItem(CUSTOM_ROUTINES_STORAGE_KEY) ?? "[]"
  if (raw === cachedCustomRoutinesRaw) return cachedCustomRoutines
  cachedCustomRoutinesRaw = raw
  cachedCustomRoutines = parseCustomRoutines(raw)
  return cachedCustomRoutines
}

export function getCustomRoutinesServerSnapshot() {
  return EMPTY_CUSTOM_ROUTINES
}

export function writeCustomRoutines(routines: CustomRoutine[]) {
  const raw = JSON.stringify(routines)
  window.localStorage.setItem(CUSTOM_ROUTINES_STORAGE_KEY, raw)
  cachedCustomRoutinesRaw = raw
  cachedCustomRoutines = routines.length > 0 ? routines : EMPTY_CUSTOM_ROUTINES
  customRoutineListeners.forEach((listener) => listener())
}
