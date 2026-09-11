import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ForageView from '../ForageView.vue'
import type { ProduceItem } from '../../data/types'
import { addSavedPoint, listSavedPoints } from '../../composables/savedPoints'

// foragableNow depends on data/guide.ts entries keyed by real produce ids, so
// a synthetic test item wouldn't resolve through it. The interaction being
// tested here — adding/toggling/removing points, and the map-click pick
// flow — doesn't depend on which foods come back, so it's stubbed to a fixed
// result instead of wiring up a real wild-harvest guide entry.
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
  })

  it('adds a point via "Use my location", showing nothing on the map until a food is picked', async () => {
    const getCurrentPosition = vi.fn(
      (success: (pos: { coords: { latitude: number; longitude: number } }) => void) => {
        success({ coords: { latitude: 40, longitude: -70 } })
      },
    )
    ;(navigator as unknown as { geolocation: unknown }).geolocation = { getCurrentPosition }
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable in test')))

    const wrapper = mountView()
    await wrapper.find('.use-loc').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.point')).toHaveLength(1)
    const points = listSavedPoints()
    expect(points).toHaveLength(1)
    expect(points[0]).toMatchObject({ lat: 40, lng: -70, visibleFoodIds: [] })

    expect(wrapper.emitted('focus')?.at(-1)).toEqual([{ lat: 40, lng: -70 }])
    // Nothing is shown on the map for a fresh point — the visitor picks per food.
    expect(wrapper.emitted('markers')?.at(-1)).toEqual([[]])
    expect((wrapper.find('.toggle input').element as HTMLInputElement).checked).toBe(false)

    await wrapper.find('.toggle input').setValue(true)
    await flushPromises()
    expect(wrapper.emitted('markers')?.at(-1)).toEqual([
      [{ id: `${points[0].id}:test-fruit`, lat: 40, lng: -70, item: testItem }],
    ])
  })

  it('adds a point from a city search', async () => {
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
  })

  it('toggles a food on the map, and back off, without removing it from the list', async () => {
    addSavedPoint('Test point', 5, 5)
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.findAll('.result')).toHaveLength(1)
    const checkbox = wrapper.find('.toggle input')
    // Nothing shown by default — picking a food is opt-in.
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)

    await checkbox.setValue(true)
    await flushPromises()

    expect(wrapper.findAll('.result')).toHaveLength(1)
    expect((wrapper.find('.toggle input').element as HTMLInputElement).checked).toBe(true)
    expect(listSavedPoints()[0].visibleFoodIds).toEqual(['test-fruit'])
    expect(wrapper.emitted('markers')?.at(-1)).toEqual([
      [{ id: `${listSavedPoints()[0].id}:test-fruit`, lat: 5, lng: 5, item: testItem }],
    ])

    await wrapper.find('.toggle input').setValue(false)
    await flushPromises()

    // Still in the list — only hidden from the map.
    expect(wrapper.findAll('.result')).toHaveLength(1)
    expect(listSavedPoints()[0].visibleFoodIds).toEqual([])
    expect(wrapper.emitted('markers')?.at(-1)).toEqual([[]])
  })

  it('removes a point', async () => {
    addSavedPoint('Test point', 5, 5)
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.findAll('.point')).toHaveLength(1)

    await wrapper.find('.remove-point').trigger('click')

    expect(wrapper.findAll('.point')).toHaveLength(0)
    expect(listSavedPoints()).toHaveLength(0)
  })

  it('only adds a point from a relayed map click while pick mode is armed, then disarms', async () => {
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
  })

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountView()
    await wrapper.find('.close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('picking a food surfaces it as "last used" on every point, removable without affecting the pick', async () => {
    const a = addSavedPoint('Point A', 1, 1)
    const b = addSavedPoint('Point B', 2, 2)
    const wrapper = mountView()
    await flushPromises()

    // No last-used shortlist yet.
    expect(wrapper.findAll('.recent-chip')).toHaveLength(0)

    // Pick it for point A.
    const pointCards = wrapper.findAll('.point')
    await pointCards[0].find('.toggle input').setValue(true)
    await flushPromises()

    // Both point cards now offer it as a "last used" shortcut.
    expect(wrapper.findAll('.recent-chip')).toHaveLength(2)

    // Picking it from point B's shortcut toggles it on there too.
    const bCard = wrapper.findAll('.point')[1]
    await bCard.find('.recent-pick').trigger('click')
    await flushPromises()
    expect(listSavedPoints().find((p) => p.id === b.id)?.visibleFoodIds).toEqual(['test-fruit'])
    expect(bCard.find('.recent-pick').classes()).toContain('picked')

    // Removing it from "last used" clears the shortcut everywhere without
    // touching either point's own selection.
    await wrapper.find('.recent-x').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.recent-chip')).toHaveLength(0)
    expect(listSavedPoints().find((p) => p.id === a.id)?.visibleFoodIds).toEqual(['test-fruit'])
    expect(listSavedPoints().find((p) => p.id === b.id)?.visibleFoodIds).toEqual(['test-fruit'])
  })
})
