import { brandIcons, icons } from './icons'
import mark from '../brand/shades-mark.svg'
import markMono from '../brand/shades-mark-mono.svg'
import lockup from '../brand/shades-lockup.svg'
import lockupReverse from '../brand/shades-lockup-reverse.svg'
import lockupMono from '../brand/shades-lockup-mono.svg'
import spectra from '../brand/spectra/spectra.svg'
import mera from '../brand/spectra/mera.svg'
import sol from '../brand/spectra/sol.svg'
import nova from '../brand/spectra/nova.svg'
import sage from '../brand/spectra/sage.svg'
import vio from '../brand/spectra/vio.svg'
import sunny from '../brand/spectra/sunny.svg'

export { brandIcons, icons }

export type IconName = keyof typeof icons
export type BrandIconName = keyof typeof brandIcons

/** How every Shades interface icon is painted. Override the width with CSS: svg { stroke-width: 1.5 } */
export const STROKE =
  'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/**
 * An icon as an SVG string, sized in px and drawn in currentColor. Without a
 * title it is hidden from assistive technology, so the control around it must
 * carry the label.
 */
export function renderIcon(name: IconName | BrandIconName, size = 24, title?: string): string {
  const ui = (icons as Record<string, string>)[name]
  const body = ui ?? (brandIcons as Record<string, string>)[name]
  if (!body) throw new Error(`No icon named "${name}"`)
  const paint = ui ? STROKE : 'fill="currentColor"'
  const a11y = title ? `role="img" aria-label="${escape(title)}"` : 'aria-hidden="true"'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" ${paint} focusable="false" ${a11y}>${body}</svg>`
}

/** The Shades logo files as SVG strings. Brand assets: see TRADEMARKS.md before use. */
export const logo = { mark, markMono, lockup, lockupReverse, lockupMono } as const

/** The Spectra family, one SVG string per character. Brand assets: see TRADEMARKS.md. */
export const family = { spectra, mera, sol, nova, sage, vio, sunny } as const
export type FamilyMember = keyof typeof family
