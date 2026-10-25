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
  '1': 'Foundations',
  '2': 'Writing',
  '3': 'Patterns',
  '4': 'Working together',
  '5': 'Brands',
  '6': 'AI and tools',
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
    .replace(/\]\(\.?\/?(assets|proposals|sources)\//g, (_, dir: string) =>
      dir === 'assets' ? '](/rulebook/assets/' : `](https://github.com/Shades-Media-Group/shades-workspace/blob/main/rulebook/${dir}/`,
    )

/** A colour written as `#RRGGBB` gets its swatch. */
const swatches = (html: string) =>
  html.replace(
    /<code>(#[0-9A-Fa-f]{6})<\/code>/g,
    '<code class="rb-hex"><span class="rb-swatch" style="background:$1"></span>$1</code>',
  )

/** A paragraph of images only becomes a captioned gallery; the alt text is the caption. */
const galleries = (html: string) =>
  html.replace(/<p>((?:\s*<img [^>]+>\s*)+)<\/p>/g, (_, imgs: string) => {
    const figures = [...imgs.matchAll(/<img [^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g)].map(
      ([, src, alt]) => `<figure><img src="${src}" alt="" loading="lazy" decoding="async" /><figcaption>${alt}</figcaption></figure>`,
    )
    return `<div class="rb-gallery">${figures.join('')}</div>`
  })

const render = (md: string) =>
  galleries(swatches(ruleBlocks(marked.parse(relink(md), { async: false }))))

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
    .map((file) => chapter(file, file.slice(3, -3), GROUPS[file[0]!] ?? 'Reference'))
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
      html: page({
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
  return [{ path: '', html: home }, ...pages]
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
