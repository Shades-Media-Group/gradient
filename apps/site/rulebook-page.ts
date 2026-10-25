/**
 * /rulebook: the Shades rulebook, rendered from the private workspace repo.
 *
 * The rules live as Markdown in ~/Documents/GitHub/shades/rulebook (the private
 * shades-workspace repo), so any agent can read them on GitHub and the page
 * here is only a view of them. The page is internal: noindex, outside the
 * sitemap, linked from nowhere. Where the folder is missing (a public CI run),
 * the site builds without it.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { marked } from 'marked'

export const RULEBOOK = join(import.meta.dirname, '../../../rulebook')

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

interface Chapter {
  id: string
  title: string
  intro: string
  sections: { id: string; title: string; body: string }[]
}

/** Each numbered file is a chapter; each `##` inside it is a section. */
function chapters(): Chapter[] {
  return readdirSync(RULEBOOK)
    .filter((file) => /^\d\d-.+\.md$/.test(file))
    .sort()
    .map((file) => {
      const id = file.slice(3, -3)
      // Links are written for GitHub (file.md#heading); on this one page they
      // point at the chapter and section anchors instead.
      const source = readFileSync(join(RULEBOOK, file), 'utf8')
        .replace(/\]\(#([^)]+)\)/g, `](#${id}--$1)`)
        .replace(/\]\(\.?\/?\d\d-([^)#]+)\.md#([^)]+)\)/g, '](#$1--$2)')
        .replace(/\]\(\.?\/?\d\d-([^)#]+)\.md\)/g, '](#$1)')
        .replace(/\]\(\.?\/?README\.md(#[^)]*)?\)/g, '](#main)')
        .replace(/\]\(\.?\/?assets\//g, '](/rulebook/assets/')
      const [head, ...parts] = source.split(/^## /m)
      const title = plain(head!.match(/^# (.+)$/m)?.[1] ?? file)
      return {
        id,
        title,
        intro: marked.parse(head!.replace(/^# .+$/m, ''), { async: false }),
        sections: parts.map((part) => {
          const [line, ...rest] = part.split('\n')
          return {
            id: `${id}--${slug(line!)}`,
            title: plain(line!),
            body: marked.parse(rest.join('\n'), { async: false }),
          }
        }),
      }
    })
}

/** The whole page, or null when the rulebook isn't on this machine. */
export function rulebookPage(version: string): string | null {
  if (!existsSync(join(RULEBOOK, 'README.md'))) return null
  const book = chapters()
  const readme = marked.parse(
    readFileSync(join(RULEBOOK, 'README.md'), 'utf8').replace(/^# .+$/m, ''),
    { async: false },
  )
  const toc = book
    .map(
      (c) =>
        `<li><a href="#${c.id}">${escape(c.title)}</a><ol>${c.sections
          .map((s) => `<li><a href="#${s.id}">${escape(s.title)}</a></li>`)
          .join('')}</ol></li>`,
    )
    .join('')
  const body = book
    .map(
      (c) => `<section class="rb-chapter" id="${c.id}">
  <h2>${escape(c.title)}</h2>
  ${c.intro}
  ${c.sections
    .map(
      (s) => `<section class="rb-section" id="${s.id}">
    <h3><a href="#${s.id}">${escape(s.title)}</a></h3>
    ${s.body}
  </section>`,
    )
    .join('\n')}
</section>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="en" data-theme-default="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script vite-ignore src="/preferences-boot.js"></script>
    <title>Rulebook · Shades</title>
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta name="color-scheme" content="light dark" />
    <script type="module" src="/src/rulebook.ts"></script>
  </head>
  <body class="rb">
    <header class="rb-bar">
      <a class="rb-home" href="/">Gradient</a>
      <span class="rb-name">Rulebook</span>
      <span class="rb-note">Internal · ${escape(version)}</span>
      <label class="rb-find"><span class="rb-hidden">Find a rule</span>
        <input type="search" placeholder="Find a rule" autocomplete="off" spellcheck="false" />
      </label>
    </header>
    <div class="rb-layout">
      <nav class="rb-toc" aria-label="Contents">
        <details open><summary>Contents</summary><ol>${toc}</ol></details>
      </nav>
      <main class="rb-main" id="main">
        <header class="rb-head">
          <h1>The Shades rulebook</h1>
          ${readme}
        </header>
        <p class="rb-empty" hidden>No rule matches.</p>
        ${body}
      </main>
    </div>
  </body>
</html>
`
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
