// A "saved point" is a location the visitor marked while foraging — by
// clicking the map, using their current location, or searching a city — kept
// in localStorage so the spot (and which of its foods are shown on the map)
// survives a reload.
export interface SavedPoint {
  id: string
  label: string
  lat: number
  lng: number
  createdAt: number
  // Food ids explicitly picked to show on the map for this point. A point
  // starts with none: a saved spot can be foragable for dozens of things at
  // once, so the map only fills in as the visitor picks which ones matter to
  // them there, rather than dumping every in-season result on by default.
  visibleFoodIds: string[]
}

const STORAGE_KEY = 'food-origins-map:saved-points'

function isSavedPoint(value: unknown): value is SavedPoint {
  if (!value || typeof value !== 'object') return false
  const p = value as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.label === 'string' &&
    typeof p.lat === 'number' &&
    typeof p.lng === 'number' &&
    typeof p.createdAt === 'number' &&
    Array.isArray(p.visibleFoodIds) &&
    p.visibleFoodIds.every((id) => typeof id === 'string')
  )
}

function readAll(): SavedPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isSavedPoint) : []
  } catch {
    return []
  }
}

function writeAll(points: SavedPoint[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points))
  } catch {
    // Storage full or unavailable (e.g. private browsing) — save silently no-ops.
  }
}

// Oldest first: points read top-to-bottom in the order they were added.
export function listSavedPoints(): SavedPoint[] {
  return readAll().sort((a, b) => a.createdAt - b.createdAt)
}

export function addSavedPoint(label: string, lat: number, lng: number): SavedPoint {
  const point: SavedPoint = {
    id: crypto.randomUUID(),
    label,
    lat,
    lng,
    createdAt: Date.now(),
    visibleFoodIds: [],
  }
  writeAll([...readAll(), point])
  return point
}

export function removeSavedPoint(id: string): void {
  writeAll(readAll().filter((p) => p.id !== id))
}

export function toggleFoodVisibility(pointId: string, foodId: string): void {
  writeAll(
    readAll().map((p) => {
      if (p.id !== pointId) return p
      const visibleFoodIds = p.visibleFoodIds.includes(foodId)
        ? p.visibleFoodIds.filter((id) => id !== foodId)
        : [...p.visibleFoodIds, foodId]
      return { ...p, visibleFoodIds }
    }),
  )
}
