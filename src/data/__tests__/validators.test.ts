import { describe, it, expect } from 'vitest'
import { validateDataset, badgeImagePath, heroImagePath } from '../validators'
import type { ProduceItem } from '../types'

const good: ProduceItem = {
  id: 'tomato',
  name: 'Tomato',
  category: 'fruit',
  origin: { lat: -12, lng: -77, region: 'Andes' },
  story: 'A short story.',
  nutrition: { per100g: { calories: 18, carbs: 3.9, fiber: 1.2, protein: 0.9 }, highlights: ['Lycopene'] },
  tasteAtlasUrl: 'https://www.tasteatlas.com/tomato',
  commonsFile: 'Tomato.jpg',
}

describe('validators', () => {
  it('accepts a valid dataset', () => {
    expect(validateDataset([good])).toEqual([])
  })
  it('rejects duplicate ids', () => {
    expect(validateDataset([good, good]).join()).toMatch(/duplicate/i)
  })
  it('rejects out-of-range coordinates', () => {
    const bad = { ...good, id: 'x', origin: { ...good.origin, lat: 999 } }
    expect(validateDataset([bad]).join()).toMatch(/lat/i)
  })
  it('rejects non-tasteatlas urls', () => {
    const bad = { ...good, id: 'y', tasteAtlasUrl: 'https://example.com' }
    expect(validateDataset([bad]).join()).toMatch(/tasteatlas/i)
  })
  it('derives image paths', () => {
    expect(badgeImagePath('tomato')).toBe('/images/tomato-badge.webp')
    expect(heroImagePath('tomato')).toBe('/images/tomato-hero.webp')
  })
})
