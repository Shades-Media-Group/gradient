/**
 * Opens every built page in every language at phone and desktop widths and
 * fails on horizontal overflow, console errors, failed requests and missing
 * fonts. Serves apps/site/dist itself, so run it after `yarn build:site`.
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
const LANGS = ['', 'fr/', 'ro/', 'ru/', 'es/', 'zh/']
const PAGES = ['', 'brand/', 'foundations/', 'components/', 'icons/', 'print/', 'projects/']
const WIDTHS = [375, 1440]
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
              !el.closest('.footer-word, .split-sticky, .g-code, .roles, pre')
            )
          })
          .slice(0, 3)
          .map(
            (el) =>
              `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 30)}"`,
          )
        const fonts = [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family)
        return { overflow: root.scrollWidth - root.clientWidth, wide, fonts }
      })
      if (result.overflow > 1)
        problems.push(`${path} @${width}: page is ${result.overflow}px too wide`)
      for (const el of result.wide) problems.push(`${path} @${width}: sticks out: ${el}`)
      for (const font of result.fonts) problems.push(`${path} @${width}: font failed: ${font}`)
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
  `Layout audit passed: ${LANGS.length * PAGES.length} pages at ${WIDTHS.join(' and ')} px, no overflow, no errors.`,
)
