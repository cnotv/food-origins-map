import type { ProduceItem } from './types'

// Where to actually cook the thing. Each entry is a well-known recipe site of
// the cuisine an item comes from, matched to the item's region of origin by
// keyword. `searchUrl` is the site's own search page with `{q}` standing in for
// the (URL-encoded) produce name, so every item links straight to that site's
// recipes for it. All sites publish in English except where `language` says
// otherwise (kept because they are the reference cookbook of their cuisine).
export interface RecipeSite {
  name: string
  cuisine: string
  url: string
  searchUrl: string
  language?: string
}

export interface RecipeLink {
  label: string
  url: string
}

// A site is used when any of its keywords appears in the item's region text.
const SITES: (RecipeSite & { keywords: string[] })[] = [
  {
    keywords: ['japan'],
    name: 'Just One Cookbook',
    cuisine: 'Japanese',
    url: 'https://www.justonecookbook.com/',
    searchUrl: 'https://www.justonecookbook.com/?s={q}',
  },
  {
    keywords: ['korea'],
    name: 'Maangchi',
    cuisine: 'Korean',
    url: 'https://www.maangchi.com/',
    searchUrl: 'https://www.maangchi.com/?s={q}',
  },
  {
    keywords: ['china', 'chinese', 'yangtze', 'yunnan', 'sichuan'],
    name: 'The Woks of Life',
    cuisine: 'Chinese',
    url: 'https://thewoksoflife.com/',
    searchUrl: 'https://thewoksoflife.com/?s={q}',
  },
  {
    keywords: ['india', 'indian', 'himalaya', 'ghats', 'malabar', 'sri lanka'],
    name: 'Indian Healthy Recipes',
    cuisine: 'Indian',
    url: 'https://www.indianhealthyrecipes.com/',
    searchUrl: 'https://www.indianhealthyrecipes.com/?s={q}',
  },
  {
    keywords: ['thailand', 'thai', 'indochina', 'mainland southeast asia'],
    name: 'Hot Thai Kitchen',
    cuisine: 'Thai',
    url: 'https://hot-thai-kitchen.com/',
    searchUrl: 'https://hot-thai-kitchen.com/?s={q}',
  },
  {
    keywords: ['philippin'],
    name: 'Panlasang Pinoy',
    cuisine: 'Filipino',
    url: 'https://panlasangpinoy.com/',
    searchUrl: 'https://panlasangpinoy.com/?s={q}',
  },
  {
    keywords: ['indonesia', 'java', 'malay', 'maritime southeast asia', 'moluccas', 'banda', 'borneo', 'sumatra', 'sulawesi'],
    name: 'Daily Cooking Quest',
    cuisine: 'Indonesian & Malaysian',
    url: 'https://dailycookingquest.com/',
    searchUrl: 'https://dailycookingquest.com/?s={q}',
  },
  {
    keywords: ['southeast asia', 'vietnam', 'new guinea'],
    name: 'Hot Thai Kitchen',
    cuisine: 'Southeast Asian',
    url: 'https://hot-thai-kitchen.com/',
    searchUrl: 'https://hot-thai-kitchen.com/?s={q}',
  },
  {
    keywords: ['mexic', 'mesoamerica', 'yucat', 'balsas', 'central america'],
    name: 'Mexico in My Kitchen',
    cuisine: 'Mexican',
    url: 'https://www.mexicoinmykitchen.com/',
    searchUrl: 'https://www.mexicoinmykitchen.com/?s={q}',
  },
  {
    keywords: ['andes', 'peru', 'bolivia', 'altiplano'],
    name: 'Eat Peru',
    cuisine: 'Peruvian & Andean',
    url: 'https://www.eatperu.com/',
    searchUrl: 'https://www.eatperu.com/?s={q}',
  },
  {
    keywords: ['brazil', 'amazon', 'cerrado', 'paraguay', 'guiana'],
    name: 'Brazilian Kitchen Abroad',
    cuisine: 'Brazilian',
    url: 'https://braziliankitchenabroad.com/',
    searchUrl: 'https://braziliankitchenabroad.com/?s={q}',
  },
  {
    keywords: ['caribbean', 'antilles', 'west indies'],
    name: 'The Caribbean Pot',
    cuisine: 'Caribbean',
    url: 'https://caribbeanpot.com/',
    searchUrl: 'https://caribbeanpot.com/?s={q}',
  },
  {
    keywords: ['africa', 'sahel', 'ethiopia', 'nigeria', 'kalahari', 'madagascar'],
    name: 'Chef Lola’s Kitchen',
    cuisine: 'West African',
    url: 'https://cheflolaskitchen.com/',
    searchUrl: 'https://cheflolaskitchen.com/?s={q}',
  },
  {
    keywords: ['levant', 'fertile crescent', 'mesopotamia', 'near east', 'arabia', 'syria', 'egypt', 'nile', 'western asia'],
    name: 'The Mediterranean Dish',
    cuisine: 'Middle Eastern & Mediterranean',
    url: 'https://www.themediterraneandish.com/',
    searchUrl: 'https://www.themediterraneandish.com/?s={q}',
  },
  {
    keywords: ['persia', 'iran', 'afghan', 'central asia'],
    name: 'Persian Mama',
    cuisine: 'Persian',
    url: 'https://persianmama.com/',
    searchUrl: 'https://persianmama.com/?s={q}',
  },
  {
    keywords: ['anatolia', 'turkey', 'caucasus', 'black sea'],
    name: 'Ozlem’s Turkish Table',
    cuisine: 'Turkish',
    url: 'https://ozlemsturkishtable.com/',
    searchUrl: 'https://ozlemsturkishtable.com/?s={q}',
  },
  {
    keywords: ['greece', 'greek', 'aegean', 'balkan'],
    name: 'My Greek Dish',
    cuisine: 'Greek',
    url: 'https://www.mygreekdish.com/',
    searchUrl: 'https://www.mygreekdish.com/?s={q}',
  },
  {
    keywords: ['italy', 'italian', 'sicily', 'apennine'],
    name: 'Giallo Zafferano',
    cuisine: 'Italian',
    url: 'https://www.giallozafferano.it/',
    searchUrl: 'https://www.giallozafferano.it/ricerca-ricette/{q}/',
    language: 'Italian',
  },
  {
    keywords: ['iberia', 'spain', 'spanish', 'portugal'],
    name: 'Spanish Sabores',
    cuisine: 'Spanish',
    url: 'https://spanishsabores.com/',
    searchUrl: 'https://spanishsabores.com/?s={q}',
  },
  {
    keywords: ['mediterranean'],
    name: 'The Mediterranean Dish',
    cuisine: 'Mediterranean',
    url: 'https://www.themediterraneandish.com/',
    searchUrl: 'https://www.themediterraneandish.com/?s={q}',
  },
  {
    keywords: ['north america', 'united states', 'great plains', 'appalach', 'pacific northwest', 'california'],
    name: 'Allrecipes',
    cuisine: 'North American',
    url: 'https://www.allrecipes.com/',
    searchUrl: 'https://www.allrecipes.com/search?q={q}',
  },
  {
    keywords: ['australia', 'oceania', 'pacific', 'new zealand'],
    name: 'RecipeTin Eats',
    cuisine: 'Australian',
    url: 'https://www.recipetineats.com/',
    searchUrl: 'https://www.recipetineats.com/?s={q}',
  },
]

// Always offered, so every item has at least one place to cook it from.
const GLOBAL: RecipeSite = {
  name: 'BBC Good Food',
  cuisine: 'International',
  url: 'https://www.bbcgoodfood.com/',
  searchUrl: 'https://www.bbcgoodfood.com/search?q={q}',
}

// The recipe sites of the cuisines an item's region of origin belongs to
// (at most two), followed by the international fallback.
export function recipeSitesFor(region: string): RecipeSite[] {
  const text = region.toLowerCase()
  const sites: RecipeSite[] = []
  for (const { keywords, ...site } of SITES) {
    if (!keywords.some((k) => text.includes(k))) continue
    if (sites.some((s) => s.url === site.url)) continue
    sites.push(site)
    if (sites.length === 2) break
  }
  sites.push(GLOBAL)
  return sites
}

// Drop any parenthetical so "Maize (Corn)" searches as "Maize".
const searchTerm = (name: string) => name.replace(/\s*\(.*?\)/g, '').trim()

// Direct links to recipes for this item on the recipe sites of its origin.
export function recipeLinks(item: Pick<ProduceItem, 'name' | 'origin'>): RecipeLink[] {
  const q = encodeURIComponent(searchTerm(item.name))
  return recipeSitesFor(item.origin.region).map((site) => ({
    label: site.language
      ? `${site.name} — ${site.cuisine} recipes (in ${site.language})`
      : `${site.name} — ${site.cuisine} recipes`,
    url: site.searchUrl.replace('{q}', q),
  }))
}
