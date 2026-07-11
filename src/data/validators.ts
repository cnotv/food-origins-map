import type { ProduceItem } from './types'
import { CATEGORIES } from './types'

export const badgeImagePath = (id: string) => `/images/${id}-badge.webp`
export const heroImagePath = (id: string) => `/images/${id}-hero.webp`
export type ImagePart = 'fruit' | 'leaves' | 'seed' | 'flower'
export const partImagePath = (id: string, part: ImagePart) => `/images/${id}-${part}.webp`

export function validateDataset(items: ProduceItem[]): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const it of items) {
    if (seen.has(it.id)) errors.push(`duplicate id: ${it.id}`)
    seen.add(it.id)
    if (!it.id || !/^[a-z0-9-]+$/.test(it.id)) errors.push(`invalid id: ${it.id}`)
    if (!it.name) errors.push(`missing name for ${it.id}`)
    if (!CATEGORIES.includes(it.category)) errors.push(`bad category for ${it.id}`)
    if (it.origin.lat < -90 || it.origin.lat > 90) errors.push(`lat out of range for ${it.id}`)
    if (it.origin.lng < -180 || it.origin.lng > 180) errors.push(`lng out of range for ${it.id}`)
    if (!it.origin.region) errors.push(`missing region for ${it.id}`)
    if (!it.story) errors.push(`missing story for ${it.id}`)
    if (!it.nutrition.highlights.length) errors.push(`missing highlights for ${it.id}`)
    if (!it.tasteAtlasUrl.startsWith('https://www.tasteatlas.com/'))
      errors.push(`non-tasteatlas url for ${it.id}`)
    if (!it.commonsFile) errors.push(`missing commonsFile for ${it.id}`)
  }
  return errors
}
