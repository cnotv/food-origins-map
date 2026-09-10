import { produce } from '../src/data/produce'
import { getFieldGuide } from '../src/data/guide'
const missing = produce.filter((p) => !(getFieldGuide(p.id)?.recipes?.length))
console.log(missing.length, produce.length)
console.log(missing.map((m) => `${m.id} | ${m.name} | ${m.category} | ${m.origin.region}`).join('\n'))
