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

export const CATEGORIES: Category[] = ['fruit', 'vegetable', 'legume', 'herb-spice']
