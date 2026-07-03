import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SidePanel from '../SidePanel.vue'
import type { ProduceItem } from '../../data/types'

const item: ProduceItem = {
  id: 'tomato',
  name: 'Tomato',
  category: 'fruit',
  origin: { lat: -12, lng: -77, region: 'Andes' },
  story: 'A tomato story.',
  nutrition: { per100g: { calories: 18, carbs: 3.9, fiber: 1.2, protein: 0.9 }, highlights: ['Lycopene'] },
  tasteAtlasUrl: 'https://www.tasteatlas.com/tomato',
  commonsFile: 'Tomato.jpg',
}

describe('SidePanel', () => {
  it('renders nothing when item is null', () => {
    const w = mount(SidePanel, { props: { item: null } })
    expect(w.find('.side-panel').exists()).toBe(false)
  })
  it('renders all sections for an item', () => {
    const w = mount(SidePanel, { props: { item } })
    expect(w.text()).toContain('Tomato')
    expect(w.text()).toContain('Andes')
    expect(w.text()).toContain('A tomato story.')
    expect(w.text()).toContain('Lycopene')
    const link = w.find('a.recipes-link')
    expect(link.attributes('href')).toBe('https://www.tasteatlas.com/tomato')
    expect(link.attributes('target')).toBe('_blank')
  })
  it('emits close when the close button is clicked', async () => {
    const w = mount(SidePanel, { props: { item } })
    await w.find('button.close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
