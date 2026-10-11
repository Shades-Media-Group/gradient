/**
 * Builds every page of the site in every language, before Vite sees them.
 *
 * Each page is one template in templates/ with {{key}} placeholders, and each
 * language is one dictionary in i18n/. The plugin writes the finished HTML next
 * to the sources (index.html, brand/index.html, fr/index.html, …; all
 * gitignored) and hands them to Rollup as inputs, so crawlers get static,
 * translated HTML and Vite bundles the scripts and styles as usual.
 *
 * Placeholders: {{key.path}} is a translated string (trusted HTML). {{@name}}
 * calls a generator below; {{@icon:arrowRight}}, {{@family:mera}} and
 * {{@to:brand}} take an argument.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import {
  calendarLinks,
  email,
  renderEmail,
  type CalendarEvent,
} from '../../packages/gradient/src/email'
import { brandIcons, icons } from '../../packages/gradient/src/icons'
import { LINKS, REPO, SHADES } from './src/links'

const root = fileURLToPath(new URL('.', import.meta.url))
const brand = join(root, '../../packages/gradient/brand')
export const SITE = 'https://gradient.shades.md'
const { version } = JSON.parse(
  readFileSync(join(root, '../../packages/gradient/package.json'), 'utf8'),
) as { version: string }

/** The languages the site is written in. English is the default, at the root. */
export const LOCALES = [
  { code: 'en', lang: 'en', og: 'en_US', name: 'English', short: 'EN' },
  { code: 'fr', lang: 'fr', og: 'fr_FR', name: 'Français', short: 'FR' },
  { code: 'ro', lang: 'ro', og: 'ro_RO', name: 'Română', short: 'RO' },
  { code: 'ru', lang: 'ru', og: 'ru_RU', name: 'Русский', short: 'RU' },
  { code: 'es', lang: 'es', og: 'es_ES', name: 'Español', short: 'ES' },
  { code: 'it', lang: 'it', og: 'it_IT', name: 'Italiano', short: 'IT' },
  { code: 'tr', lang: 'tr', og: 'tr_TR', name: 'Türkçe', short: 'TR' },
  { code: 'hi', lang: 'hi', og: 'hi_IN', name: 'हिन्दी', short: 'HI' },
  { code: 'ja', lang: 'ja', og: 'ja_JP', name: '日本語', short: 'JA' },
  { code: 'zh', lang: 'zh-Hans', og: 'zh_CN', name: '简体中文', short: '简' },
  { code: 'zh-hant', lang: 'zh-Hant', og: 'zh_TW', name: '繁體中文', short: '繁' },
] as const
type Locale = (typeof LOCALES)[number]

export const PAGES = [
  { id: 'home', path: '' },
  { id: 'brand', path: 'brand/' },
  { id: 'foundations', path: 'foundations/' },
  { id: 'components', path: 'components/' },
  { id: 'icons', path: 'icons/' },
  { id: 'print', path: 'print/' },
  { id: 'applications', path: 'applications/' },
  { id: 'email', path: 'email/' },
  { id: 'accessibility', path: 'accessibility/' },
  { id: 'docs', path: 'docs/' },
  { id: 'projects', path: 'projects/' },
] as const
type Page = (typeof PAGES)[number]
type PageId = Page['id']

type Dict = { [key: string]: string | Dict }

/** Path of a page in a language: /brand/, /fr/brand/. */
export const pathOf = (locale: Locale, page: Page) =>
  `/${locale.code === 'en' ? '' : `${locale.code}/`}${page.path}`

const dictionary = (code: string): Dict =>
  JSON.parse(readFileSync(join(root, 'i18n', `${code}.json`), 'utf8')) as Dict

function lookup(dict: Dict, key: string, code: string): string {
  const value = key
    .split('.')
    .reduce<string | Dict | undefined>(
      (node, part) => (typeof node === 'object' ? node[part] : undefined),
      dict,
    )
  if (typeof value !== 'string') throw new Error(`i18n/${code}.json has no string "${key}"`)
  return value
}

/** Dictionary text is trusted HTML; quotes are escaped so it also fits in attributes. */
const html = (text: string) => text.replaceAll('"', '&quot;')

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/** A Shades icon (or a service's mark), inline, hidden from assistive technology. */
function icon(name: string, extra = '') {
  const ui = (icons as Record<string, string>)[name]
  const mark = (brandIcons as Record<string, string>)[name]
  if (!ui && !mark) throw new Error(`No icon named "${name}"`)
  const paint = ui
    ? 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    : 'fill="currentColor"'
  return `<svg class="i i-${kebab(name)}" viewBox="0 0 24 24" ${paint} aria-hidden="true" focusable="false"${extra}>${ui ?? mark}</svg>`
}

const GOOGLE_G = `<svg class="pref-g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>`

/** A brand file, inline, without its XML noise. */
const inline = (file: string, cls: string) =>
  readFileSync(join(brand, file), 'utf8')
    .replace(/<svg /, `<svg class="${cls}" `)
    .replace(/ xmlns="[^"]+"/, '')
    // The motion lives in the page's stylesheet; the file's own copy is for use as an image.
    .replace(/\s*<style>[\s\S]*?<\/style>/, '')
    .trim()

const entries = (node: string | Dict | undefined) => Object.values(node as Dict) as Dict[]

/** The home page questions, with HTML answers. */
function questions(dict: Dict) {
  const faq = (dict.home as Dict).faq as Dict
  return entries(faq.items).map((item) => ({ q: item.q as string, a: item.a as string }))
}

const PLURALS = new Set(['zero', 'one', 'two', 'few', 'many'])
const keys = (node: Dict, prefix = ''): string[] =>
  Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'object'
      ? keys(value, `${prefix}${key}.`)
      : PLURALS.has(key)
        ? []
        : [prefix + key],
  )

/** Every dictionary has exactly the English keys. */
function checkDictionaries() {
  const english = keys(dictionary('en'))
  for (const { code } of LOCALES) {
    const own = keys(dictionary(code))
    const missing = english.filter((key) => !own.includes(key))
    const extra = own.filter((key) => !english.includes(key))
    if (missing.length || extra.length)
      throw new Error(`i18n/${code}.json: missing ${missing.join(', ')}; extra ${extra.join(', ')}`)
  }
}

const plain = (text: string) =>
  text
    .replace(/<[^>]+>/g, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&nbsp;', ' ')

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SHADES}/#organization`,
  name: 'Shades Media Group',
  alternateName: 'Shades',
  url: SHADES,
  logo: `${SITE}/shades-mark.png`,
  address: { '@type': 'PostalAddress', addressLocality: 'Chișinău', addressCountry: 'MD' },
}
const WEBSITE = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  name: 'Gradient',
  url: `${SITE}/`,
  inLanguage: LOCALES.map((l) => l.lang),
  publisher: { '@id': ORGANIZATION['@id'] },
}

/** schema.org data for a page: what the page shows, never more. */
function structuredData(locale: Locale, page: Page, t: (key: string) => string, dict: Dict) {
  const home = `${SITE}${pathOf(locale, PAGES[0])}`
  const url = `${SITE}${pathOf(locale, page)}`
  const webPage = {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: t(`${page.id}.title`),
    description: t(`${page.id}.description`),
    inLanguage: locale.lang,
    isPartOf: { '@id': WEBSITE['@id'] },
  }
  if (page.id !== 'home') {
    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('nav.home'), item: home },
        { '@type': 'ListItem', position: 2, name: t(`nav.${page.id}`), item: url },
      ],
    }
    return [
      ORGANIZATION,
      WEBSITE,
      { ...webPage, breadcrumb: { '@id': breadcrumb['@id'] } },
      breadcrumb,
    ]
  }
  const code = {
    '@type': 'SoftwareSourceCode',
    '@id': `${SITE}/#code`,
    name: 'Gradient',
    alternateName: 'shades-gradient',
    description: t('home.description'),
    codeRepository: REPO,
    programmingLanguage: ['CSS', 'TypeScript'],
    runtimePlatform: 'Web',
    license: 'https://opensource.org/licenses/MIT',
    version,
    url: home,
    author: { '@id': ORGANIZATION['@id'] },
    publisher: { '@id': ORGANIZATION['@id'] },
    sameAs: [REPO, 'https://www.npmjs.com/package/shades-gradient'],
  }
  return [
    ORGANIZATION,
    WEBSITE,
    code,
    { ...webPage, about: { '@id': code['@id'] } },
    {
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      inLanguage: locale.lang,
      mainEntity: questions(dict).map(({ q, a }) => ({
        '@type': 'Question',
        name: plain(q),
        acceptedAnswer: { '@type': 'Answer', text: plain(a) },
      })),
    },
  ]
}

/** Title, description, canonical, every language's address, social cards and JSON-LD. */
function head(locale: Locale, page: Page, t: (key: string) => string, dict: Dict) {
  const url = `${SITE}${pathOf(locale, page)}`
  const title = html(t(`${page.id}.title`))
  const description = html(t(`${page.id}.description`))
  const image = html(t('imageAlt'))
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': structuredData(locale, page, t, dict),
  }).replaceAll('<', '\\u003c')
  return [
    // Applies the reader's theme and accessibility choices before anything paints.
    '<script vite-ignore src="/preferences-boot.js"></script>',
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    `<link rel="canonical" href="${url}" />`,
    ...LOCALES.map(
      (l) => `<link rel="alternate" hreflang="${l.lang}" href="${SITE}${pathOf(l, page)}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${SITE}${pathOf(LOCALES[0], page)}" />`,
    '<link rel="alternate" type="text/plain" href="/llms.txt" title="Gradient for language models" />',
    '<link rel="sitemap" type="application/xml" href="/sitemap.xml" />',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
    '<meta name="color-scheme" content="light dark" />',
    '<meta name="theme-color" content="#fdfdfc" media="(prefers-color-scheme: light)" />',
    '<meta name="theme-color" content="#0a0a0b" media="(prefers-color-scheme: dark)" />',
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Gradient by Shades" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:locale" content="${locale.og}" />`,
    ...LOCALES.filter((l) => l !== locale).map(
      (l) => `<meta property="og:locale:alternate" content="${l.og}" />`,
    ),
    `<meta property="og:image" content="${SITE}/social-card.png" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${image}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${SITE}/social-card.png" />`,
    `<meta name="twitter:image:alt" content="${image}" />`,
    `<script type="application/ld+json">${json}</script>`,
  ].join('\n    ')
}

const tokens = JSON.parse(
  readFileSync(join(root, '../../packages/gradient/src/tokens.json'), 'utf8'),
) as Dict & Record<string, unknown>
const tokenAt = (path: string): Dict => path.split('.').reduce<Dict>((n, k) => n[k] as Dict, tokens)
const resolveToken = (value: string): string =>
  value.startsWith('{') ? resolveToken(tokenAt(value.slice(1, -1)).$value as string) : value
const roleValue = (name: string, dark: boolean) => {
  const token = tokenAt(`role.${name}`)
  const ext = (token.$extensions as Dict | undefined)?.['md.shades.gradient'] as Dict | undefined
  return resolveToken((dark ? ext?.dark : token.$value) as string)
}
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}
const CONTRAST_PAIRS: [string, string][] = [
  ['text', 'bg'],
  ['text-2', 'bg'],
  ['text-3', 'bg'],
  ['text-3', 'sunken'],
  ['accent-text', 'bg'],
  ['on-accent', 'accent'],
  ['on-accent', 'accent-hover'],
  ['on-inverse', 'inverse'],
  ['success', 'bg'],
  ['warning', 'bg'],
  ['danger', 'bg'],
]

/** The three sample emails on the email page, rendered by the package itself. */
function emailSamples() {
  const start = new Date('2027-03-04T09:00:00Z')
  const event: CalendarEvent = {
    uid: 'workshop-42@shades.md',
    title: 'Brand workshop with Shades',
    start,
    end: new Date(start.getTime() + 90 * 60_000),
    location: 'Shades studio, Chișinău',
  }
  return {
    code: renderEmail({
      lang: 'en',
      subject: 'Your Shades code: 418203',
      preheader: 'It works for 10 minutes.',
      heading: 'Confirm your email',
      lead: 'Enter this code to finish signing in to the Shades client space.',
      blocks: [
        email.code(
          'Your code',
          '418203',
          'Valid for 10 minutes',
          'Never share it. Shades will never ask you for it.',
        ),
        email.note('Didn’t ask for it? Ignore this email: nothing changes without the code.'),
      ],
    }),
    booking: renderEmail({
      lang: 'en',
      subject: 'Your brand workshop is booked',
      preheader: 'Thursday, 4 March, 11:00 in the studio.',
      heading: 'Your workshop is booked',
      lead: 'Bring the brief; the coffee is on us.',
      blocks: [
        email.ticket({
          label: 'Brand workshop',
          time: '11:00',
          day: 'Thursday, 4 March',
          fields: [
            { label: 'Length', value: '1 h 30 min' },
            { label: 'Booking', value: 'SH-0042' },
            { label: 'Where', value: 'Shades studio, Chișinău' },
            { label: 'With', value: 'Ana Popescu' },
          ],
          stub: [
            calendarLinks(event, { google: 'Add to Google Calendar', outlook: 'Add to Outlook' }),
          ],
        }),
        email.button('Manage the booking', 'https://shades.md/booking/42'),
      ],
    }),
    update: renderEmail({
      lang: 'en',
      subject: 'Your brief is in',
      preheader: 'We reply within one working day.',
      heading: 'Your brief is in',
      lead: 'Thank you, Ana. Here is what happens next.',
      blocks: [
        email.pass({
          label: 'Brief SH-0042',
          main: {
            html: '<p class="g-e-text" style="margin:0;font-size:24px;line-height:1.2;font-weight:700;color:#1C1C20">Brand identity</p>',
            text: 'Brand identity',
          },
          fields: [
            { label: 'Received', value: 'Fri, 5 March' },
            { label: 'Reply by', value: 'Tue, 9 March' },
          ],
          stub: [
            email.note('A designer reads every brief. You will hear from a person, not a robot.'),
          ],
        }),
        email.button('See the brief', 'https://shades.md/brief/42'),
        email.button('Book a call', 'https://shades.md/call', false),
      ],
    }),
  }
}
const SAMPLES = emailSamples()

const NAV: PageId[] = ['brand', 'foundations', 'components', 'icons', 'print', 'applications', 'email', 'docs', 'projects']

function render(locale: Locale, page: Page): string {
  const dict = dictionary(locale.code)
  const base = pathOf(locale, PAGES[0])
  const template = readFileSync(join(root, 'templates', page.path, 'index.html'), 'utf8')
  const t = (key: string) => lookup(dict, key, locale.code)
  const to = (id: string) => {
    const target = PAGES.find((p) => p.id === id)
    if (!target) throw new Error(`No page "${id}"`)
    return pathOf(locale, target)
  }
  const langLinks = LOCALES.map(
    (l) =>
      `<li><a href="${pathOf(l, page)}" hreflang="${l.lang}" lang="${l.lang}"${l === locale ? ' aria-current="true"' : ''}>${l.name}</a></li>`,
  ).join('')
  const navLinks = NAV.map(
    (id) =>
      `<a href="${to(id)}"${id === page.id ? ' aria-current="page"' : ''}>${t(`nav.${id}`)}</a>`,
  ).join('')
  const sheetLinks = NAV.map(
    (id, i) =>
      `<a href="${to(id)}" style="--i: ${i}"${id === page.id ? ' aria-current="page"' : ''}><span>${t(`nav.${id}`)}</span>${icon('arrowRight')}</a>`,
  ).join('')

  const specials: Record<string, (arg: string) => string> = {
    lang: () => locale.lang,
    base: () => base,
    version: () => version,
    head: () => head(locale, page, t, dict),
    to,
    icon: (name) => icon(name),
    family: (name) => inline(`spectra/${name}.svg`, `spectra spectra--${name}`),
    mark: () => inline('shades-mark.svg', 'g-mark'),
    lockup: () => inline('shades-lockup.svg', 'g-mark lockup'),
    // The wordmark alone: the mono lockup cropped past the mark, as the print renders do.
    wordmark: () =>
      inline('shades-lockup-mono.svg', 'wordmark')
        .replace(/viewBox="[^"]*"/, 'viewBox="41 0 101 32"')
        .replace(/ width="\d+" height="\d+"/, ''),
    nav: () => `<a class="skip" href="#main">${t('nav.skip')}</a>
    <header class="nav">
      <a class="nav-home" href="${base}" aria-label="${html(t('nav.homeLabel'))}">
        ${inline('shades-mark.svg', 'g-mark nav-mark')}<span>Gradient</span>
      </a>
      <nav class="nav-links" aria-label="${html(t('nav.label'))}">${navLinks}</nav>
      <details class="lang">
        <summary><span class="g-visually-hidden">${t('language')}: </span>${icon('globe')}<span>${locale.short}</span></summary>
        <ul class="lang-menu">${langLinks}</ul>
      </details>
      <a class="g-btn g-btn--inverse g-btn--sm nav-cta" href="${base}#install">${t('nav.cta')}</a>
      <details class="nav-more">
        <summary aria-label="${html(t('nav.menu'))}"><span class="burger" aria-hidden="true"><i></i><i></i></span></summary>
        <div class="nav-sheet">
          <nav aria-label="${html(t('nav.label'))}">${sheetLinks}</nav>
          <a class="g-btn g-btn--primary g-btn--lg nav-sheet-cta" href="${base}#install" style="--i: ${NAV.length}">${t('nav.cta')}${icon('arrowRight')}</a>
          <p class="nav-sheet-credit" style="--i: ${NAV.length + 1}">${t('footer.credit')}</p>
        </div>
      </details>
    </header>`,
    footer: () => `<footer class="footer">
      <div class="footer-top">
        <div class="footer-brand">
          <a href="${SHADES}" rel="noopener" aria-label="Shades Media Group">${inline('shades-lockup.svg', 'g-mark lockup')}</a>
          <p>${t('footer.about')}</p>
        </div>
        <nav class="footer-cols" aria-label="${html(t('footer.label'))}">
          <div><p class="footer-h">${t('footer.system')}</p><ul>${NAV.slice(0, 4)
            .map((id) => `<li><a href="${to(id)}">${t(`nav.${id}`)}</a></li>`)
            .join('')}</ul></div>
          <div><p class="footer-h">${t('footer.work')}</p><ul>
            <li><a href="${to('print')}">${t('nav.print')}</a></li>
            <li><a href="${to('applications')}">${t('nav.applications')}</a></li>
            <li><a href="${to('email')}">${t('nav.email')}</a></li>
            <li><a href="${to('projects')}">${t('nav.projects')}</a></li>
            <li><a href="${LINKS.pagerecast}" rel="noopener">PageRecast</a></li>
            <li><a href="${SHADES}" rel="noopener">shades.md</a></li>
          </ul></div>
          <div><p class="footer-h">${t('footer.code')}</p><ul>
            <li><a href="${to('docs')}">${t('nav.docs')}</a></li>
            <li><a href="${REPO}" rel="noopener">GitHub</a></li>
            <li><a href="${LINKS.npm}" rel="noopener">npm</a></li>
            <li><a href="${LINKS.changelog}" rel="noopener">${t('footer.changelog')}</a></li>
            <li><a href="${LINKS.issues}" rel="noopener">${t('footer.issues')}</a></li>
          </ul></div>
          <div><p class="footer-h">${t('footer.legal')}</p><ul>
            <li><a href="${LINKS.license}" rel="noopener">${t('footer.license')}</a></li>
            <li><a href="${LINKS.trademarks}" rel="noopener">${t('footer.trademarks')}</a></li>
            <li><a href="${to('accessibility')}">${t('nav.accessibility')}</a></li>
            <li><a href="${LINKS.security}" rel="noopener">${t('footer.security')}</a></li>
          </ul></div>
        </nav>
      </div>
      <div class="footer-langs"><nav aria-label="${html(t('language'))}"><ul>${langLinks}</ul></nav>${specials.preferred!('')}</div>
      <p class="footer-credit">${t('footer.credit')} <span class="g-num">v${version}</span></p>
      <p class="footer-word" aria-hidden="true">Gradient</p>
      <hr class="g-spectrum" />
    </footer>`,
    iconGrid: () =>
      `<ul class="icon-grid" data-icon-grid>${Object.keys(icons)
        .map(
          (name) =>
            `<li><button type="button" data-icon="${name}" data-search="${name.toLowerCase()} ${kebab(name)}">${icon(name)}<span>${name}</span></button></li>`,
        )
        .join('')}</ul>`,
    brandGrid: () =>
      `<ul class="icon-grid icon-grid--marks">${Object.keys(brandIcons)
        .map((name) => `<li><span class="icon-mark">${icon(name)}<span>${name}</span></span></li>`)
        .join('')}</ul>`,
    contrast: () =>
      `<div class="table-scroll"><table class="g-table contrast"><thead><tr><th>${t('foundations.contrast.pair')}</th><th>${t('foundations.roles.light')}</th><th>${t('foundations.roles.dark')}</th></tr></thead><tbody>${CONTRAST_PAIRS.map(
        ([fg, bg]) => {
          const cell = (dark: boolean) => {
            const value = ratio(roleValue(fg, dark), roleValue(bg, dark))
            const grade = value >= 7 ? 'AAA' : value >= 4.5 ? 'AA' : 'AA large'
            return `<td><span class="contrast-chip" style="color:${roleValue(fg, dark)};background:${roleValue(bg, dark)}">Aa</span> <span class="g-num">${value.toFixed(2)} : 1</span> <span class="g-badge${grade === 'AAA' ? ' g-badge--success' : ''}">${grade}</span></td>`
          }
          return `<tr><td><code>--g-${fg}</code> / <code>--g-${bg}</code></td>${cell(false)}${cell(true)}</tr>`
        },
      ).join('')}</tbody></table></div>`,
    // The sign-in email itself, live and unclickable, as the email page's specimen.
    emailArt: () =>
      `<iframe class="page-art-email" title="" tabindex="-1" scrolling="no" srcdoc="${SAMPLES.code.html.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}"></iframe>`,
    emailPreviews: () =>
      Object.entries(SAMPLES)
        .map(
          ([id, message], i) =>
            `<iframe class="email-preview" data-email="${id}" title="${html(t(`email.previews.${id}`))}" srcdoc="${message.html.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}" loading="lazy"${i ? ' hidden' : ''}></iframe>`,
        )
        .join(''),
    preferred: () =>
      `<a class="pref" data-link="preferred" target="_blank">${GOOGLE_G}<span>${t('footer.preferred')}</span></a>`,
    faq: () =>
      `<div class="faq-list">${questions(dict)
        .map(
          ({ q, a }) =>
            `\n          <details class="g-disclosure"><summary>${q}</summary><p>${a}</p></details>`,
        )
        .join('')}\n        </div>`,
  }

  return keepTogether(
    template
      .replace(
        /\{\{(@?)([\w.]+)(?::([\w-]+))?\}\}/g,
        (_, special: string, key: string, arg = '') => {
          if (!special) return html(t(key))
          const run = specials[key]
          if (!run) throw new Error(`No generator "@${key}" (${page.id})`)
          return run(arg)
        },
      )
      // Outbound links get their address at build time, so they work without script.
      .replace(/data-link=(["'])(\w+)\1/g, (_, _quote: string, key: string) => {
        const href = LINKS[key]
        if (!href) throw new Error(`No link named "${key}" (${page.id})`)
        return `href="${href}" rel="noopener"`
      })
      // Strings the script needs, read by src/main.ts.
      .replace(
        '</body>',
        `  <script type="application/json" id="strings">${JSON.stringify({
          copied: t('foundations.colour.copied'),
          iconCopied: t('icons.copied'),
          prefs: dict.prefs,
          consent: dict.consent,
        }).replaceAll('<', '\\u003c')}</script>\n  </body>`,
      ),
  )
}

/** Names that never break across lines, in every language. */
const UNBROKEN = ['Shades Media Group', 'Shades Day']

/** Joins the words of UNBROKEN names with no-break spaces in the visible body, never inside scripts. */
function keepTogether(page: string): string {
  const start = page.indexOf('<body')
  const parts = page.slice(start).split(/(<script[\s\S]*?<\/script>)/)
  const body = parts
    .map((part) =>
      part.startsWith('<script')
        ? part
        : UNBROKEN.reduce(
            (text, name) => text.replaceAll(name, name.replaceAll(' ', '\u00a0')),
            part,
          ),
    )
    .join('')
  return page.slice(0, start) + body
}

/** The last commit that touched the site, so lastmod only moves when a page can have. */
function lastModified() {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', root], {
      encoding: 'utf8',
    }).trim()
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

/** Every page in every language, each listing all of its languages. */
function sitemap() {
  const lastmod = lastModified()
  const urls = PAGES.flatMap((page) =>
    LOCALES.map((locale) =>
      [
        '  <url>',
        `    <loc>${SITE}${pathOf(locale, page)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        ...LOCALES.map(
          (l) =>
            `    <xhtml:link rel="alternate" hreflang="${l.lang}" href="${SITE}${pathOf(l, page)}" />`,
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${pathOf(LOCALES[0], page)}" />`,
        '  </url>',
      ].join('\n'),
    ),
  )
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`
}

/** llms.txt, and llms-full.txt: the same facts plus the FAQ in English. */
function llms() {
  const summary = readFileSync(join(root, 'templates', 'llms.txt'), 'utf8').replaceAll(
    '{{@version}}',
    version,
  )
  const faq = questions(dictionary('en'))
    .map(({ q, a }) => `### ${plain(q)}\n\n${plain(a)}`)
    .join('\n\n')
  return { summary, full: `${summary}\n## Frequently asked questions\n\n${faq}\n` }
}

/** Writes every page in every language and returns them as Rollup inputs. */
function generate(): Record<string, string> {
  checkDictionaries()
  const inputs: Record<string, string> = {}
  for (const locale of LOCALES) {
    for (const page of PAGES) {
      const file = join(root, pathOf(locale, page), 'index.html')
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, render(locale, page))
      inputs[`${page.id}-${locale.code}`] = file
    }
  }
  return inputs
}

export function pages(): Plugin {
  return {
    name: 'gradient-pages',
    config: () => ({ build: { rollupOptions: { input: generate() } } }),
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'preferences-boot.js',
        source: readFileSync(join(root, '../../packages/gradient/dist/preferences-boot.js')),
      })
      const { summary, full } = llms()
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap() })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: summary })
      this.emitFile({ type: 'asset', fileName: 'llms-full.txt', source: full })
      // The brand files, downloadable at stable addresses from the brand page.
      for (const file of [
        'shades-mark.svg',
        'shades-mark-mono.svg',
        'shades-lockup.svg',
        'shades-lockup-reverse.svg',
        'shades-lockup-mono.svg',
      ])
        this.emitFile({
          type: 'asset',
          fileName: `brand/${file}`,
          source: readFileSync(join(brand, file)),
        })
    },
    configureServer(server) {
      const sources = [join(root, 'templates'), join(root, 'i18n')]
      server.watcher.add(sources)
      server.watcher.on('change', (file) => {
        if (!sources.some((dir) => file.startsWith(dir))) return
        generate()
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}
