import { describe, it, expect } from 'vitest'
import { commonsInfoUrl, outputPaths } from '../fetch-images.mjs'

describe('fetch-images helpers', () => {
  it('builds a Commons imageinfo API url', () => {
    const url = commonsInfoUrl('Tomato.jpg')
    expect(url).toContain('commons.wikimedia.org')
    expect(url).toContain('File%3ATomato.jpg')
    expect(url).toContain('iiprop=url%7Cextmetadata')
  })
  it('derives output paths from id', () => {
    const p = outputPaths('tomato')
    expect(p.badge).toMatch(/public\/images\/tomato-badge\.webp$/)
    expect(p.hero).toMatch(/public\/images\/tomato-hero\.webp$/)
  })
})
