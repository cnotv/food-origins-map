import type { ProduceItem } from './types'
import { getFieldGuide } from './guide'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

// Biogeographic realms — the standard way ecologists divide the land by which
// plants and animals share a history. A location and an item are each mapped to
// a realm from their coordinates; a wild food is only offered where its realm
// matches. This is the "preset" that makes Potsdam → Palearctic (Europe +
// temperate Asia + North Africa) rather than "anything in a northern summer".
export type Realm =
  | 'palearctic'
  | 'nearctic'
  | 'neotropical'
  | 'afrotropical'
  | 'indomalayan'
  | 'australasian'

export const REALM_LABEL: Record<Realm, string> = {
  palearctic: 'Europe, North Africa & temperate Asia',
  nearctic: 'North America',
  neotropical: 'Central & South America',
  afrotropical: 'Sub-Saharan Africa',
  indomalayan: 'South & Southeast Asia',
  australasian: 'Australia & the Pacific',
}

// Classify a coordinate into a realm using coarse boundaries. Approximate by
// design — it captures which landmass/climate belt a point belongs to.
export function classifyRealm(lat: number, lng: number): Realm {
  // The Americas.
  if (lng <= -30) return lat >= 23 ? 'nearctic' : 'neotropical'
  // Australia, New Zealand and the south-west Pacific.
  if (lng >= 110 && lat <= -10) return 'australasian'
  // Sub-Saharan Africa.
  if (lng >= -20 && lng <= 55 && lat < 15 && lat > -40) return 'afrotropical'
  // Tropical South and Southeast Asia.
  if (lng >= 68 && lat < 28 && lat > -11) return 'indomalayan'
  // Everything else in the Old World: Europe, North Africa, temperate Asia.
  return 'palearctic'
}

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

// Items that can be foraged in the wild (have foraging notes), are native to
// the location's biogeographic realm, and are in season there right now.
export function foragableNow(
  items: ProduceItem[],
  lat: number,
  lng: number,
  date: Date = new Date(),
) {
  const season = currentSeasonForLat(lat, date)
  const realm = classifyRealm(lat, lng)
  return items
    .filter((it) => {
      const guide = getFieldGuide(it.id)
      if (!guide?.wild) return false
      if (classifyRealm(it.origin.lat, it.origin.lng) !== realm) return false
      return parseSeasons(guide.harvestSeason).has(season)
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
