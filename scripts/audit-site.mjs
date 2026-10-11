// Audits the built website (apps/site/dist) before it can ship. Exits 1 with
// every problem it finds.
//
// - Search: lang, unique title and description, canonical, the full hreflang
//   set, Open Graph, JSON-LD that parses and matches what the page shows,
//   sitemap, robots.txt and llms files.
// - Speed: a byte budget per page for HTML, script and style, and no
//   third-party requests of any kind.
// - Access: one h1, no skipped heading levels, alt on every image, a name on
//   every button and link, unique ids, labelled form fields.
// - Links: every internal link and asset points at a file that exists.
//
// Usage: node scripts/audit-site.mjs [dist directory]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const SITE = 'https://gradient.shades.md'
const LANGS = { en: 'en', fr: 'fr', ro: 'ro', ru: 'ru', es: 'es', zh: 'zh-Hans' }
const HREFLANGS = [...Object.values(LANGS), 'x-default'].sort()
/** Compressed bytes a single page may cost, fonts excluded. */
const BUDGET = { html: 24_000, js: 12_000, css: 16_000 }

const dist = process.argv[2] ?? fileURLToPath(new URL('../apps/site/dist', import.meta.url))
if (!existsSync(dist)) {
  console.error(`No build at ${dist}. Run yarn build:site first.`)
  process.exit(1)
}
const errors = []
const fail = (where, message) => errors.push(`${where}: ${message}`)

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )
const files = walk(dist)
const pages = files.filter((file) => file.endsWith(`${sep}index.html`))

/** Path of a dist file on the site: dist/fr/brand/index.html → /fr/brand/. */
const pathOf = (file) =>
  `/${relative(dist, file).split(sep).slice(0, -1).join('/')}/`.replace('//', '/')
const local = (path) => {
  const clean = decodeURIComponent(path.split(/[?#]/)[0])
  if (clean.endsWith('/')) return existsSync(join(dist, clean, 'index.html'))
  return existsSync(join(dist, clean)) || existsSync(join(dist, clean, 'index.html'))
}
const exists = (url) => url.startsWith(`${SITE}/`) && local(url.slice(SITE.length))
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]
const tags = (html, pattern) => html.match(new RegExp(`<${pattern}(?=[\\s>/])[^>]*>`, 'g')) ?? []
const meta = (html, key, value) =>
  tags(html, 'meta')
    .filter((tag) => attr(tag, key) === value)
    .map((tag) => attr(tag, 'content'))
const decode = (text) =>
  text
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
const text = (html) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  )
const gz = (bytes) => gzipSync(bytes).length

const REQUIRED = {
  Organization: ['name', 'url'],
  WebSite: ['name', 'url'],
  WebPage: ['url', 'name', 'inLanguage'],
  SoftwareSourceCode: ['name', 'codeRepository', 'license'],
  FAQPage: ['mainEntity'],
  BreadcrumbList: ['itemListElement'],
}

function checkJsonLd(where, html, path) {
  const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? []
  if (!blocks.length) return fail(where, 'no JSON-LD')
  const nodes = []
  for (const block of blocks) {
    try {
      const data = JSON.parse(block.replace(/^<script[^>]*>|<\/script>$/g, ''))
      if (data['@context'] !== 'https://schema.org') fail(where, 'JSON-LD @context is not schema.org')
      nodes.push(...(data['@graph'] ?? [data]))
    } catch (error) {
      fail(where, `JSON-LD does not parse: ${error.message}`)
    }
  }
  const types = nodes.map((node) => node['@type'])
  for (const node of nodes)
    for (const field of REQUIRED[node['@type']] ?? [])
      if (node[field] === undefined || node[field] === '' || node[field]?.length === 0)
        fail(where, `${node['@type']} has no ${field}`)
  const isHome = /^\/([a-z]{2}\/)?$/.test(path)
  const expected = isHome
    ? ['Organization', 'WebSite', 'WebPage', 'SoftwareSourceCode', 'FAQPage']
    : ['Organization', 'WebSite', 'WebPage', 'BreadcrumbList']
  for (const type of expected) if (!types.includes(type)) fail(where, `JSON-LD has no ${type}`)
  const visible = text(html)
  for (const node of nodes) {
    if (node['@type'] === 'FAQPage')
      for (const question of node.mainEntity)
        if (!visible.includes(question.name)) fail(where, `FAQ question not on the page: ${question.name}`)
    if (node['@type'] === 'BreadcrumbList')
      node.itemListElement.forEach((item, i) => {
        if (item.position !== i + 1 || !item.name || !exists(item.item))
          fail(where, `breadcrumb ${i + 1} is incomplete or points nowhere`)
      })
  }
}

function checkAccess(where, html) {
  const body = html.slice(html.indexOf('<body'))
  const h1 = tags(body, 'h1').length
  if (h1 !== 1) fail(where, `${h1} h1 elements`)
  let last = 0
  for (const [, level] of body.matchAll(/<h([1-6])[\s>]/g)) {
    if (Number(level) > last + 1) fail(where, `heading jumps from h${last} to h${level}`)
    last = Number(level)
  }
  for (const img of tags(body, 'img')) if (attr(img, 'alt') === undefined) fail(where, `img without alt: ${img}`)
  for (const [, open, inner] of body.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g).map((m) => [m[0], m[2], m[3]])) {
    const named = attr(` ${open}`, 'aria-label') || text(inner).trim()
    if (!named) fail(where, `a button or link has no name: <${open.slice(0, 80)}>`)
  }
  const ids = [...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) fail(where, `duplicate id "${id}"`)
  for (const field of tags(body, '(?:input|select|textarea)')) {
    if (/type="(hidden|submit|button)"/.test(field)) continue
    const id = attr(field, 'id')
    const labelled =
      attr(field, 'aria-label') ||
      (id && body.includes(`for="${id}"`)) ||
      // A control wrapped in its label.
      /class="g-check/.test(body.slice(Math.max(0, body.indexOf(field) - 160), body.indexOf(field)))
    if (!labelled) fail(where, `form field without a label: ${field}`)
  }
}

function checkLinks(where, html) {
  for (const tag of [...tags(html, 'a'), ...tags(html, 'link'), ...tags(html, 'script'), ...tags(html, 'img')]) {
    const url = attr(tag, 'href') ?? attr(tag, 'src')
    if (!url || url.startsWith('#') || url.startsWith('mailto:')) continue
    if (url.startsWith('/')) {
      if (!local(url)) fail(where, `broken link ${url}`)
    } else if (url.startsWith(SITE)) {
      if (!exists(url) && !local(url.slice(SITE.length))) fail(where, `broken link ${url}`)
    } else if (/^(script|link|img)/.test(tag.slice(1)) && !/rel="(canonical|alternate)"/.test(tag)) {
      fail(where, `third-party resource ${url}`)
    }
  }
}

function checkBudget(where, html) {
  const own = (pattern) =>
    tags(html, pattern)
      .map((tag) => attr(tag, 'src') ?? attr(tag, 'href'))
      .filter((url) => url?.startsWith('/assets/'))
  const js = own('script').reduce((sum, url) => sum + gz(readFileSync(join(dist, url))), 0)
  const css = own('link').filter((url) => url.endsWith('.css')).reduce((sum, url) => sum + gz(readFileSync(join(dist, url))), 0)
  const page = gz(Buffer.from(html))
  if (page > BUDGET.html) fail(where, `HTML is ${page} B compressed (budget ${BUDGET.html})`)
  if (js > BUDGET.js) fail(where, `scripts are ${js} B compressed (budget ${BUDGET.js})`)
  if (css > BUDGET.css) fail(where, `styles are ${css} B compressed (budget ${BUDGET.css})`)
  return { page, js, css }
}

const titles = new Map()
const descriptions = new Map()
const sizes = []
for (const file of pages) {
  const path = pathOf(file)
  const where = path
  const html = readFileSync(file, 'utf8')
  const code = path.split('/')[1]
  const lang = LANGS[code] ?? 'en'

  if (attr(tags(html, 'html')[0] ?? '', 'lang') !== lang) fail(where, `<html lang> is not ${lang}`)
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim()
  if (!title) fail(where, 'no <title>')
  else if (titles.has(title)) fail(where, `same title as ${titles.get(title)}`)
  else titles.set(title, path)
  const [description] = meta(html, 'name', 'description')
  if (!description) fail(where, 'no meta description')
  else if (descriptions.has(description)) fail(where, `same description as ${descriptions.get(description)}`)
  else descriptions.set(description, path)

  const canonical = tags(html, 'link').find((tag) => attr(tag, 'rel') === 'canonical')
  if (attr(canonical ?? '', 'href') !== `${SITE}${path}`) fail(where, 'canonical is not this page')
  const alternates = tags(html, 'link').filter((tag) => attr(tag, 'rel') === 'alternate' && attr(tag, 'hreflang'))
  const hreflangs = alternates.map((tag) => attr(tag, 'hreflang')).sort()
  if (hreflangs.join() !== HREFLANGS.join()) fail(where, `hreflang set is ${hreflangs.join(', ')}`)
  for (const tag of alternates) if (!exists(attr(tag, 'href'))) fail(where, `hreflang ${attr(tag, 'hreflang')} points nowhere`)
  if (meta(html, 'property', 'og:url')[0] !== `${SITE}${path}`) fail(where, 'og:url is not this page')
  if (meta(html, 'property', 'og:locale:alternate').length !== 5) fail(where, 'og:locale:alternate does not list the other five languages')
  for (const key of ['og:title', 'og:description', 'og:image'])
    if (!meta(html, 'property', key)[0]) fail(where, `no ${key}`)
  if (!meta(html, 'name', 'twitter:card')[0]) fail(where, 'no twitter:card')

  checkJsonLd(where, html, path)
  checkAccess(where, html)
  checkLinks(where, html)
  sizes.push([path, checkBudget(where, html)])
}

// The English pages must not be served under another language's address.
for (const code of Object.keys(LANGS).filter((code) => code !== 'en')) {
  const en = readFileSync(join(dist, 'index.html'), 'utf8').match(/<h1>([\s\S]*?)<\/h1>/)?.[1]
  const other = readFileSync(join(dist, code, 'index.html'), 'utf8').match(/<h1>([\s\S]*?)<\/h1>/)?.[1]
  if (en === other) fail(`/${code}/`, 'the home page heading is still in English')
}

const read = (name) => (existsSync(join(dist, name)) ? readFileSync(join(dist, name), 'utf8') : '')
const robots = read('robots.txt')
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail('robots.txt', 'no Sitemap line')
if (/^Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt', 'disallows the whole site')
const sitemap = read('sitemap.xml')
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (locs.length !== pages.length - (existsSync(join(dist, '404', 'index.html')) ? 1 : 0))
  fail('sitemap.xml', `lists ${locs.length} pages, the build has ${pages.length}`)
for (const loc of locs) if (!exists(loc)) fail('sitemap.xml', `${loc} does not exist`)
for (const name of ['llms.txt', 'llms-full.txt'])
  if (!read(name).startsWith('# Gradient')) fail(name, 'missing or does not start with "# Gradient"')
if (!read('_headers').includes('Content-Security-Policy')) fail('_headers', 'no Content-Security-Policy')

// Never name competitors or call a product a copy in anything public.
const banned = [new RegExp(['html', 'to', 'design'].join('\\.'), 'i'), new RegExp(['div', 'riots'].join(''), 'i')]
for (const file of files.filter((f) => /\.(html|txt|xml|js|css)$/.test(f)))
  for (const pattern of banned)
    if (pattern.test(readFileSync(file, 'utf8'))) fail(relative(dist, file), `names a competitor (${pattern})`)

const total = files.reduce((sum, file) => sum + statSync(file).size, 0)
const heaviest = sizes.sort((a, b) => b[1].page - a[1].page)[0]
if (errors.length) {
  console.error(`Site audit failed with ${errors.length} problem(s):\n`)
  for (const error of errors) console.error(`  ${error}`)
  process.exit(1)
}
console.log(
  `Site audit passed: ${pages.length} pages in ${Object.keys(LANGS).length} languages, ${(total / 1024).toFixed(0)} KB on disk. ` +
    `Heaviest page ${heaviest[0]}: HTML ${heaviest[1].page} B, JS ${heaviest[1].js} B, CSS ${heaviest[1].css} B compressed.`,
)
