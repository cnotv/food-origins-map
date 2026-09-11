// jsdom doesn't implement these browser APIs that our components use on mount
// (ResizeObserver for the chip scroller / maps, matchMedia for the dark-mode
// basemap). Provide minimal no-op shims so component mounts don't throw.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub

// jsdom doesn't implement scrollIntoView either (ForageView scrolls a newly
// created point's card into view).
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

// Leaflet's vector renderer can't run in jsdom, so stub the map components when
// a test mounts something that embeds them.
import { config } from '@vue/test-utils'
config.global.stubs = { MiniMap: true, WorldMap: true }
