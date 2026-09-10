import { describe, it, expect } from 'vitest'
import { produce } from '../produce'
import { getFieldGuide } from '../guide'
import { regionalRecipes } from '../recipes'
import { recipeLinks, recipeSitesFor } from '../recipe-sites'

describe('recipes', () => {
  it('documents recipes for every item on the map', () => {
    const missing = produce.filter((p) => !getFieldGuide(p.id)?.recipes?.length)
    expect(missing.map((p) => p.id)).toEqual([])
  })
  it('has non-empty recipe strings', () => {
    for (const [id, recipes] of Object.entries(regionalRecipes)) {
      expect(recipes.length, id).toBeGreaterThan(0)
      for (const r of recipes) expect(r.trim(), id).not.toBe('')
    }
  })
  it('only keys recipes by ids in the dataset', () => {
    const ids = new Set(produce.map((p) => p.id))
    expect(Object.keys(regionalRecipes).filter((id) => !ids.has(id))).toEqual([])
  })
})

describe('recipe sites', () => {
  it('matches a cuisine site to the region of origin', () => {
    expect(recipeSitesFor('Japan')[0].name).toBe('Just One Cookbook')
    expect(recipeSitesFor('Yangtze basin, China')[0].name).toBe('The Woks of Life')
    expect(recipeSitesFor('Southern Italy & Sicily')[0].name).toBe('Giallo Zafferano')
  })
  it('always offers at least one site, with https search links', () => {
    for (const item of produce) {
      const links = recipeLinks(item)
      expect(links.length, item.id).toBeGreaterThan(0)
      for (const l of links) {
        expect(l.url.startsWith('https://'), item.id).toBe(true)
        expect(l.url).not.toContain('{q}')
        expect(l.label).not.toBe('')
      }
    }
  })
  it('searches the site for the item name, without any parenthetical', () => {
    const links = recipeLinks({ name: 'Maize (Corn)', origin: { lat: 0, lng: 0, region: 'Mesoamerica' } })
    expect(links[0].url).toBe('https://www.mexicoinmykitchen.com/?s=Maize')
    expect(links.at(-1)!.url).toBe('https://www.bbcgoodfood.com/search?q=Maize')
  })
})
