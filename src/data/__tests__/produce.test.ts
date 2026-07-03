import { describe, it, expect } from 'vitest'
import { produce } from '../produce'
import { validateDataset } from '../validators'
import { CATEGORIES } from '../types'

describe('produce dataset', () => {
  it('has at least 50 items', () => {
    expect(produce.length).toBeGreaterThanOrEqual(50)
  })
  it('passes schema validation', () => {
    expect(validateDataset(produce)).toEqual([])
  })
  it('covers every category', () => {
    for (const c of CATEGORIES) {
      expect(produce.some((p) => p.category === c)).toBe(true)
    }
  })
})
