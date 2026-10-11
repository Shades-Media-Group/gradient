/**
 * Opens every built page in every language at four widths, from a small
 * phone to a desktop, and fails on horizontal overflow, console errors,
 * failed requests, missing fonts and wrapped text whose lines drift apart. Serves apps/site/dist itself, so run it after `yarn build:site`.
 * Set PW_CHROMIUM_PATH to use a Chromium other than Playwright's own.
 *
 * Usage: node scripts/audit-layout.mjs
 */
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const dist = fileURLToPath(new URL('../apps/site/dist', import.meta.url))
const LANGS = ['', 'fr/', 'ro/', 'ru/', 'es/', 'it/', 'tr/', 'hi/', 'ja/', 'zh/', 'zh-hant/']
const PAGES = [
  '',
  'brand/',
  'foundations/',
  'components/',
  'icons/',
  'print/',
  'email/',
  'accessibility/',
  'projects/',
]
// A small phone, a tablet, a small laptop and a desktop.
const WIDTHS = [320, 768, 1024, 1440]
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
}

const server = createServer((req, res) => {
  let file = join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) return res.writeHead(404).end()
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
}).listen(0)
const base = `http://localhost:${server.address().port}`

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
)
const problems = []
for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 } })
  for (const lang of LANGS)
    for (const page of PAGES) {
      const path = `/${lang}${page}`
      const tab = await context.newPage()
      tab.on(
        'console',
        (msg) =>
          msg.type() === 'error' && problems.push(`${path} @${width}: console: ${msg.text()}`),
      )
      tab.on('pageerror', (error) => problems.push(`${path} @${width}: ${error.message}`))
      tab.on('requestfailed', (req) => problems.push(`${path} @${width}: failed ${req.url()}`))
      tab.on(
        'response',
        (res) =>
          res.status() >= 400 && problems.push(`${path} @${width}: ${res.status()} ${res.url()}`),
      )
      await tab.goto(base + path, { waitUntil: 'networkidle' })
      const result = await tab.evaluate(async () => {
        await document.fonts.ready
        const root = document.documentElement
        const wide = [...document.querySelectorAll('body *')]
          .filter((el) => {
            const r = el.getBoundingClientRect()
            return (
              r.width > 0 &&
              r.right > root.clientWidth + 1 &&
              !el.closest(
                '.footer-word, .split-sticky, .g-code, .roles, .table-scroll, .g-tabs, .merch, .products, #index, pre',
              )
            )
          })
          .slice(0, 3)
          .map(
            (el) =>
              `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 30)}"`,
          )
        const fonts = [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family)
        // Wrapped inline text whose lines sit far apart: small text inside a block
        // that keeps the page's larger line height.
        const loose = []
        for (const el of document.querySelectorAll('main *, footer *')) {
          if (el.closest('svg, pre, iframe')) continue
          const cs = getComputedStyle(el)
          if (cs.display !== 'inline') continue
          if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
          const rects = el.getClientRects()
          if (rects.length < 2) continue
          const pitch = rects[1].top - rects[0].top
          if (pitch > parseFloat(cs.fontSize) * 1.65)
            loose.push(
              `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 30)}"`,
            )
        }
        return {
          overflow: root.scrollWidth - root.clientWidth,
          wide,
          fonts,
          loose: loose.slice(0, 3),
        }
      })
      if (result.overflow > 1)
        problems.push(`${path} @${width}: page is ${result.overflow}px too wide`)
      for (const el of result.wide) problems.push(`${path} @${width}: sticks out: ${el}`)
      for (const font of result.fonts) problems.push(`${path} @${width}: font failed: ${font}`)
      for (const el of result.loose) problems.push(`${path} @${width}: lines too far apart: ${el}`)
      await tab.close()
    }
  await context.close()
}
await browser.close()
server.close()

if (problems.length) {
  console.error(`Layout audit failed with ${problems.length} problem(s):\n`)
  for (const problem of [...new Set(problems)]) console.error(`  ${problem}`)
  process.exit(1)
}
console.log(
  `Layout audit passed: ${LANGS.length * PAGES.length} pages at ${WIDTHS.join(', ')} px, no overflow, no errors.`,
)
