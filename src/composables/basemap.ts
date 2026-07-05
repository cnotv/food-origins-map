import L from 'leaflet'

// Label-free CARTO basemaps, one per colour scheme. The markers carry the
// meaning, so we want faint land/sea shapes only.
const LIGHT = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
const DARK = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'

// Adds a tile layer that follows the OS light/dark setting and swaps live when
// it changes. Returns a cleanup that detaches the media-query listener.
export function addBasemap(map: L.Map, opts: L.TileLayerOptions = {}): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const url = () => (mq.matches ? DARK : LIGHT)
  const layer = L.tileLayer(url(), opts).addTo(map)
  const onChange = () => layer.setUrl(url())
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}
