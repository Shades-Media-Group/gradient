/**
 * /rulebook: the Shades rulebook, rendered from the private workspace repo.
 *
 * The rules live as Markdown in ~/Documents/GitHub/shades/rulebook (the private
 * shades-workspace repo), so any agent can read them on GitHub; these pages are
 * only a view of them. One home page lists the groups; each chapter is its own
 * page, with the groups beside it. Everything is internal: noindex, outside the
 * sitemap, linked from nowhere. Where the folder is missing (a public CI run),
 * the site builds without it.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { marked } from 'marked'

export const RULEBOOK = join(import.meta.dirname, '../../../rulebook')

/** The first digit of a chapter's number picks its group. */
const GROUPS: Record<string, string> = {
  '0': 'Start here',
  '1': 'Craft',
  '2': 'Writing',
  '3': 'Systems',
  '4': 'Engineering',
  '5': 'Brands',
  '6': 'Tools',
  '7': 'Library',
  '8': 'Review',
  '9': 'Reference',
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')

const plain = (text: string) => text.replace(/[*_`]/g, '').trim()

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const ICON = {
  do: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  avoid:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  dev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 7-5 5 5 5M16 7l5 5-5 5"/></svg>',
  example:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h7"/></svg>',
}

/** "**Do**" followed by a list becomes a labelled rule block. */
const ruleBlocks = (html: string) =>
  html.replace(
    /<p><strong>(Do|Avoid|For developers|Example)<\/strong><\/p>\s*(<ul>[\s\S]*?<\/ul>|<p>[\s\S]*?<\/p>)/g,
    (_, label: string, body: string) => {
      const kind = { Do: 'do', Avoid: 'avoid', 'For developers': 'dev', Example: 'example' }[label]!
      return `<div class="rb-rule rb-rule--${kind}"><p class="rb-rule-label">${ICON[kind as keyof typeof ICON]}${label}</p>${body}</div>`
    },
  )

/** Links are written for GitHub (file.md#heading); here they point at the pages. */
const relink = (md: string) =>
  md
    .replace(/\]\(\.?\/?\d\d-([^)#]+)\.md(#[^)]+)?\)/g, (_, name: string, hash = '') => `](/rulebook/${name}/${hash})`)
    .replace(/\]\(\.?\/?README\.md(#[^)]*)?\)/g, '](/rulebook/)')
    .replace(/\]\(\.?\/?STYLE\.md(#[^)]*)?\)/g, '](/rulebook/style/)')
    .replace(/\]\(\.?\/?(assets|proposals|sources|checks)\//g, (_, dir: string) =>
      dir === 'assets' ? '](/rulebook/assets/' : `](https://github.com/Shades-Media-Group/shades-workspace/blob/main/rulebook/${dir}/`,
    )

/** A colour written as `#RRGGBB` gets its swatch. */
const swatches = (html: string) =>
  html.replace(
    /<code>(#[0-9A-Fa-f]{6})<\/code>/g,
    '<code class="rb-hex"><span class="rb-swatch" style="background:$1"></span>$1</code>',
  )

/** A paragraph of images only becomes a captioned gallery; the alt text is the caption.
 *  Diagrams (SVG) are shown whole, never cropped like photographs. */
const galleries = (html: string) =>
  html.replace(/<p>((?:\s*<img [^>]+>\s*)+)<\/p>/g, (_, imgs: string) => {
    const found = [...imgs.matchAll(/<img [^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g)]
    const figures = found.map(
      ([, src, alt]) => `<figure><img src="${src}" alt="" loading="lazy" decoding="async" /><figcaption>${alt}</figcaption></figure>`,
    )
    // Diagrams and pattern art show whole; only photographs are cropped to one shape.
    const diagram = found.every(([, src]) => src?.endsWith('.svg') || src?.includes('/patterns/') || src?.includes('/library/'))
    const library = found.every(([, src]) => src?.includes('/library/'))
    return `<div class="rb-gallery${diagram ? ' rb-gallery--diagram' : ''}${library ? ' rb-gallery--library' : ''}">${figures.join('')}</div>`
  })

/** Index just past the sentence that starts at `from` in a paragraph's HTML, outside tags; -1 if none. */
function sentenceEnd(html: string, from = 0) {
  let depth = 0
  for (let i = from; i < html.length; i++) {
    const c = html[i]!
    if (c === '<') {
      const end = html.indexOf('>', i)
      const tag = html.slice(i, end + 1)
      if (tag.startsWith('</')) depth--
      else if (!tag.endsWith('/>') && !/^<(br|img|wbr)\b/.test(tag)) depth++
      i = end
      continue
    }
    if (depth === 0 && /[.?!:]/.test(c) && html[i + 1] === ' ' && /[A-Z0-9("“`<]/.test(html[i + 2] ?? '')) {
      if (/\b(e\.g|i\.e|etc|vs)$/i.test(html.slice(Math.max(0, i - 4), i))) continue
      return i + 1
    }
  }
  return -1
}

const textOf = (html: string) => html.replace(/<[^>]+>/g, '')

/** Where the dark lead of a block ends: after its first sentence, or after the second when the
 *  first is a short lead-in (a bold label, a three-word opener). -1 when it has one sentence. */
function leadEnd(html: string) {
  const first = sentenceEnd(html)
  if (first < 0) return -1
  if (textOf(html.slice(0, first)).length < 70) {
    const second = sentenceEnd(html, first + 1)
    if (second > 0) return second
  }
  return first
}

/** Reading tiers, everywhere text runs: the lead carries the point in the text colour; what
 *  follows explains it in the second tier, and asides in brackets drop to the third. A reader
 *  who gets the point can skip the rest. */
const tier = (inner: string) => {
  const at = leadEnd(inner)
  if (at < 0 || textOf(inner.slice(at)).length < 24) return null
  const rest = inner.slice(at).replace(/ \(([^()<>]{3,})\)/g, ' <span class="rb-aside">($1)</span>')
  return `${inner.slice(0, at)}<span class="rb-more">${rest}</span>`
}
const tiers = (html: string) =>
  html.replace(/<(p|li|dd)>((?:(?!<\/?(?:ul|ol|p|li|dd)\b)[\s\S])*?)<\/\1>/g, (whole, tag: string, inner: string) => {
    const t = tier(inner)
    return t ? `<${tag}>${t}</${tag}>` : whole
  })

const render = (md: string) =>
  tiers(galleries(swatches(ruleBlocks(marked.parse(relink(md), { async: false })))))

/** The sentence that opens a section reads as its subtitle. */
const subtitle = (html: string) => html.replace(/^\s*<p>/, '<p class="rb-sub">')

interface Chapter {
  file: string
  slug: string
  group: string
  title: string
  lead: string
  intro: string
  sections: { id: string; title: string; body: string }[]
}

/** Splits at `## ` headings, but never inside a fenced code block. */
function splitSections(source: string): string[] {
  const out: string[] = ['']
  let fenced = false
  for (const line of source.split('\n')) {
    if (/^(```|~~~)/.test(line)) fenced = !fenced
    if (!fenced && line.startsWith('## ')) out.push(line.slice(3) + '\n')
    else out[out.length - 1] += line + '\n'
  }
  return out
}

function chapter(file: string, slugName: string, group: string, text?: string): Chapter {
  const source = text ?? readFileSync(join(RULEBOOK, file), 'utf8')
  const [head, ...parts] = splitSections(source)
  const title = plain(head!.match(/^# (.+)$/m)?.[1] ?? file)
  const introMd = head!.replace(/^# .+$/m, '').trim()
  const lead = plain(introMd.split(/\n\s*\n/)[0] ?? '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  return {
    file,
    slug: slugName,
    group,
    title,
    lead,
    intro: render(introMd),
    sections: parts.map((part) => {
      const [line, ...rest] = part.split('\n')
      return { id: slug(line!), title: plain(line!), body: subtitle(render(rest.join('\n'))) }
    }),
  }
}

/** A chapter file's group: its number's tens, with 75–79 as Inspiration. */
const groupOf = (file: string) => {
  if (!/^\d\d-/.test(file)) return 'Reference'
  const n = Number(file.slice(0, 2))
  return n >= 75 && n < 80 ? 'Inspiration' : (GROUPS[file[0]!] ?? 'Reference')
}
const slugOf = (file: string) => (file === 'STYLE.md' ? 'style' : file.slice(3, -3))

function chapters(): Chapter[] {
  const numbered = readdirSync(RULEBOOK)
    .filter((file) => /^\d\d-.+\.md$/.test(file))
    .sort()
    .map((file) => chapter(file, file.slice(3, -3), groupOf(file)))
  // The library's gallery is a page of its own in the Inspiration group, after its chapter.
  const at = numbered.map((c) => c.group).lastIndexOf('Inspiration')
  if (at >= 0 && libraryEntries().length)
    numbered.splice(at + 1, 0, { file: '', slug: 'inspiration', group: 'Inspiration', title: 'All pieces', lead: 'Every piece in the library, filtered by format, industry, idea and colour.', intro: '', sections: [] })
  return [...numbered, chapter('STYLE.md', 'style', 'Reference')]
}

/** The version button in the bar and its list, filled once per build. */
let VERSION_UI = { button: '', dialog: '' }
const when = (iso: string) => iso.replace('T', ' ').replace(/([+-]\d\d:\d\d|Z)$/, '')

const page = (o: {
  title: string
  version: string
  nav: string
  main: string
  toc?: string
  banner?: string
}) => `<!doctype html>
<html lang="en" data-theme-default="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script vite-ignore src="/preferences-boot.js"></script>
    <title>${escape(o.title)} · Shades rulebook</title>
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="color-scheme" content="light dark" />
    <script type="module" src="/src/rulebook.ts"></script>
  </head>
  <body class="rb">
    <header class="rb-bar">
      <a class="rb-name" href="/rulebook/">Shades rulebook</a>
      <span class="rb-note">Internal · Gradient ${escape(o.version)}</span>
      ${VERSION_UI.button}
      <button type="button" class="rb-search-open" aria-haspopup="dialog">${icon('search')}<span>Search the rulebook</span><kbd>⌘K</kbd></button>
      <button type="button" class="rb-menu-open" aria-label="Topics" aria-expanded="false">${icon('menu')}</button>
    </header>
    <div class="rb-layout${o.toc ? ' rb-layout--toc' : ''}">
      <nav class="rb-nav" aria-label="Rulebook">
        ${VERSION_UI.button ? `<a class="rb-nav-versions" href="/rulebook/versions/">${VERSION_UI.button.replace(/<[^>]+>/g, '')} · all versions</a>` : ''}<details class="rb-nav-all" open><summary>All topics</summary>${o.nav}</details>
      </nav>
      <main class="rb-main" id="main">
        ${o.banner ?? ''}
        ${o.main}
        <p class="rb-empty" hidden>Nothing on this page matches.</p>
      </main>
      ${o.toc ?? ''}
    </div>
    ${VERSION_UI.dialog}
    ${o.toc ? `<button type="button" class="rb-toc-open" aria-expanded="false">${icon('menu')}On this page</button>` : ''}
    <div class="rb-backdrop" hidden></div>
    <dialog class="rb-lightbox" aria-label="Image preview"><button type="button" class="rb-lightbox-close" aria-label="Close preview">${icon('close')}</button><button type="button" class="rb-lightbox-prev" aria-label="Previous image">${icon('chevron-left')}</button><img alt="" /><button type="button" class="rb-lightbox-next" aria-label="Next image">${icon('chevron-right')}</button><p class="rb-lightbox-caption"></p></dialog>
    <dialog class="rb-search" aria-label="Search the rulebook">
      <div class="rb-search-box">${icon('search')}<input type="search" placeholder="Search rules, skills, pieces, versions" autocomplete="off" spellcheck="false" aria-label="Search" /><kbd>Esc</kbd></div>
      <ul class="rb-search-results" role="listbox"></ul>
      <p class="rb-search-hint">Type to search every chapter, section, inspiration piece and version. ↑ ↓ to move, Enter to open.</p>
    </dialog>
  </body>
</html>
`

// ── The inspiration library ──────────────────────────────────────────────────

interface Swatch { hex: string; pct: number; family: string }
interface Entry {
  id: string
  title: string
  source: { name: string; url: string; kind: string; seen: string }
  format: string
  industry: string
  ideas: string[]
  tags: string[]
  summary: string
  why: string
  borrow: string
  leave: string
  caption?: string
  study?: string
  palette?: Swatch[]
  images: { src: string; alt: string; palette?: Swatch[] }[]
  added?: string
}

/** Entries from library/entries/*.json, newest first; [] when the library is missing. */
function libraryEntries(): Entry[] {
  const dir = join(RULEBOOK, 'library/entries')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Entry)
    .sort((a, b) => b.id.localeCompare(a.id))
}

const asset = (src: string) => `/rulebook/${src}`
/** An icon from the design system's own set, inline so it takes the text colour. */
const icon = (name: string) =>
  readFileSync(join(import.meta.dirname, '../../packages/gradient/icons', `${name}.svg`), 'utf8')
    .replace('<svg ', '<svg class="rb-ico" aria-hidden="true" width="16" height="16" ')
const label = (path: string) => path.replace('/', ' · ').replace(/-/g, ' ')
const paletteBar = (p: Swatch[] = []) =>
  `<span class="rb-pal">${p.map((c) => `<span style="background:${c.hex};flex:${c.pct}" title="${escape(c.family)} ${c.pct}%"></span>`).join('')}</span>`

/** The gallery: every piece as a card, with filters for format, industry, idea and colour. */
function libraryGallery(entries: Entry[]) {
  const facet = (name: string, values: string[]) => {
    const unique = [...new Set(values)].sort()
    return `<fieldset class="rb-facet" data-facet="${name}"><legend>${name}</legend>${unique
      .map((v) => `<button type="button" class="rb-chip" data-value="${escape(v)}" aria-pressed="false">${escape(label(v))}</button>`)
      .join('')}</fieldset>`
  }
  const filters = [
    facet('format', entries.map((e) => e.format)),
    facet('industry', entries.map((e) => e.industry)),
    facet('idea', entries.flatMap((e) => e.ideas)),
    facet('colour', entries.flatMap((e) => (e.palette ?? []).filter((c) => c.pct >= 10).map((c) => c.family))),
  ].join('')
  const rows = entries
    .map((e) => {
      const data = `data-format="${escape(e.format)}" data-industry="${escape(e.industry)}" data-idea="${escape(e.ideas.join(' '))}" data-colour="${escape((e.palette ?? []).filter((c) => c.pct >= 10).map((c) => c.family).join(' '))}"`
      const thumbs = e.images.length > 1
        ? `<div class="rb-thumbs">${e.images.map((i, n) => `<button type="button" class="rb-thumb" data-src="${asset(i.src)}" aria-label="${escape(i.alt)}" aria-pressed="${n === 0}"><img src="${asset(i.src)}" alt="" loading="lazy" decoding="async" /></button>`).join('')}</div>`
        : ''
      const tags = [e.format, e.industry, ...e.ideas].map((t) => `<li>${escape(label(t))}</li>`).join('')
      const colours = (e.palette ?? []).filter((c) => c.pct >= 3).map((c) => `<li><span class="rb-swatch" style="background:${c.hex}"></span>${escape(c.family)} <span class="rb-num">${c.pct}%</span></li>`).join('')
      return `<li class="rb-piece" ${data}>
        <div class="rb-piece-media"><img class="rb-piece-main" src="${asset(e.images[0]!.src)}" alt="${escape(e.images[0]!.alt)}" loading="lazy" decoding="async" />${thumbs}</div>
        <div class="rb-piece-text">
          <ul class="rb-tags">${tags}</ul>
          <h2><a href="/rulebook/inspiration/${e.id}/">${escape(e.title)}</a></h2>
          <p class="rb-piece-source">${icon('link')}<a href="${escape(e.source.url)}">${escape(e.source.name)}</a> · ${escape(e.source.kind)} · added <time datetime="${escape(e.added ?? '')}">${escape(e.added ? when(e.added) : e.source.seen)}</time></p>
          ${tiers(`<p class="rb-piece-summary">${escape(e.summary)}</p>`.replace('<p class="rb-piece-summary">', '<p>')).replace('<p>', '<p class="rb-piece-summary">')}
          <div class="rb-takes">
            <div class="rb-take rb-take--why"><p class="rb-take-label">${icon('sparkle')}Why it works</p>${tiers(`<p>${escape(e.why)}</p>`)}</div>
            <div class="rb-take rb-take--borrow"><p class="rb-take-label">${icon('check')}Borrow</p>${tiers(`<p>${escape(e.borrow)}</p>`)}</div>
            <div class="rb-take rb-take--leave"><p class="rb-take-label">${icon('close')}Leave</p>${tiers(`<p>${escape(e.leave)}</p>`)}</div>
          </div>
          <div class="rb-piece-colours">${icon('palette')}${paletteBar(e.palette)}<ul class="rb-palette-inline">${colours}</ul></div>
          ${e.tags.length ? `<p class="rb-piece-notes">${e.tags.map(escape).join(' · ')}</p>` : ''}
        </div>
      </li>`
    })
    .join('')
  return `<div class="rb-filters">${filters}</div><div class="rb-gallery-bar"><p class="rb-count"><span>${entries.length}</span> pieces</p><label class="rb-view">View <select><option value="rows">Images and notes</option><option value="grid">Images only</option></select></label></div><ul class="rb-pieces">${rows}</ul><dialog class="rb-dialog" aria-label="Piece"><button type="button" class="rb-dialog-close" aria-label="Close">${icon('close')}</button><div class="rb-dialog-body"></div></dialog>`
}

/** One piece: its images, what it is, why it works, what to borrow and leave, its colours. */
function libraryEntryMain(e: Entry) {
  const rows = [
    ['Source', `<a href="${escape(e.source.url)}">${escape(e.source.name)}</a>, ${escape(e.source.kind)}, seen ${escape(e.source.seen)}`],
    ['Format', escape(label(e.format))],
    ['Industry', escape(label(e.industry))],
    ['Ideas', e.ideas.map((i) => escape(label(i))).join(', ')],
    ['Tags', e.tags.map(escape).join(', ')],
  ]
  const palette = (e.palette ?? []).map((c) => `<li><span class="rb-swatch" style="background:${c.hex}"></span>${escape(c.family)} <span class="rb-num">${c.pct}%</span> <code>${c.hex}</code></li>`).join('')
  return `<header class="rb-head"><p class="rb-crumb"><a href="/rulebook/inspiration/">Inspiration</a></p><h1>${escape(e.title)}</h1>${tiers(`<p>${escape(e.summary)}</p>`)}</header>
  <section class="rb-section"><div class="rb-gallery rb-gallery--diagram rb-gallery--library">${e.images.map((i) => `<figure><img src="${asset(i.src)}" alt="" loading="lazy" decoding="async" /><figcaption>${escape(i.alt)}</figcaption></figure>`).join('')}</div></section>
  <section class="rb-section"><h2>Why it works</h2>${tiers(`<p>${escape(e.why)}</p>`)}<h3>Borrow</h3><p>${escape(e.borrow)}</p><h3>Leave</h3><p>${escape(e.leave)}</p>${e.caption ? `<h3>Original caption</h3><p class="rb-more">${escape(e.caption)}</p>` : ''}</section>
  <section class="rb-section"><h2>Colours</h2><ul class="rb-palette-list">${palette}</ul></section>
  <section class="rb-section"><h2>Details</h2><dl class="rb-facts">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></section>`
}


// ── Versions of the rulebook ─────────────────────────────────────────────────
// Every update the Owner asks for is a version in rulebook/versions.json, pinned to a commit of
// the workspace repo. A version's pages show its chapters with what changed against the version
// before: blue added, green altered, red removed.

interface BookVersion { version: string; commit: string; date: string; title: string; notes: string }

const REPO = join(RULEBOOK, '..')
const git = (...args: string[]) => {
  try { return execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32 << 20 }) } catch { return null }
}

function bookVersions(): BookVersion[] {
  const f = join(RULEBOOK, 'versions.json')
  if (!existsSync(f) || git('rev-parse', '--git-dir') === null) return []
  return JSON.parse(readFileSync(f, 'utf8')) as BookVersion[]
}

const fileAt = (commit: string, file: string) => git('show', `${commit}:rulebook/${file}`)
const changedFiles = (from: string, to: string) =>
  (git('diff', '--name-status', from, to, '--', 'rulebook') ?? '')
    .split('\n').filter(Boolean)
    .map((l) => l.split('\t'))
    .map(([st, a, b]) => ({ status: st![0]!, file: (b ?? a!).replace(/^rulebook\//, ''), from: a!.replace(/^rulebook\//, '') }))
    .filter((c) => /^(\d\d-[^/]+|STYLE)\.md$/.test(c.file))

/** Longest common subsequence diff of two token lists. */
function lcs<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean) {
  const n = a.length, m = b.length
  const t = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i]![j] = eq(a[i]!, b[j]!) ? t[i + 1]![j + 1]! + 1 : Math.max(t[i + 1]![j]!, t[i]![j + 1]!)
  const ops: { op: 'same' | 'add' | 'del'; a?: T; b?: T }[] = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (eq(a[i]!, b[j]!)) ops.push({ op: 'same', a: a[i++], b: b[j++] })
    else if (t[i + 1]![j]! >= t[i]![j + 1]!) ops.push({ op: 'del', a: a[i++] })
    else ops.push({ op: 'add', b: b[j++] })
  }
  while (i < n) ops.push({ op: 'del', a: a[i++] })
  while (j < m) ops.push({ op: 'add', b: b[j++] })
  return ops
}

const PREFIX = /^(\s*(?:[-*]|\d+\.)\s+|#{1,6}\s+|>\s*)?(.*)$/
const plainLine = (l: string) => !l.trim() || /^\s*(\||!\[|```|<)/.test(l)

/** Words changed inside one line: new words green, old words struck through in red. */
function wordDiff(oldText: string, newText: string) {
  const ops = lcs(oldText.split(/(\s+)/), newText.split(/(\s+)/), (x, y) => x === y)
  let out = '', run: 'add' | 'del' | null = null, buf = ''
  const flush = () => {
    if (run && buf.trim()) out += run === 'add' ? `<ins class="rb-chg">${buf}</ins>` : `<del class="rb-del">${buf}</del>`
    else out += buf
    buf = ''; run = null
  }
  for (const o of ops) {
    const kind = o.op === 'same' ? null : o.op
    if (kind !== run) flush()
    run = kind
    buf += (o.op === 'del' ? o.a : o.b) ?? ''
  }
  flush()
  return out
}

/** The new markdown with the changes marked in place, and the headings of sections that changed. */
function annotate(oldMd: string, newMd: string) {
  const ops = lcs(oldMd.split('\n'), newMd.split('\n'), (x, y) => x === y)
  const out: string[] = []
  const touched = new Set<string>()
  const stats = { added: 0, changed: 0, removed: 0 }
  let section = '', fence = false
  const wrap = (line: string, cls: string, tag: 'ins' | 'del') => {
    const [, pre = '', body = ''] = line.match(PREFIX)!
    if (/^#{1,6}\s/.test(pre)) return line
    return `${pre}<${tag} class="${cls}">${body}</${tag}>`
  }
  for (let k = 0; k < ops.length; k++) {
    const o = ops[k]!
    const line = o.op === 'del' ? o.a! : o.b!
    if (o.op !== 'del' && /^```/.test(line)) fence = !fence
    if (o.op !== 'del' && /^## /.test(line)) section = line
    if (o.op === 'same') { out.push(line); continue }
    if (!line.trim()) { if (o.op === 'add') out.push(line); continue }
    touched.add(section)
    // A removed line followed by an added one is the same line, altered.
    const next = ops[k + 1]
    if (o.op === 'del' && next?.op === 'add' && !plainLine(o.a!) && !plainLine(next.b!) && !fence) {
      const [, preA = ''] = o.a!.match(PREFIX)!, [, preB = '', bodyB = ''] = next.b!.match(PREFIX)!
      if (preA.trim() === preB.trim() && !/^#/.test(preB)) {
        const [, , bodyA = ''] = o.a!.match(PREFIX)!
        out.push(`${preB}${wordDiff(bodyA, bodyB)}`); stats.changed++; k++; continue
      }
    }
    if (o.op === 'add') {
      stats.added++
      out.push(fence || plainLine(line) ? line : wrap(line, 'rb-add', 'ins'))
    } else {
      stats.removed++
      if (fence || plainLine(line)) continue
      if (/^#{1,6}\s/.test(line)) out.push(`<p><del class="rb-del">Removed section: ${line.replace(/^#+\s*/, '')}</del></p>`)
      else out.push(wrap(line, 'rb-del', 'del'))
    }
  }
  return { md: out.join('\n'), touched, stats }
}

/** The side menu: one fold per group, only the current one open. */
interface Marks { base: string; slugs: Map<string, 'add' | 'chg'> }
const navFor = (book: Chapter[], current?: string, marks?: Marks) => {
  const groups = [...new Set(book.map((c) => c.group))]
  return groups
    .map((g) => {
      const items = book.filter((c) => c.group === g)
      const open = items.some((c) => c.slug === current) || (marks && items.some((c) => marks.slugs.has(c.slug)))
      return `<details class="rb-nav-fold"${open ? ' open' : ''}><summary>${escape(g)}${marks && items.some((c) => marks.slugs.has(c.slug)) ? '<span class="rb-dot rb-dot--chg"></span>' : ''}</summary><ul>${items
        .map((c) => {
          const mark = marks?.slugs.get(c.slug)
          const href = mark ? `${marks!.base}${c.slug}/` : `/rulebook/${c.slug}/`
          return `<li><a href="${href}"${c.slug === current ? ' aria-current="page"' : ''}>${escape(c.title)}${mark ? `<span class="rb-dot rb-dot--${mark}" title="${mark === 'add' ? 'New in this version' : 'Changed in this version'}"></span>` : ''}</a></li>`
        })
        .join('')}</ul></details>`
    })
    .join('')
}

/** Every page of the rulebook, or [] when it isn't on this machine. */
export function rulebookPages(version: string): { path: string; html: string }[] {
  if (!existsSync(join(RULEBOOK, 'README.md'))) return []
  const book = chapters()
  const versions = bookVersions()
  const latest = versions[0]
  VERSION_UI = latest
    ? {
        button: `<button type="button" class="rb-version" aria-haspopup="dialog">Rulebook v${escape(latest.version)}</button>`,
        dialog: `<dialog class="rb-versions" aria-label="Rulebook versions"><div class="rb-versions-head"><h2>Rulebook versions</h2><button type="button" class="rb-dialog-close" aria-label="Close">${icon('close')}</button></div><p class="rb-legend"><span class="rb-add">Added</span><span class="rb-chg">Changed</span><span class="rb-del">Removed</span></p><ol class="rb-version-list">${versions
          .map((v, i) => `<li><a href="/rulebook/versions/${v.version}/"><span class="rb-version-num">v${escape(v.version)}${i === 0 ? ' · current' : ''}</span><strong>${escape(v.title)}</strong><span>${escape(v.notes)}</span><time datetime="${v.date}">${when(v.date)}</time></a></li>`)
          .join('')}</ol><p><a href="/rulebook/versions/">All versions</a></p></dialog>`,
      }
    : { button: '', dialog: '' }
  const readme = readFileSync(join(RULEBOOK, 'README.md'), 'utf8')
  const [readmeHead] = splitSections(readme)
  const groups = [...new Set(book.map((c) => c.group))]

  const home = page({
    title: 'Home',
    version,
    nav: navFor(book),
    main: `<header class="rb-head">
      <h1>Shades rulebook</h1>
      ${render(readmeHead!.replace(/^# .+$/m, ''))}
    </header>
    ${groups
      .map(
        (g) => `<section class="rb-group rb-section">
      <h2>${escape(g)}</h2>
      <ul class="rb-cards">${book
        .filter((c) => c.group === g)
        .map(
          (c) =>
            `<li><a href="/rulebook/${c.slug}/"><strong>${escape(c.title)}</strong><span>${escape(c.lead)}</span></a></li>`,
        )
        .join('')}</ul>
    </section>`,
      )
      .join('\n')}
    <section class="rb-section">${render(readme.slice(readmeHead!.length).replace(/^/, ''))}</section>`,
  })

  const entries = libraryEntries()
  const pages = book.map((c, i) => {
    const prev = book[i - 1]
    const next = book[i + 1]
    const toc = c.sections.length
      ? `<nav class="rb-toc" aria-label="On this page"><p>On this page</p><ul>${c.sections
          .map((s) => `<li><a href="#${s.id}">${escape(s.title)}</a></li>`)
          .join('')}</ul></nav>`
      : ''
    return {
      path: c.slug,
      html: c.slug === 'inspiration' ? page({
        title: c.title,
        version,
        nav: navFor(book, c.slug),
        main: `<header class="rb-head"><p class="rb-crumb">Inspiration</p><h1>All pieces</h1><p>Work the Owner liked, with why it works and the idea to borrow. Pick filters to narrow it; open a piece for its colours and notes.</p></header>${libraryGallery(entries)}`,
      }) : page({
        title: c.title,
        version,
        nav: navFor(book, c.slug),
        toc,
        main: `<header class="rb-head">
        <p class="rb-crumb">${escape(c.group)}</p>
        <h1>${escape(c.title)}</h1>
        ${c.intro}
      </header>
      ${c.sections
        .map(
          (s) => `<section class="rb-section" id="${s.id}">
        <h2><a href="#${s.id}">${escape(s.title)}</a></h2>
        ${s.body}
      </section>`,
        )
        .join('\n')}
      <nav class="rb-pager" aria-label="Next and previous">${prev ? `<a href="/rulebook/${prev.slug}/"><span>Previous</span>${escape(prev.title)}</a>` : '<span></span>'}${next ? `<a class="rb-next" href="/rulebook/${next.slug}/"><span>Next</span>${escape(next.title)}</a>` : ''}</nav>`,
      }),
    }
  })
  // A page per version (what changed, why, which chapters), and each changed chapter with its marks.
  const versionPages: { path: string; html: string }[] = []
  const legend = `<p class="rb-legend"><span class="rb-add">Added</span><span class="rb-chg">Changed</span><span class="rb-del">Removed</span></p>`
  versions.forEach((v, i) => {
    const prev = versions[i + 1]
    const base = `/rulebook/versions/${v.version}/`
    const changes = prev ? changedFiles(prev.commit, v.commit) : []
    const marks: Marks = { base, slugs: new Map() }
    const rows: string[] = []
    for (const c of changes) {
      const sl = slugOf(c.file)
      if (c.status === 'D') { rows.push(`<li><del class="rb-del">${escape(c.from)}</del> removed</li>`); continue }
      const newMd = fileAt(v.commit, c.file) ?? ''
      const oldMd = c.status === 'A' ? '' : (fileAt(prev!.commit, c.from) ?? '')
      const { md, touched, stats } = annotate(oldMd, newMd)
      const mark = c.status === 'A' || !oldMd ? 'add' : 'chg'
      marks.slugs.set(sl, mark)
      const ch = chapter(c.file, sl, groupOf(c.file), md)
      const ids = new Set([...touched].filter(Boolean).map((h) => slug(h.replace(/^## /, ''))))
      const toc = ch.sections.length
        ? `<nav class="rb-toc" aria-label="On this page"><p>On this page</p><ul>${ch.sections.map((x) => `<li${ids.has(x.id) ? ' class="rb-toc-changed"' : ''}><a href="#${x.id}">${escape(x.title)}</a></li>`).join('')}</ul></nav>`
        : ''
      const banner = `<aside class="rb-change-banner"><p><strong>v${escape(v.version)}</strong> · ${when(v.date)} · ${escape(v.title)}</p><p>${escape(v.notes)}</p>${legend}<p><a href="${base}">All changes in v${escape(v.version)}</a> · <a href="/rulebook/${sl}/">Current version of this page</a></p></aside>`
      versionPages.push({
        path: `versions/${v.version}/${sl}`,
        html: page({
          title: `${ch.title} · v${v.version}`, version, nav: navFor(book, sl, marks), toc, banner,
          main: `<header class="rb-head"><p class="rb-crumb">${escape(ch.group)}</p><h1>${escape(ch.title)}</h1>${ch.intro}</header>${ch.sections.map((x) => `<section class="rb-section${ids.has(x.id) ? ' rb-section--changed' : ''}" id="${x.id}"><h2><a href="#${x.id}">${escape(x.title)}</a></h2>${x.body}</section>`).join('\n')}`,
        }),
      })
      rows.push(`<li><a href="${base}${sl}/">${escape(ch.title)}</a> <span class="rb-dot rb-dot--${mark}"></span> <span class="rb-stats"><span class="rb-add">+${stats.added}</span> <span class="rb-chg">~${stats.changed}</span> <span class="rb-del">−${stats.removed}</span></span></li>`)
    }
    versionPages.push({
      path: `versions/${v.version}`,
      html: page({
        title: `Version ${v.version}`, version, nav: navFor(book, undefined, marks),
        main: `<header class="rb-head"><p class="rb-crumb"><a href="/rulebook/versions/">Versions</a></p><h1>v${escape(v.version)}: ${escape(v.title)}</h1><p>${escape(v.notes)}</p><p class="rb-version-meta"><time datetime="${v.date}">${when(v.date)}</time> · commit <code>${v.commit.slice(0, 7)}</code>${prev ? ` · compared with v${escape(prev.version)}` : ' · the first version'}</p>${legend}</header><section class="rb-section"><h2>Chapters that changed</h2>${rows.length ? `<ul class="rb-change-list">${rows.join('')}</ul>` : '<p>No chapter text changed; the update was to files around the chapters.</p>'}</section>`,
      }),
    })
  })
  if (versions.length)
    versionPages.push({
      path: 'versions',
      html: page({
        title: 'Versions', version, nav: navFor(book),
        main: `<header class="rb-head"><h1>Rulebook versions</h1><p>Every update the Owner asked for, newest first. Open one to see what changed, marked in place.</p>${legend}</header><section class="rb-section"><ol class="rb-version-list">${versions.map((v) => `<li><a href="/rulebook/versions/${v.version}/"><span class="rb-version-num">v${escape(v.version)}</span><strong>${escape(v.title)}</strong><span>${escape(v.notes)}</span><time datetime="${v.date}">${when(v.date)}</time></a></li>`).join('')}</ol></section>`,
      }),
    })

  const entryPages = entries.map((e) => ({
    path: `inspiration/${e.id}`,
    html: page({ title: e.title, version, nav: navFor(book, 'inspiration'), main: libraryEntryMain(e) }),
  }))
  return [{ path: '', html: home }, ...pages, ...entryPages, ...versionPages]
}

/** One record per chapter, section, inspiration piece and version, for the search window. */
function searchIndex() {
  const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim()
  const rows: { k: string; t: string; c: string; u: string; x: string }[] = []
  for (const ch of chapters()) {
    if (!ch.file) continue
    rows.push({ k: 'Chapter', t: ch.title, c: ch.group, u: `/rulebook/${ch.slug}/`, x: ch.lead })
    for (const sec of ch.sections) rows.push({ k: 'Section', t: sec.title, c: ch.title, u: `/rulebook/${ch.slug}/#${sec.id}`, x: text(sec.body).slice(0, 700) })
  }
  for (const e of libraryEntries())
    rows.push({ k: 'Inspiration', t: e.title, c: `${label(e.format)} · ${label(e.industry)}`, u: `/rulebook/inspiration/${e.id}/`, x: [e.summary, e.why, e.tags.join(' '), e.ideas.map(label).join(' '), (e.palette ?? []).map((c) => c.family).join(' ')].join(' ') })
  for (const v of bookVersions()) rows.push({ k: 'Version', t: `v${v.version}: ${v.title}`, c: when(v.date), u: `/rulebook/versions/${v.version}/`, x: v.notes })
  return JSON.stringify(rows)
}

/** Images and files the chapters link to, served under /rulebook/assets/. */
export function rulebookAssets(): { name: string; source: Buffer }[] {
  const dir = join(RULEBOOK, 'assets')
  if (!existsSync(dir)) return []
  const walk = (sub: string): string[] =>
    readdirSync(join(dir, sub), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(sub, e.name)) : [join(sub, e.name)],
    )
  return [...walk('').map((name) => ({ name, source: readFileSync(join(dir, name)) })), { name: 'search.json', source: Buffer.from(searchIndex()) }]
}
