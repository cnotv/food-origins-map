import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addSavedPoint, listSavedPoints, removeSavedPoint, toggleFoodVisibility } from '../savedPoints'

describe('savedPoints (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty', () => {
    expect(listSavedPoints()).toEqual([])
  })

  it('adds a point with no hidden foods by default', () => {
    const point = addSavedPoint('My yard', 40, -70)
    expect(point.label).toBe('My yard')
    expect(point.lat).toBe(40)
    expect(point.lng).toBe(-70)
    expect(point.hiddenFoodIds).toEqual([])
    expect(point.id).toBeTruthy()

    expect(listSavedPoints()).toEqual([point])
  })

  it('lists oldest first', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(1000)
      const first = addSavedPoint('First', 1, 1)
      vi.setSystemTime(2000)
      const second = addSavedPoint('Second', 2, 2)
      expect(listSavedPoints().map((p) => p.id)).toEqual([first.id, second.id])
    } finally {
      vi.useRealTimers()
    }
  })

  it('removes a point by id', () => {
    const keep = addSavedPoint('Keep me', 1, 1)
    const gone = addSavedPoint('Delete me', 2, 2)
    removeSavedPoint(gone.id)
    expect(listSavedPoints()).toEqual([keep])
  })

  it('toggles a food id in and out of hiddenFoodIds', () => {
    const point = addSavedPoint('Spot', 1, 1)
    toggleFoodVisibility(point.id, 'apple')
    expect(listSavedPoints()[0].hiddenFoodIds).toEqual(['apple'])

    toggleFoodVisibility(point.id, 'pear')
    expect(listSavedPoints()[0].hiddenFoodIds).toEqual(['apple', 'pear'])

    toggleFoodVisibility(point.id, 'apple')
    expect(listSavedPoints()[0].hiddenFoodIds).toEqual(['pear'])
  })

  it('leaves other points untouched when toggling one', () => {
    const a = addSavedPoint('A', 1, 1)
    const b = addSavedPoint('B', 2, 2)
    toggleFoodVisibility(a.id, 'apple')
    const points = listSavedPoints()
    expect(points.find((p) => p.id === a.id)?.hiddenFoodIds).toEqual(['apple'])
    expect(points.find((p) => p.id === b.id)?.hiddenFoodIds).toEqual([])
  })

  it('ignores malformed data already in storage', () => {
    localStorage.setItem('food-origins-map:saved-points', '{"not":"an array"}')
    expect(listSavedPoints()).toEqual([])

    localStorage.setItem('food-origins-map:saved-points', 'not even json')
    expect(listSavedPoints()).toEqual([])
  })

  it('filters out malformed entries within an otherwise valid array', () => {
    localStorage.setItem(
      'food-origins-map:saved-points',
      JSON.stringify([
        { id: '1', label: 'ok', lat: 1, lng: 1, createdAt: 1, hiddenFoodIds: [] },
        { id: '2' },
        null,
        'x',
      ]),
    )
    expect(listSavedPoints()).toHaveLength(1)
  })
})
