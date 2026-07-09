// Approximate bounding boxes for the geographic regions named in item origin
// text, so the locator map can frame the whole described area (e.g. "Europe &
// western Asia") instead of just a radius around the single origin point.
//
// Each entry is [south, west, north, east]. Order matters only for readability;
// matching scans the whole region string for every keyword.

export type Bounds = [number, number, number, number]

const REGIONS: { keywords: string[]; box: Bounds }[] = [
  { keywords: ['europe', 'mediterranean', 'anatolia', 'balkan', 'iberian', 'caucasus'], box: [34, -10, 60, 45] },
  { keywords: ['western asia', 'near east', 'levant', 'fertile crescent', 'mesopotamia', 'arabia'], box: [22, 33, 42, 60] },
  { keywords: ['persia', 'iran', 'iranian', 'afghanistan'], box: [25, 44, 40, 66] },
  { keywords: ['central asia', 'kazakh', 'kyrgyz', 'tian shan', 'uzbek', 'turkmen'], box: [35, 55, 50, 82] },
  { keywords: ['china', 'chinese', 'yangtze', 'yunnan'], box: [20, 100, 45, 125] },
  { keywords: ['east asia', 'korea', 'japan'], box: [30, 120, 46, 146] },
  { keywords: ['himalaya', 'india', 'indian', 'subcontinent', 'malabar', 'ghats'], box: [8, 68, 35, 92] },
  { keywords: ['southeast asia', 'indochina', 'malay', 'indonesia', 'new guinea', 'thailand', 'vietnam'], box: [-10, 92, 25, 145] },
  { keywords: ['north america', 'mexico', 'mesoamerica', 'balsas', 'appalach'], box: [12, -122, 52, -70] },
  { keywords: ['central america', 'caribbean'], box: [7, -92, 22, -60] },
  { keywords: ['south america', 'andes', 'amazon', 'brazil', 'peru', 'bolivia', 'paraguay', 'cerrado', 'altiplano'], box: [-40, -82, 12, -34] },
  { keywords: ['africa', 'sahel', 'ethiopia', 'nigeria', 'west african', 'sub-saharan'], box: [-35, -18, 20, 52] },
  { keywords: ['north africa', 'maghreb', 'egypt', 'nile'], box: [20, -10, 37, 40] },
  { keywords: ['oceania', 'australia', 'pacific'], box: [-40, 112, -8, 155] },
]

function union(a: Bounds, b: Bounds): Bounds {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]
}

// The combined bounds of every region named in the text, expanded to include the
// origin point. Returns null when no region keyword is recognised (caller then
// falls back to a simple radius around the origin).
export function regionBounds(region: string, origin: { lat: number; lng: number }): Bounds | null {
  const text = region.toLowerCase()
  let box: Bounds | null = null
  for (const { keywords, box: b } of REGIONS) {
    if (keywords.some((k) => text.includes(k))) box = box ? union(box, b) : b
  }
  if (!box) return null
  // Always include the origin so the pin is visible within the frame.
  return union(box, [origin.lat, origin.lng, origin.lat, origin.lng])
}
