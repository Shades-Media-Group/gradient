import { describe, expect, it } from 'vitest'
import { defaultTheme } from './preferences'

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
