import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ForageView from '../ForageView.vue'
import type { ProduceItem } from '../../data/types'
import { addSavedPoint, listSavedPoints } from '../../composables/savedPoints'
import { foragableNow } from '../../data/season'

// foragableNow depends on data/guide.ts entries keyed by real produce ids, so
// a synthetic test item wouldn't resolve through it. The interaction being
// tested here — adding/toggling points via the food-picker dialog, and the
// map-click pick flow — doesn't depend on which foods come back, so it's
// stubbed to a fixed result instead of wiring up a real wild-harvest guide
// entry.
const testItem: ProduceItem = {
  id: 'test-fruit',
  name: 'Test Fruit',
  category: 'fruit',
  origin: { lat: 10, lng: 10, region: 'Testland' },
  story: '',
  nutrition: { per100g: { calories: 0, carbs: 0, fiber: 0, protein: 0 }, highlights: [] },
  tasteAtlasUrl: 'https://www.tasteatlas.com/test',
  commonsFile: 'Test.jpg',
}

vi.mock('../../data/season', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/season')>()
  return { ...actual, foragableNow: vi.fn(() => [testItem]) }
})

function mountView(mapClick: { lat: number; lng: number; nonce: number } | null = null) {
  return mount(ForageView, {
    props: { items: [testItem], selectedId: null, mapClick },
  })
}

describe('ForageView', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete (navigator as unknown as { geolocation?: unknown }).geolocation
    vi.mocked(foragableNow).mockReturnValue([testItem])
  })

  it('"Use my location" only centers the map — it never saves a point', async () => {
    const getCurrentPosition = vi.fn(
      (success: (pos: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 40, longitude: -70 } })
      },
    )
    ;(navigator as unknown as { geolocation: unknown }).geolocation = { getCurrentPosition }

    const wrapper = mountView()
    await wrapper.find('.use-loc').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('focus')?.at(-1)).toEqual([{ lat: 40, lng: -70 }])
    expect(listSavedPoints()).toHaveLength(0)
    expect(wrapper.find('.food-dialog').exists()).toBe(false)
  })

  it('adds a point from a city search, centers the map, and opens the food-picker dialog', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ name: 'Testville', country: 'Testland', latitude: 1, longitude: 2 }],
        }),
      }),
    )

    const wrapper = mountView()
    await wrapper.find('.loc-input').setValue('Testville')
    await wrapper.find('.loc-form').trigger('submit')
    await flushPromises()

    const points = listSavedPoints()
    expect(points).toHaveLength(1)
    expect(points[0]).toMatchObject({ label: 'Testville, Testland', lat: 1, lng: 2 })
    expect((wrapper.find('.loc-input').element as HTMLInputElement).value).toBe('')
    expect(wrapper.emitted('focus')?.at(-1)).toEqual([{ lat: 1, lng: 2 }])
    expect(wrapper.find('.food-dialog').exists()).toBe(true)
  })

  it('tapping the map while armed adds a point, centers the map, and opens the food-picker dialog', async () => {
    const wrapper = mountView()

    // A click before arming pick mode is ignored.
    await wrapper.setProps({ mapClick: { lat: 1, lng: 2, nonce: 1 } })
    expect(listSavedPoints()).toHaveLength(0)

    await wrapper.find('.pick-toggle').trigger('click')
    expect(wrapper.find('.pick-toggle').classes()).toContain('active')

    await wrapper.setProps({ mapClick: { lat: 1, lng: 2, nonce: 2 } })
    await flushPromises()

    expect(listSavedPoints()).toHaveLength(1)
    expect(listSavedPoints()[0]).toMatchObject({ lat: 1, lng: 2 })
    // One-shot: arming turns back off once a point is placed.
    expect(wrapper.find('.pick-toggle').classes()).not.toContain('active')
    expect(wrapper.emitted('focus')?.at(-1)).toEqual([{ lat: 1, lng: 2 }])
    expect(wrapper.find('.food-dialog').exists()).toBe(true)
  })

  it('picking a food in the dialog keeps the point saved after it closes', async () => {
    const wrapper = mountView()
    await wrapper.find('.pick-toggle').trigger('click')
    await wrapper.setProps({ mapClick: { lat: 1, lng: 2, nonce: 1 } })
    await flushPromises()

    expect((wrapper.find('.food-dialog .toggle input').element as HTMLInputElement).checked).toBe(false)

    await wrapper.find('.food-dialog .toggle input').setValue(true)
    await flushPromises()

    const id = listSavedPoints()[0].id
    expect(listSavedPoints()[0].visibleFoodIds).toEqual(['test-fruit'])
    expect(wrapper.emitted('markers')?.at(-1)).toEqual([
      [{ id: `${id}:test-fruit`, lat: 1, lng: 2, item: testItem }],
    ])

    await wrapper.find('.food-dialog .close').trigger('click')
    await flushPromises()

    expect(wrapper.find('.food-dialog').exists()).toBe(false)
    expect(listSavedPoints()).toHaveLength(1)
    expect(listSavedPoints()[0].visibleFoodIds).toEqual(['test-fruit'])
  })

  it('closing the dialog without picking anything discards the point', async () => {
    const wrapper = mountView()
    await wrapper.find('.pick-toggle').trigger('click')
    await wrapper.setProps({ mapClick: { lat: 1, lng: 2, nonce: 1 } })
    await flushPromises()

    expect(listSavedPoints()).toHaveLength(1)

    await wrapper.find('.food-dialog .close').trigger('click')
    await flushPromises()

    expect(wrapper.find('.food-dialog').exists()).toBe(false)
    expect(listSavedPoints()).toHaveLength(0)
  })

  it('limits the food-picker dialog to 3 results and searches by name on mobile', async () => {
    const many: ProduceItem[] = Array.from({ length: 5 }, (_, i) => ({
      ...testItem,
      id: `fruit-${i}`,
      name: `Fruit ${i}`,
    }))
    vi.mocked(foragableNow).mockReturnValue(many)
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q === '(max-width: 640px)',
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }))

    const wrapper = mountView()
    await wrapper.find('.pick-toggle').trigger('click')
    await wrapper.setProps({ mapClick: { lat: 1, lng: 2, nonce: 1 } })
    await flushPromises()

    expect(wrapper.findAll('.food-dialog .result')).toHaveLength(3)
    expect(wrapper.find('.more-hint').text()).toContain('2 more')

    await wrapper.find('.food-search').setValue('Fruit 4')
    await flushPromises()

    expect(wrapper.findAll('.food-dialog .result')).toHaveLength(1)
    expect(wrapper.find('.food-dialog .result .name').text()).toBe('Fruit 4')
    expect(wrapper.find('.more-hint').exists()).toBe(false)
  })

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountView()
    await wrapper.find('.forage-view .close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('picking a food surfaces it as "last used" for the next point, removable without affecting an existing pick', async () => {
    const wrapper = mountView()

    // Point A: tap, pick the food, close (keeping it saved).
    await wrapper.find('.pick-toggle').trigger('click')
    await wrapper.setProps({ mapClick: { lat: 1, lng: 1, nonce: 1 } })
    await flushPromises()
    expect(wrapper.findAll('.recent-chip')).toHaveLength(0)

    await wrapper.find('.food-dialog .toggle input').setValue(true)
    await flushPromises()
    const aId = listSavedPoints()[0].id
    await wrapper.find('.food-dialog .close').trigger('click')
    await flushPromises()

    // Point B: tap again elsewhere — the last-used shortcut is already there.
    await wrapper.find('.pick-toggle').trigger('click')
    await wrapper.setProps({ mapClick: { lat: 2, lng: 2, nonce: 2 } })
    await flushPromises()
    expect(wrapper.findAll('.recent-chip')).toHaveLength(1)

    await wrapper.find('.recent-pick').trigger('click')
    await flushPromises()
    const bId = listSavedPoints().find((p) => p.id !== aId)!.id
    expect(listSavedPoints().find((p) => p.id === bId)?.visibleFoodIds).toEqual(['test-fruit'])
    expect(wrapper.find('.recent-pick').classes()).toContain('picked')

    // Removing it from "last used" clears the shortcut without touching
    // either point's own pick.
    await wrapper.find('.recent-x').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.recent-chip')).toHaveLength(0)
    expect(listSavedPoints().find((p) => p.id === aId)?.visibleFoodIds).toEqual(['test-fruit'])
    expect(listSavedPoints().find((p) => p.id === bId)?.visibleFoodIds).toEqual(['test-fruit'])
  })

  it('saved points never render as a list — only as map markers', async () => {
    addSavedPoint('Existing point', 5, 5)
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.points').exists()).toBe(false)
    expect(wrapper.find('.point').exists()).toBe(false)
    expect(wrapper.find('.hint').exists()).toBe(true)
  })
})
