import type { ProduceItem } from './types'
import { getFieldGuide } from './guide'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

const OPPOSITE: Record<Season, Season> = {
  spring: 'autumn',
  autumn: 'spring',
  summer: 'winter',
  winter: 'summer',
}

// Parse a free-text harvest season (e.g. "Late summer to autumn") into the set
// of seasons it covers. "Year-round" counts as every season.
export function parseSeasons(text: string | undefined): Set<Season> {
  const out = new Set<Season>()
  if (!text) return out
  const t = text.toLowerCase()
  if (t.includes('year-round') || t.includes('year round')) {
    return new Set<Season>(['spring', 'summer', 'autumn', 'winter'])
  }
  if (t.includes('spring')) out.add('spring')
  if (t.includes('summer')) out.add('summer')
  if (t.includes('autumn') || t.includes('fall')) out.add('autumn')
  if (t.includes('winter')) out.add('winter')
  return out
}

// The current meteorological season at a given latitude. Southern-hemisphere
// latitudes flip the northern season. Tropics are approximated by hemisphere.
export function currentSeasonForLat(lat: number, date: Date = new Date()): Season {
  const m = date.getMonth() // 0-11
  let north: Season
  if (m >= 2 && m <= 4) north = 'spring'
  else if (m >= 5 && m <= 7) north = 'summer'
  else if (m >= 8 && m <= 10) north = 'autumn'
  else north = 'winter'
  return lat < 0 ? OPPOSITE[north] : north
}

export const hemisphere = (lat: number) => (lat < 0 ? 'Southern' : 'Northern')

// Items that can be foraged in the wild (have foraging notes) and are in season
// for the given latitude right now, sorted by name.
export function foragableNow(items: ProduceItem[], lat: number, date: Date = new Date()) {
  const season = currentSeasonForLat(lat, date)
  return items
    .filter((it) => {
      const guide = getFieldGuide(it.id)
      return !!guide?.wild && parseSeasons(guide.harvestSeason).has(season)
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
