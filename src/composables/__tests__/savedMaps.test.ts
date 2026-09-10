import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addLocalMap, listLocalMaps, removeLocalMap } from '../savedMaps'

describe('savedMaps (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty', () => {
    expect(listLocalMaps()).toEqual([])
  })

  it('adds a map and lists it back', () => {
    const map = addLocalMap('My apples', 'item=apple&filter=fruit')
    expect(map.name).toBe('My apples')
    expect(map.query).toBe('item=apple&filter=fruit')
    expect(map.id).toBeTruthy()
    expect(map.createdAt).toBeGreaterThan(0)

    const all = listLocalMaps()
    expect(all).toHaveLength(1)
    expect(all[0]).toEqual(map)
  })

  it('lists newest first', () => {
    // Force distinct timestamps: two calls in the same millisecond would
    // otherwise tie on createdAt and make the sort order ambiguous.
    vi.useFakeTimers()
    try {
      vi.setSystemTime(1000)
      const first = addLocalMap('First', 'a=1')
      vi.setSystemTime(2000)
      const second = addLocalMap('Second', 'a=2')
      expect(listLocalMaps().map((m) => m.id)).toEqual([second.id, first.id])
    } finally {
      vi.useRealTimers()
    }
  })

  it('removes a map by id', () => {
    const first = addLocalMap('Keep me', 'a=1')
    const second = addLocalMap('Delete me', 'a=2')
    removeLocalMap(second.id)
    expect(listLocalMaps()).toEqual([first])
  })

  it('ignores malformed data already in storage', () => {
    localStorage.setItem('food-origins-map:saved-maps', '{"not":"an array"}')
    expect(listLocalMaps()).toEqual([])

    localStorage.setItem('food-origins-map:saved-maps', 'not even json')
    expect(listLocalMaps()).toEqual([])
  })

  it('filters out malformed entries within an otherwise valid array', () => {
    localStorage.setItem(
      'food-origins-map:saved-maps',
      JSON.stringify([{ id: '1', name: 'ok', query: 'q', createdAt: 1 }, { id: '2' }, null, 'x']),
    )
    expect(listLocalMaps()).toHaveLength(1)
  })
})
