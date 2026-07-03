import { describe, it, expect } from 'vitest'
import { buildMarkerHtml, categoryColor } from '../WorldMap.vue'
import type { ProduceItem } from '../../data/types'

const item = { id: 'tomato', name: 'Tomato', category: 'fruit' } as ProduceItem

describe('WorldMap marker helpers', () => {
  it('builds badge html referencing the derived image path', () => {
    const html = buildMarkerHtml(item)
    expect(html).toContain('/images/tomato-badge.webp')
    expect(html).toContain('Tomato')
  })
  it('includes a fallback initial for onerror', () => {
    expect(buildMarkerHtml(item)).toMatch(/onerror/)
    expect(buildMarkerHtml(item)).toContain('>T<')
  })
  it('maps each category to a color', () => {
    expect(categoryColor('fruit')).toMatch(/^#/)
    expect(categoryColor('vegetable')).not.toBe(categoryColor('fruit'))
  })
})
