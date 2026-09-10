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
  // Food ids explicitly hidden from the map for this point; absent = shown.
  hiddenFoodIds: string[]
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
    Array.isArray(p.hiddenFoodIds) &&
    p.hiddenFoodIds.every((id) => typeof id === 'string')
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
    hiddenFoodIds: [],
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
      const hiddenFoodIds = p.hiddenFoodIds.includes(foodId)
        ? p.hiddenFoodIds.filter((id) => id !== foodId)
        : [...p.hiddenFoodIds, foodId]
      return { ...p, hiddenFoodIds }
    }),
  )
}
