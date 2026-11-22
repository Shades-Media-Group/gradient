import { describe, expect, it } from 'vitest'
import { applyPreferences, defaultTheme, VISION } from './preferences'

const root = (value: string | null) => ({ getAttribute: () => value }) as unknown as HTMLElement

describe('defaultTheme', () => {
  it('takes light or dark from data-theme-default', () => {
    expect(defaultTheme(root('light'))).toBe('light')
    expect(defaultTheme(root('dark'))).toBe('dark')
  })

  it('leaves the system in charge otherwise', () => {
    expect(defaultTheme(root(null))).toBe('system')
    expect(defaultTheme(root('sepia'))).toBe('system')
  })
})

describe('colour blindness', () => {
  it('keeps white white and black black in every correction', () => {
    for (const values of Object.values(VISION)) {
      const m = values.split(' ').map(Number)
      expect(m).toHaveLength(20)
      for (const row of [0, 1, 2]) {
        const sum = m[row * 5]! + m[row * 5 + 1]! + m[row * 5 + 2]!
        expect(sum).toBeCloseTo(1, 2)
        expect(m[row * 5 + 4]).toBe(0)
      }
    }
  })

  it('puts the chosen kind on <html> only while it is on', () => {
    const attrs = new Map<string, string>()
    const html = {
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      removeAttribute: (k: string) => attrs.delete(k),
      toggleAttribute: (k: string, on: boolean) => (on ? attrs.set(k, '') : attrs.delete(k)),
      hasAttribute: (k: string) => attrs.has(k),
      style: { filter: '' },
    } as unknown as HTMLElement
    const body: unknown[] = []
    globalThis.document = {
      getElementById: () => (body.length ? body[0] : null),
      createElementNS: () => ({ setAttribute() {} }),
      body: { append: (el: unknown) => body.push(el) },
    } as unknown as Document
    const prefs = {
      theme: 'system',
      text: false,
      contrast: false,
      motion: false,
      links: false,
      reading: false,
    } as const
    applyPreferences({ ...prefs, vision: true, visionType: 'protan' }, html)
    expect(attrs.get('data-g-vision')).toBe('protan')
    applyPreferences({ ...prefs, vision: true, visionType: 'tritan' }, html)
    expect(attrs.get('data-g-vision')).toBe('tritan')
    expect(html.style.filter).toBe('url(#g-vision-tritan)')
    expect(body).toHaveLength(1)
    applyPreferences({ ...prefs, vision: false, visionType: 'tritan' }, html)
    expect(attrs.has('data-g-vision')).toBe(false)
    expect(html.style.filter).toBe('')
  })
})
