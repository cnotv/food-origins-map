export type Category = 'fruit' | 'vegetable' | 'legume' | 'herb-spice'

export interface ProduceItem {
  id: string
  name: string
  category: Category
  origin: { lat: number; lng: number; region: string }
  story: string
  nutrition: {
    per100g: { calories: number; carbs: number; fiber: number; protein: number }
    highlights: string[]
  }
  tasteAtlasUrl: string
  commonsFile: string
}

// Wild-foraging notes for produce that still grows (and can be gathered) in
// the wild. Absent for fully domesticated crops with no harvestable wild form.
export interface WildHarvest {
  where: string // habitat and geographic range where it can be found
  identification: string // what the wild plant/fruit looks like when foraging
}

// Compact field-guide summary shown alongside each item.
export interface FieldGuide {
  harvestSeason: string // when it is gathered/ripe (Northern Hemisphere unless noted)
  source: 'farmed' | 'wild' | 'both' // cultivated, foraged, or both
  raw: 'yes' | 'no' | 'caution' // can the edible part be eaten raw
  sideEffects: string // notable cautions, or 'None notable'
  wild?: WildHarvest // present only when it can be foraged
  recipes?: string[] // brief classic ways it is eaten/prepared
  varieties?: string[] // well-known varieties or close relatives
}

export const CATEGORIES: Category[] = ['fruit', 'vegetable', 'legume', 'herb-spice']
