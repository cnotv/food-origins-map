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
  it('colors the dot by category', () => {
    expect(buildDotHtml(item)).toContain(categoryColor('fruit'))
  })
  it('defaults to no pixel offset', () => {
    const html = buildDotHtml(item)
    expect(html).toContain('left:14px')
    expect(html).toContain('top:14px')
  })
  it('applies a given pixel offset relative to the icon box center', () => {
    const html = buildDotHtml(item, 5, -3)
    expect(html).toContain('left:19px')
    expect(html).toContain('top:11px')
  })
})
