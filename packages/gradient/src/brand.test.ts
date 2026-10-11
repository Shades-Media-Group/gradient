import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(new URL(`../brand/${file}`, import.meta.url), 'utf8')

describe('the Shades mark', () => {
  // The geometry of client/public/images/logo.svg on shades.md, the source of truth.
  it('is a sharp red square with three white bars at full, 75% and 50%', () => {
    const svg = read('shades-mark.svg')
    expect(svg).toContain('<rect width="56" height="56" fill="#E40523"/>')
    expect(svg).not.toContain('rx=')
    expect(svg).toContain('<rect x="10" y="13" width="10" height="30" fill="#FFFFFF"/>')
    expect(svg).toContain('<rect x="23" y="13" width="10" height="30" fill="#FFFFFF" fill-opacity="0.75"/>')
    expect(svg).toContain('<rect x="36" y="13" width="10" height="30" fill="#FFFFFF" fill-opacity="0.5"/>')
  })

  it('sits in the lockup at the navbar size', () => {
    const svg = read('shades-lockup.svg')
    expect(svg).toContain('viewBox="0 0 142 32"')
    expect(svg).toContain('<rect width="29.4769" height="29.4769" fill="#E40523"/>')
  })
})
