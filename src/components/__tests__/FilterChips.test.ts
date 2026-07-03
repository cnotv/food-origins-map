import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterChips from '../FilterChips.vue'

describe('FilterChips', () => {
  it('renders all + 4 category chips', () => {
    const w = mount(FilterChips, { props: { active: 'all' } })
    expect(w.findAll('button.chip').length).toBe(5)
  })
  it('emits change with the clicked category', async () => {
    const w = mount(FilterChips, { props: { active: 'all' } })
    await w.findAll('button.chip')[1].trigger('click')
    expect(w.emitted('change')?.[0]?.[0]).toBeTruthy()
  })
})
