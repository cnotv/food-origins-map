import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { produce } from '../data/produce'

describe('App integration', () => {
  it('renders header title and filter chips', () => {
    const w = mount(App)
    expect(w.text()).toContain('Food Origins Map')
    expect(w.findAll('button.chip').length).toBe(5)
  })
  it('filtering to fruits reduces the item count passed to the map', async () => {
    const w = mount(App)
    const chips = w.findAll('button.chip')
    const fruitChip = chips.find((c) => c.text() === 'Fruits')!
    await fruitChip.trigger('click')
    const map = w.findComponent({ name: 'WorldMap' })
    const passed = map.props('items') as typeof produce
    expect(passed.length).toBeLessThan(produce.length)
    expect(passed.every((p) => p.category === 'fruit')).toBe(true)
  })
  it('selecting an item opens the side panel; close hides it', async () => {
    const w = mount(App)
    const map = w.findComponent({ name: 'WorldMap' })
    map.vm.$emit('select', produce[0])
    await w.vm.$nextTick()
    expect(w.find('.side-panel').exists()).toBe(true)
    await w.find('button.close').trigger('click')
    expect(w.find('.side-panel').exists()).toBe(false)
  })
})
