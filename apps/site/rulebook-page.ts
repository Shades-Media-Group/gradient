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

function chapter(file: string, slugName: string, group: string): Chapter {
  const source = readFileSync(join(RULEBOOK, file), 'utf8')
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

function chapters(): Chapter[] {
  const numbered = readdirSync(RULEBOOK)
    .filter((file) => /^\d\d-.+\.md$/.test(file))
    .sort()
    .map((file) => {
      const n = Number(file.slice(0, 2))
      return chapter(file, file.slice(3, -3), n >= 75 && n < 80 ? 'Inspiration' : (GROUPS[file[0]!] ?? 'Reference'))
    })
  // The library's gallery is a page of its own in the Inspiration group, after its chapter.
  const at = numbered.map((c) => c.group).lastIndexOf('Inspiration')
  if (at >= 0 && libraryEntries().length)
    numbered.splice(at + 1, 0, { file: '', slug: 'inspiration', group: 'Inspiration', title: 'All pieces', lead: 'Every piece in the library, filtered by format, industry, idea and colour.', intro: '', sections: [] })
  return [...numbered, chapter('STYLE.md', 'style', 'Reference')]
}

const page = (o: {
  title: string
  version: string
  nav: string
  main: string
  toc?: string
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
      <span class="rb-note">Internal · ${escape(o.version)}</span>
      <label class="rb-find"><span class="rb-hidden">Find on this page</span>
        <input type="search" placeholder="Find on this page" autocomplete="off" spellcheck="false" />
      </label>
    </header>
    <div class="rb-layout${o.toc ? ' rb-layout--toc' : ''}">
      <nav class="rb-nav" aria-label="Rulebook">
        <details class="rb-nav-all" open><summary>All topics</summary>${o.nav}</details>
      </nav>
      <main class="rb-main" id="main">
        ${o.main}
        <p class="rb-empty" hidden>Nothing on this page matches.</p>
      </main>
      ${o.toc ?? ''}
    </div>
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
          <p class="rb-piece-source">${icon('link')}<a href="${escape(e.source.url)}">${escape(e.source.name)}</a> · ${escape(e.source.kind)} · ${escape(e.source.seen)}</p>
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
  return `<div class="rb-filters">${filters}</div><p class="rb-count"><span>${entries.length}</span> pieces</p><ul class="rb-pieces">${rows}</ul>`
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

/** The side menu: one fold per group, only the current one open. */
const navFor = (book: Chapter[], current?: string) => {
  const groups = [...new Set(book.map((c) => c.group))]
  return groups
    .map((g) => {
      const items = book.filter((c) => c.group === g)
      const open = items.some((c) => c.slug === current)
      return `<details class="rb-nav-fold"${open ? ' open' : ''}><summary>${escape(g)}</summary><ul>${items
        .map(
          (c) =>
            `<li><a href="/rulebook/${c.slug}/"${c.slug === current ? ' aria-current="page"' : ''}>${escape(c.title)}</a></li>`,
        )
        .join('')}</ul></details>`
    })
    .join('')
}

/** Every page of the rulebook, or [] when it isn't on this machine. */
export function rulebookPages(version: string): { path: string; html: string }[] {
  if (!existsSync(join(RULEBOOK, 'README.md'))) return []
  const book = chapters()
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
  const entryPages = entries.map((e) => ({
    path: `inspiration/${e.id}`,
    html: page({ title: e.title, version, nav: navFor(book, 'inspiration'), main: libraryEntryMain(e) }),
  }))
  return [{ path: '', html: home }, ...pages, ...entryPages]
}

/** Images and files the chapters link to, served under /rulebook/assets/. */
export function rulebookAssets(): { name: string; source: Buffer }[] {
  const dir = join(RULEBOOK, 'assets')
  if (!existsSync(dir)) return []
  const walk = (sub: string): string[] =>
    readdirSync(join(dir, sub), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(sub, e.name)) : [join(sub, e.name)],
    )
  return walk('').map((name) => ({ name, source: readFileSync(join(dir, name)) }))
}
