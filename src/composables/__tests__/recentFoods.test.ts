import { beforeEach, describe, expect, it } from 'vitest'
import { listRecentFoods, pushRecentFood, removeRecentFood } from '../recentFoods'

describe('recentFoods (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty', () => {
    expect(listRecentFoods()).toEqual([])
  })

  it('pushes a food to the front', () => {
    pushRecentFood('apple')
    pushRecentFood('pear')
    expect(listRecentFoods()).toEqual(['pear', 'apple'])
  })

  it('moves a re-picked food back to the front instead of duplicating it', () => {
    pushRecentFood('apple')
    pushRecentFood('pear')
    pushRecentFood('apple')
    expect(listRecentFoods()).toEqual(['apple', 'pear'])
  })

  it('caps the list at 8 entries, dropping the oldest', () => {
    for (let i = 0; i < 10; i++) pushRecentFood(`food-${i}`)
    const ids = listRecentFoods()
    expect(ids).toHaveLength(8)
    expect(ids[0]).toBe('food-9')
    expect(ids).not.toContain('food-0')
    expect(ids).not.toContain('food-1')
  })

  it('removes a food from the list', () => {
    pushRecentFood('apple')
    pushRecentFood('pear')
    removeRecentFood('apple')
    expect(listRecentFoods()).toEqual(['pear'])
  })

  it('ignores malformed data already in storage', () => {
    localStorage.setItem('food-origins-map:recent-foods', '{"not":"an array"}')
    expect(listRecentFoods()).toEqual([])
    localStorage.setItem('food-origins-map:recent-foods', 'not even json')
    expect(listRecentFoods()).toEqual([])
  })
})
