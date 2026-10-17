/**
 * Cookie and storage consent, the same on every Shades site.
 *
 * A slim bar grows out of the preferences dot (a sheet on the bottom edge on a
 * phone) and offers three choices: accept all and only necessary, which weigh
 * the same, or customise by category. Answering folds it back into the dot,
 * where "Privacy choices" reopens it. Necessary storage (the reader's display and privacy
 * choices) is always on; every other category stays off until the reader says
 * yes. The answer is kept in this browser and can be changed at any time.
 *
 * Scripts that need consent wait for it:
 *
 *   import { onConsent } from 'shades-gradient/consent'
 *   onConsent('analytics', () => loadAnalytics())
 */

export type Category = 'analytics' | 'marketing'
export interface Consent {
  necessary: true
  analytics: boolean
  marketing: boolean
  /** When the reader answered, ISO 8601. */
  at: string
  /** The banner version the answer was given to. Raise it to ask again. */
  version: number
}

export interface ConsentLabels {
  title: string
  text: string
  acceptAll: string
  necessaryOnly: string
  customize: string
  save: string
  necessary: string
  necessaryText: string
  analytics: string
  analyticsText: string
  marketing: string
  marketingText: string
}

export const CONSENT_ENGLISH: ConsentLabels = {
  title: 'Your privacy',
  text: 'This site keeps only what it needs to work. Anything else waits for your yes.',
  acceptAll: 'Accept all',
  necessaryOnly: 'Only necessary',
  customize: 'Customise',
  save: 'Save choices',
  necessary: 'Necessary',
  necessaryText: 'Remembers your display and privacy choices. Always on.',
  analytics: 'Analytics',
  analyticsText: 'Anonymous visit counts, to learn what helps. Not in use on this site today.',
  marketing: 'Marketing',
  marketingText: 'Ads and campaign measurement. Not in use on this site today.',
}

export const CONSENT_KEY = 'shades:consent'
const VERSION = 1
const CATEGORIES: Category[] = ['analytics', 'marketing']

export function getConsent(): Consent | null {
  try {
    const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? 'null') as Consent | null
    return saved && saved.version === VERSION ? saved : null
  } catch {
    return null
  }
}

function setConsent(choice: Record<Category, boolean>): Consent {
  const consent: Consent = {
    necessary: true,
    ...choice,
    at: new Date().toISOString(),
    version: VERSION,
  }
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
  } catch {
    // No storage: the answer holds for this page, and the banner asks again next time.
  }
  document.dispatchEvent(new CustomEvent('shades:consent', { detail: consent }))
  return consent
}

/** Runs `then` once the reader allows `category`: now if they already have, or when they do. */
export function onConsent(category: Category, then: () => void): void {
  if (getConsent()?.[category]) return then()
  const listen = (event: Event) => {
    if (!(event as CustomEvent<Consent>).detail[category]) return
    document.removeEventListener('shades:consent', listen)
    then()
  }
  document.addEventListener('shades:consent', listen)
}

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

let banner: HTMLElement | null = null

/**
 * Shows the banner if the reader hasn't answered yet, or always with
 * `{ force: true }` (the "Privacy choices" link). Returns the element.
 */
export function consentBanner(
  options: { labels?: Partial<ConsentLabels>; root?: HTMLElement; force?: boolean } = {},
): HTMLElement | null {
  if (banner) return banner
  const saved = getConsent()
  if (saved && !options.force) return null
  const t = { ...CONSENT_ENGLISH, ...options.labels }
  const row = (id: string, title: string, text: string, checked: boolean, disabled = false) =>
    `<li><label><span><b>${escape(title)}</b><small>${escape(text)}</small></span>
      <input class="g-prefs-switch" type="checkbox" role="switch" ${id ? `data-category="${id}"` : ''} ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} /></label></li>`

  banner = document.createElement('section')
  banner.className = document.querySelector('.g-prefs-dot') ? 'g-consent' : 'g-consent g-consent--solo'
  banner.setAttribute('aria-labelledby', 'g-consent-title')
  banner.innerHTML = `
    <h2 class="g-consent-title" id="g-consent-title">${escape(t.title)}</h2>
    <p>${escape(t.text)}</p>
    <ul class="g-consent-list" hidden>
      ${row('', t.necessary, t.necessaryText, true, true)}
      ${row('analytics', t.analytics, t.analyticsText, saved?.analytics ?? false)}
      ${row('marketing', t.marketing, t.marketingText, saved?.marketing ?? false)}
    </ul>
    <div class="g-consent-actions">
      <button type="button" class="g-consent-customize" aria-expanded="false">${escape(t.customize)}</button>
      <button type="button" class="g-consent-save" hidden>${escape(t.save)}</button>
      <button type="button" class="g-consent-necessary">${escape(t.necessaryOnly)}</button>
      <button type="button" class="g-consent-all">${escape(t.acceptAll)}</button>
    </div>`
  ;(options.root ?? document.body).append(banner)

  const list = banner.querySelector<HTMLElement>('.g-consent-list')!
  const customize = banner.querySelector<HTMLButtonElement>('.g-consent-customize')!
  const save = banner.querySelector<HTMLButtonElement>('.g-consent-save')!
  const close = (choice: Record<Category, boolean>) => {
    setConsent(choice)
    const leaving = banner!
    banner = null
    const dot = document.querySelector<HTMLElement>('.g-prefs-dot')
    dot?.focus()
    // Folds into the dot, then the dot answers back; at once when motion is off.
    const done = () => {
      if (!leaving.isConnected) return
      leaving.remove()
      dot?.classList.add('g-prefs-dot--nudge')
      setTimeout(() => dot?.classList.remove('g-prefs-dot--nudge'), 600)
    }
    const still =
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.hasAttribute('data-g-motion')
    if (still) return done()
    leaving.classList.add('g-consent--leaving')
    leaving.addEventListener('animationend', done, { once: true })
    setTimeout(done, 500)
  }
  const all = (value: boolean) =>
    Object.fromEntries(CATEGORIES.map((c) => [c, value])) as Record<Category, boolean>

  banner.querySelector('.g-consent-all')!.addEventListener('click', () => close(all(true)))
  banner.querySelector('.g-consent-necessary')!.addEventListener('click', () => close(all(false)))
  customize.addEventListener('click', () => {
    banner?.setAttribute('data-choosing', '')
    list.hidden = false
    save.hidden = false
    customize.hidden = true
    customize.setAttribute('aria-expanded', 'true')
    list.querySelector<HTMLInputElement>('[data-category]')?.focus()
  })
  save.addEventListener('click', () =>
    close(
      Object.fromEntries(
        CATEGORIES.map((c) => [
          c,
          list.querySelector<HTMLInputElement>(`[data-category="${c}"]`)!.checked,
        ]),
      ) as Record<Category, boolean>,
    ),
  )
  if (options.force) {
    customize.click()
  }
  return banner
}
