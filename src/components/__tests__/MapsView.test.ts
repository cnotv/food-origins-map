import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import MapsView from '../MapsView.vue'
import { listLocalMaps } from '../../composables/savedMaps'

// This file exercises the default (no Firebase env vars) path, where
// isFirebaseConfigured is false and saved maps go to localStorage. The
// signed-in/cloud path is covered separately in MapsView.cloud.test.ts,
// which mocks lib/firebase + useGoogleAuth + cloudMaps — those mocks must
// live in their own module-level file rather than nested in a describe here,
// since vi.mock is hoisted per-file and would otherwise affect these tests too.

describe('MapsView (no Firebase configured)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the localStorage-only hint and no sign-in button', () => {
    const wrapper = mount(MapsView, { props: { currentQuery: '' } })
    expect(wrapper.text()).toContain('stored in this browser only')
    expect(wrapper.find('.signin').exists()).toBe(false)
  })

  it('lists no maps initially', () => {
    const wrapper = mount(MapsView, { props: { currentQuery: '' } })
    expect(wrapper.find('.empty').exists()).toBe(true)
  })

  it('saves the current query under the entered name, to localStorage', async () => {
    const wrapper = mount(MapsView, { props: { currentQuery: 'item=apple&filter=fruit' } })
    await wrapper.find('.save-input').setValue('My apples')
    await wrapper.find('.save-form').trigger('submit')
    await flushPromises()

    expect(wrapper.findAll('.map-row')).toHaveLength(1)
    expect(wrapper.find('.load .name').text()).toBe('My apples')
    expect(listLocalMaps()).toHaveLength(1)
    expect(listLocalMaps()[0].query).toBe('item=apple&filter=fruit')
    // The input clears after a successful save.
    expect((wrapper.find('.save-input').element as HTMLInputElement).value).toBe('')
  })

  it('does not save a blank name', async () => {
    const wrapper = mount(MapsView, { props: { currentQuery: 'x=1' } })
    await wrapper.find('.save-form').trigger('submit')
    await flushPromises()
    expect(listLocalMaps()).toHaveLength(0)
  })

  it('emits load with the saved query when a row is clicked', async () => {
    const wrapper = mount(MapsView, { props: { currentQuery: 'item=apple' } })
    await wrapper.find('.save-input').setValue('My apples')
    await wrapper.find('.save-form').trigger('submit')
    await flushPromises()

    await wrapper.find('.load').trigger('click')
    expect(wrapper.emitted('load')).toEqual([['item=apple']])
  })

  it('deletes a saved map', async () => {
    const wrapper = mount(MapsView, { props: { currentQuery: 'x=1' } })
    await wrapper.find('.save-input').setValue('Gone soon')
    await wrapper.find('.save-form').trigger('submit')
    await flushPromises()
    expect(wrapper.findAll('.map-row')).toHaveLength(1)

    await wrapper.find('.delete').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.map-row')).toHaveLength(0)
    expect(listLocalMaps()).toHaveLength(0)
  })

  it('emits close when the close button is clicked', async () => {
    const wrapper = mount(MapsView, { props: { currentQuery: '' } })
    await wrapper.find('.close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
