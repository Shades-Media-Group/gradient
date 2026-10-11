/**
 * Display and accessibility preferences, the same on every Shades site.
 *
 * A 20 px dot in the bottom-right corner opens a small panel: theme (light,
 * dark, or the system's), larger text, more contrast, less motion, underlined
 * links and easier reading. Choices live in this browser's localStorage and
 * nowhere else; preferences-boot.js applies them before the first paint.
 * The consent banner (consent.ts) comes with it, and "Privacy choices" in
 * the panel reopens it.
 *
 *   import { preferences } from 'shades-gradient/preferences'
 *   preferences({ labels })
 */
import { consentBanner, type ConsentLabels } from './consent'

/** The four icons the panel draws, copied from icons/ so the full set stays out of the bundle. */
const ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  contrast:
    '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
}

export type Theme = 'light' | 'dark' | 'system'
export interface Preferences {
  theme: Theme
  text: boolean
  contrast: boolean
  motion: boolean
  links: boolean
  reading: boolean
}

export interface PreferenceLabels {
  open: string
  title: string
  theme: string
  light: string
  dark: string
  system: string
  access: string
  text: string
  contrast: string
  motion: string
  links: string
  reading: string
  saved: string
  reset: string
  privacy: string
  close: string
}

export const ENGLISH: PreferenceLabels = {
  open: 'Display and accessibility',
  title: 'Display',
  theme: 'Theme',
  light: 'Light',
  dark: 'Dark',
  system: 'Auto',
  access: 'Accessibility',
  text: 'Larger text',
  contrast: 'More contrast',
  motion: 'Reduce motion',
  links: 'Underline links',
  reading: 'Easier reading',
  saved: 'Saved in this browser only.',
  reset: 'Reset',
  privacy: 'Privacy choices',
  close: 'Close',
}

export const STORAGE_KEY = 'shades:preferences'
const DEFAULTS: Preferences = {
  theme: 'system',
  text: false,
  contrast: false,
  motion: false,
  links: false,
  reading: false,
}

/** The attribute each switch sets on <html>. */
const FLAGS = {
  text: 'data-g-text',
  contrast: 'data-g-contrast',
  motion: 'data-g-motion',
  links: 'data-g-links',
  reading: 'data-g-reading',
} as const
type Flag = keyof typeof FLAGS

const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Private mode or storage switched off: the choice lasts for this page.
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key)
    } catch {
      // As above.
    }
  },
}

/**
 * The theme a reader gets before choosing one. A site opts into light or dark
 * with <html data-theme-default="light">; without it, the system decides.
 */
export function defaultTheme(root = document.documentElement): Theme {
  const theme = root.getAttribute('data-theme-default')
  return theme === 'light' || theme === 'dark' ? theme : 'system'
}

const defaults = (): Preferences => ({ ...DEFAULTS, theme: defaultTheme() })

export function readPreferences(): Preferences {
  try {
    return { ...defaults(), ...(JSON.parse(store.get(STORAGE_KEY) ?? '{}') as Partial<Preferences>) }
  } catch {
    return defaults()
  }
}

/** Puts the preferences on <html>; preferences-boot.js does the same before paint. */
export function applyPreferences(prefs: Preferences, root = document.documentElement) {
  if (prefs.theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', prefs.theme)
  for (const flag of Object.keys(FLAGS) as Flag[]) root.toggleAttribute(FLAGS[flag], prefs[flag])
}

/** True when the reader asked for less motion, here or in their system. */
export const reducedMotion = () =>
  document.documentElement.hasAttribute(FLAGS.motion) ||
  matchMedia('(prefers-reduced-motion: reduce)').matches

const svg = (name: keyof typeof ICONS) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export interface PreferencesOptions {
  /** The interface text in the page's language. Missing keys fall back to English. */
  labels?: Partial<PreferenceLabels>
  /** The consent banner's text in the page's language, or false for no banner. */
  consent?: Partial<ConsentLabels> | false
  /** Where the dot and panel go. Default document.body. */
  root?: HTMLElement
}

/** Adds the dot, the panel and the consent banner to the page. Returns a function that removes them. */
export function preferences(options: PreferencesOptions = {}): () => void {
  const t = { ...ENGLISH, ...options.labels }
  const host = options.root ?? document.body
  let prefs = readPreferences()

  const wrap = document.createElement('div')
  wrap.className = 'g-prefs'
  const themes: [Theme, keyof typeof ICONS, string][] = [
    ['light', 'sun', t.light],
    ['dark', 'moon', t.dark],
    ['system', 'contrast', t.system],
  ]
  const flags: [Flag, string][] = [
    ['text', t.text],
    ['contrast', t.contrast],
    ['motion', t.motion],
    ['links', t.links],
    ['reading', t.reading],
  ]
  wrap.innerHTML = `
    <div class="g-prefs-panel" id="g-prefs-panel" role="dialog" aria-labelledby="g-prefs-title" hidden>
      <div class="g-prefs-head">
        <h2 class="g-prefs-title" id="g-prefs-title">${escape(t.title)}</h2>
        <button class="g-prefs-close" type="button" aria-label="${escape(t.close)}">${svg('close')}</button>
      </div>
      <div class="g-prefs-themes" role="radiogroup" aria-label="${escape(t.theme)}">
        ${themes
          .map(
            ([value, icon, label]) =>
              `<button type="button" role="radio" data-theme-choice="${value}">${svg(icon)}<span>${escape(label)}</span></button>`,
          )
          .join('')}
      </div>
      <p class="g-prefs-sub">${escape(t.access)}</p>
      <ul class="g-prefs-list">
        ${flags
          .map(
            ([flag, label]) =>
              `<li><label><span>${escape(label)}</span><input class="g-prefs-switch" type="checkbox" role="switch" data-flag="${flag}" /></label></li>`,
          )
          .join('')}
      </ul>
      <div class="g-prefs-foot">
        <p>${escape(t.saved)}</p>
        <button type="button" class="g-prefs-reset">${escape(t.reset)}</button>
      </div>
      <div class="g-prefs-links">
        <button type="button" class="g-prefs-privacy">${escape(t.privacy)}</button>
      </div>
    </div>
    <button class="g-prefs-dot" type="button" aria-expanded="false" aria-controls="g-prefs-panel" aria-label="${escape(t.open)}" title="${escape(t.open)}"><span aria-hidden="true"></span></button>`
  host.append(wrap)

  const dot = wrap.querySelector<HTMLButtonElement>('.g-prefs-dot')!
  const panel = wrap.querySelector<HTMLElement>('.g-prefs-panel')!
  const radios = [...wrap.querySelectorAll<HTMLButtonElement>('[data-theme-choice]')]
  const switches = [...wrap.querySelectorAll<HTMLInputElement>('[data-flag]')]

  const render = () => {
    for (const radio of radios) {
      const on = radio.dataset.themeChoice === prefs.theme
      radio.setAttribute('aria-checked', String(on))
      radio.tabIndex = on ? 0 : -1
    }
    for (const input of switches) input.checked = prefs[input.dataset.flag as Flag]
  }
  const save = (next: Preferences) => {
    prefs = next
    applyPreferences(prefs)
    store.set(STORAGE_KEY, JSON.stringify(prefs))
    render()
    document.dispatchEvent(new CustomEvent('shades:preferences', { detail: prefs }))
  }

  const open = (focus = true) => {
    panel.hidden = false
    dot.setAttribute('aria-expanded', 'true')
    if (focus) (radios.find((r) => r.tabIndex === 0) ?? radios[0])!.focus()
  }
  const close = (focus = true) => {
    if (panel.hidden) return
    panel.hidden = true
    dot.setAttribute('aria-expanded', 'false')
    if (focus) dot.focus()
  }

  dot.addEventListener('click', () => (panel.hidden ? open() : close()))
  wrap.querySelector('.g-prefs-close')!.addEventListener('click', () => close())
  radios.forEach((radio, i) => {
    radio.addEventListener('click', () =>
      save({ ...prefs, theme: radio.dataset.themeChoice as Theme }),
    )
    radio.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
      if (!step) return
      event.preventDefault()
      const next = radios[(i + step + radios.length) % radios.length]!
      save({ ...prefs, theme: next.dataset.themeChoice as Theme })
      next.focus()
    })
  })
  for (const input of switches)
    input.addEventListener('change', () =>
      save({ ...prefs, [input.dataset.flag as Flag]: input.checked }),
    )
  wrap.querySelector('.g-prefs-reset')!.addEventListener('click', () => {
    store.remove(STORAGE_KEY)
    save(defaults())
  })

  const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
  const onClick = (event: MouseEvent) => {
    if (!wrap.contains(event.target as Node)) close(false)
  }
  document.addEventListener('keydown', onKey)
  document.addEventListener('click', onClick)

  // The consent banner: asks once, and again from "Privacy choices" in the panel.
  const consentLabels = options.consent
  if (consentLabels !== false) {
    consentBanner({ labels: consentLabels, root: host })
    wrap.querySelector('.g-prefs-privacy')!.addEventListener('click', (event) => {
      event.stopPropagation()
      close(false)
      consentBanner({ labels: consentLabels, root: host, force: true })
    })
  }

  applyPreferences(prefs)
  render()
  return () => {
    document.removeEventListener('keydown', onKey)
    document.removeEventListener('click', onClick)
    wrap.remove()
    document.querySelector('.g-consent')?.remove()
  }
}
