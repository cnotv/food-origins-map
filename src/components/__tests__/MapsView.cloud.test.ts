import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import MapsView from '../MapsView.vue'
import { listLocalMaps } from '../../composables/savedMaps'

// Simulates a deployment with Firebase configured and a signed-in user, so
// the Maps panel reads/writes Firestore (via composables/cloudMaps) instead
// of localStorage. These mocks must be declared at module top level — they
// are hoisted above the imports by Vitest, so this scenario is kept in its
// own file rather than nested in a describe alongside the unconfigured path.
const mockUser = { uid: 'u1', displayName: 'Ada', email: 'ada@example.com', photoURL: null }

vi.mock('../../lib/firebase', () => ({
  isFirebaseConfigured: true,
}))
vi.mock('../../composables/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    user: ref(mockUser),
    busy: ref(false),
    error: ref(''),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}))
vi.mock('../../composables/cloudMaps', () => ({
  listCloudMaps: vi.fn().mockResolvedValue([]),
  addCloudMap: vi.fn(async (uid: string, name: string, query: string) => ({
    id: 'cloud-1',
    name,
    query,
    createdAt: 1,
  })),
  removeCloudMap: vi.fn().mockResolvedValue(undefined),
}))

describe('MapsView (signed in with Google)', () => {
  it('shows the signed-in user instead of the localStorage hint', async () => {
    const wrapper = mount(MapsView, { props: { currentQuery: '' } })
    await flushPromises()
    expect(wrapper.text()).toContain('Ada')
    expect(wrapper.text()).not.toContain('stored in this browser only')
  })

  it('saves to the cloud store instead of localStorage', async () => {
    localStorage.clear()
    const wrapper = mount(MapsView, { props: { currentQuery: 'item=pear' } })
    await flushPromises()

    await wrapper.find('.save-input').setValue('Cloud map')
    await wrapper.find('.save-form').trigger('submit')
    await flushPromises()

    expect(wrapper.findAll('.map-row')).toHaveLength(1)
    expect(wrapper.find('.load .name').text()).toBe('Cloud map')
    // Signed-in saves must not fall back to localStorage.
    expect(listLocalMaps()).toHaveLength(0)

    const { addCloudMap } = await import('../../composables/cloudMaps')
    expect(addCloudMap).toHaveBeenCalledWith('u1', 'Cloud map', 'item=pear')
  })
})
