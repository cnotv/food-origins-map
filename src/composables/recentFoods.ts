// A small, global "last used" shortlist of food ids picked while foraging —
// so re-picking a favorite at a new spot doesn't mean re-filtering the whole
// list again. Most-recently-used first; kept in localStorage.
const STORAGE_KEY = 'food-origins-map:recent-foods'
const MAX_RECENT = 8

function readAll(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeAll(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Storage full or unavailable (e.g. private browsing) — save silently no-ops.
  }
}

export function listRecentFoods(): string[] {
  return readAll()
}

export function pushRecentFood(id: string): void {
  const rest = readAll().filter((x) => x !== id)
  writeAll([id, ...rest].slice(0, MAX_RECENT))
}

export function removeRecentFood(id: string): void {
  writeAll(readAll().filter((x) => x !== id))
}
