import { describe, it, expect } from 'vitest'
import { buildDotHtml, buildMarkerHtml, categoryColor } from '../WorldMap.vue'
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

describe('buildDotHtml (forage markers)', () => {
  it('colors the dot with the given color', () => {
    expect(buildDotHtml(categoryColor('fruit'))).toContain(categoryColor('fruit'))
  })
  it('shows no count badge for a single food', () => {
    expect(buildDotHtml(categoryColor('fruit'))).not.toContain('forage-dot-count')
    expect(buildDotHtml(categoryColor('fruit'), 1)).not.toContain('forage-dot-count')
  })
  it('shows a count badge when more than one food shares the point', () => {
    const html = buildDotHtml(categoryColor('fruit'), 3)
    expect(html).toContain('forage-dot-count')
    expect(html).toContain('>3<')
  })
})
