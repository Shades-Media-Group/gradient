import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type Node = { [key: string]: Node } & {
  $value?: unknown
  $extensions?: Record<string, { dark?: string }>
}
const tokens = JSON.parse(readFileSync(new URL('./tokens.json', import.meta.url), 'utf8')) as Node

const at = (path: string) => path.split('.').reduce<Node>((node, key) => node[key]!, tokens)
const resolve = (value: string): string =>
  value.startsWith('{') ? resolve(at(value.slice(1, -1)).$value as string) : value

const role = (name: string, theme: 'light' | 'dark') => {
  const token = at(`role.${name}`)
  return resolve(
    theme === 'dark' ? token.$extensions!['md.shades.gradient']!.dark! : (token.$value as string),
  )
}

/** WCAG 2.x relative luminance and contrast ratio. */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

/** Text that must stay readable as body copy (WCAG 2.2 AA, 4.5:1), and on what. */
const PAIRS: [string, string][] = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'sunken'],
  ['text-2', 'bg'],
  ['text-2', 'surface'],
  ['text-3', 'bg'],
  ['text-3', 'surface'],
  ['text-3', 'sunken'],
  ['accent-text', 'bg'],
  ['accent-text', 'surface'],
  ['accent-text', 'accent-soft'],
  ['on-accent', 'accent'],
  ['on-accent', 'accent-hover'],
  ['on-accent', 'accent-press'],
  ['on-inverse', 'inverse'],
  ['success', 'bg'],
  ['warning', 'bg'],
  ['danger', 'bg'],
]

describe('role colours', () => {
  for (const theme of ['light', 'dark'] as const)
    for (const [fg, bg] of PAIRS)
      it(`${fg} on ${bg} reads at 4.5:1 or more (${theme})`, () => {
        expect(contrast(role(fg, theme), role(bg, theme))).toBeGreaterThanOrEqual(4.5)
      })
})

describe('brand colours', () => {
  it('keeps the logo red from shades.md', () => {
    expect(resolve('{color.red.500}')).toBe('#E40523')
  })

  it('every reference points at a token that exists', () => {
    const refs = JSON.stringify(tokens).match(/\{[a-z0-9.-]+\}/g) ?? []
    for (const ref of refs) expect(() => resolve(ref)).not.toThrow()
  })
})
