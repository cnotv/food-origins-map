// A "saved map" is just a name plus the app's shareable query string (the
// same `?view=&item=&tab=&filter=` produced by App.vue's URL sync), so
// loading one is identical to following a bookmarked link.
export interface SavedMap {
  id: string
  name: string
  query: string
  createdAt: number
}

const STORAGE_KEY = 'food-origins-map:saved-maps'

function isSavedMap(value: unknown): value is SavedMap {
  if (!value || typeof value !== 'object') return false
  const m = value as Record<string, unknown>
  return (
    typeof m.id === 'string' &&
    typeof m.name === 'string' &&
    typeof m.query === 'string' &&
    typeof m.createdAt === 'number'
  )
}

function readAll(): SavedMap[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isSavedMap) : []
  } catch {
    return []
  }
}

function writeAll(maps: SavedMap[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps))
  } catch {
    // Storage full or unavailable (e.g. private browsing) — save silently no-ops.
  }
}

export function listLocalMaps(): SavedMap[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt)
}

export function addLocalMap(name: string, query: string): SavedMap {
  const map: SavedMap = { id: crypto.randomUUID(), name, query, createdAt: Date.now() }
  writeAll([...readAll(), map])
  return map
}

export function removeLocalMap(id: string): void {
  writeAll(readAll().filter((m) => m.id !== id))
}
