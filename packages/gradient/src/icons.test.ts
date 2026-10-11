import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { brandIcons, icons } from './icons'
import { renderIcon } from './index'

const dir = new URL('../icons/', import.meta.url)
const files = readdirSync(dir).filter((file) => file.endsWith('.svg'))

describe('Shades icons', () => {
  it('generated icons.ts matches the drawn files', () => {
    expect(Object.keys(icons)).toHaveLength(files.length)
  })

  for (const file of files)
    it(`${file} follows the grid and stroke rules`, () => {
      const svg = readFileSync(new URL(file, dir), 'utf8')
      expect(file).toMatch(/^[a-z]+(-[a-z]+)*\.svg$/)
      expect(svg).toContain('viewBox="0 0 24 24"')
      expect(svg).toContain('stroke="currentColor"')
      expect(svg).toContain('stroke-width="2"')
      expect(svg).not.toMatch(/#[0-9a-f]{3,6}/i)
    })

  it('names never collide between the sets', () => {
    const shared = Object.keys(icons).filter((name) => name in brandIcons)
    expect(shared).toEqual([])
  })

  it('renders hidden by default and labelled with a title', () => {
    expect(renderIcon('arrowRight')).toContain('aria-hidden="true"')
    expect(renderIcon('github', 20, 'GitHub')).toContain('aria-label="GitHub"')
    expect(() => renderIcon('nope' as 'add')).toThrow()
  })
})
