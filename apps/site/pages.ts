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
    `<meta property="og:image" content="${SITE}/social-preview.png" />`,
    '<meta property="og:image:width" content="1280" />',
    '<meta property="og:image:height" content="640" />',
    `<meta property="og:image:alt" content="${image}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${SITE}/social-preview.png" />`,
    `<meta name="twitter:image:alt" content="${image}" />`,
    `<script type="application/ld+json">${json}</script>`,
  ].join('\n    ')
}

const NAV: PageId[] = ['brand', 'foundations', 'components', 'icons', 'print', 'projects']

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
        <summary aria-label="${html(t('nav.menu'))}">${icon('menu')}</summary>
        <nav class="nav-sheet" aria-label="${html(t('nav.label'))}">${navLinks}</nav>
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
            <li><a href="${to('projects')}">${t('nav.projects')}</a></li>
            <li><a href="${LINKS.pagerecast}" rel="noopener">PageRecast</a></li>
            <li><a href="${SHADES}" rel="noopener">shades.md</a></li>
          </ul></div>
          <div><p class="footer-h">${t('footer.code')}</p><ul>
            <li><a href="${REPO}" rel="noopener">GitHub</a></li>
            <li><a href="${LINKS.npm}" rel="noopener">npm</a></li>
            <li><a href="${LINKS.changelog}" rel="noopener">${t('footer.changelog')}</a></li>
            <li><a href="${LINKS.issues}" rel="noopener">${t('footer.issues')}</a></li>
          </ul></div>
          <div><p class="footer-h">${t('footer.legal')}</p><ul>
            <li><a href="${LINKS.license}" rel="noopener">${t('footer.license')}</a></li>
            <li><a href="${LINKS.trademarks}" rel="noopener">${t('footer.trademarks')}</a></li>
            <li><a href="${LINKS.security}" rel="noopener">${t('footer.security')}</a></li>
          </ul></div>
        </nav>
      </div>
      <nav class="footer-langs" aria-label="${html(t('language'))}"><ul>${langLinks}</ul></nav>
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
    faq: () =>
      `<div class="faq-list">${questions(dict)
        .map(
          ({ q, a }) =>
            `\n          <details class="g-disclosure"><summary>${q}</summary><p>${a}</p></details>`,
        )
        .join('')}\n        </div>`,
  }

  return (
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
          sent: t('home.parts.sent'),
          emailError: t('home.parts.emailError'),
          prefs: dict.prefs,
          consent: dict.consent,
        }).replaceAll('<', '\\u003c')}</script>\n  </body>`,
      )
  )
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
