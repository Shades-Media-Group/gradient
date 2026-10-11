/**
 * Renders the raster files the site and the repository need, from the brand
 * SVGs and the package's own CSS, with Playwright's Chromium:
 *
 *   apps/site/public/social-card.png   1200 × 630, the link preview
 *   apps/site/public/apple-touch-icon.png 180 × 180
 *   apps/site/public/shades-mark.png      512 × 512, for structured data
 *   apps/site/public/email/shades-lockup.png 284 × 64, the email header
 *   assets/readme-banner-light.png        1600 × 560, README header
 *   assets/readme-banner-dark.png         1600 × 560
 *
 * Run with `yarn assets` after `yarn build`. Set PW_CHROMIUM_PATH to use a
 * Chromium other than Playwright's own.
 */
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const brand = (file) => readFileSync(join(root, 'packages/gradient/brand', file), 'utf8')
const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(root, 'node_modules', pkg, 'files', file)).toString('base64')}`

const display = font('@fontsource-variable/space-grotesk', 'space-grotesk-latin-wght-normal.woff2')
const body = font('@fontsource-variable/hanken-grotesk', 'hanken-grotesk-latin-wght-normal.woff2')
const mark = brand('shades-mark.svg')
const family = ['spectra', 'mera', 'sol', 'nova', 'sage', 'vio', 'sunny'].map((name) =>
  brand(`spectra/${name}.svg`),
)

const page = (width, height, content, dark = false) => `<!doctype html>
<html><head><style>
@font-face { font-family: Display; src: url(${display}); font-weight: 300 700; }
@font-face { font-family: Body; src: url(${body}); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
html, body { width: ${width}px; height: ${height}px; overflow: hidden; }
body { background: ${dark ? '#0a0a0b' : '#fdfdfc'}; color: ${dark ? '#f5f5f3' : '#0a0a0b'}; font-family: Body; }
.spectrum { position: absolute; left: 0; right: 0; bottom: 0; height: 12px;
  background: linear-gradient(90deg, #6364ff, #d212d6 34%, #e40523 67%, #ff5900); }
svg { display: block; width: 100%; height: auto; }
</style></head><body>${content}</body></html>`

const card = (width, height, dark) =>
  page(
    width,
    height,
    `<div style="position:absolute; inset:0; display:grid; grid-template-columns: 1fr auto; gap: ${width * 0.05}px; align-items:center; padding: 0 ${width * 0.07}px;">
      <div>
        <div style="width:${height * 0.15}px; margin-bottom:${height * 0.07}px">${mark}</div>
        <h1 style="font: 700 ${height * 0.25}px/0.88 Display; letter-spacing:-0.05em">Gradient</h1>
        <p style="margin-top:${height * 0.05}px; font-size:${height * 0.055}px; color:${dark ? '#c8c8cd' : '#3a3a40'}; white-space:nowrap">The Shades Media Group design system</p>
      </div>
      <div style="display:flex; align-items:flex-end; gap:${width * 0.004}px; width:${width * 0.32}px">
        ${family
          .slice(0, 4)
          .map((svg) => `<div style="flex:1">${svg}</div>`)
          .join('')}
      </div>
    </div>
    <div class="spectrum"></div>`,
    dark,
  )

// The link preview: the studio shot of the cards (yarn renders og) under the name,
// set huge and cut by the bottom edge, with the spectrum as a trim.
const shot = `data:image/webp;base64,${readFileSync(join(root, 'apps/site/public/renders/og-1200.webp')).toString('base64')}`
const preview = page(
  1200,
  630,
  `<div style="position:absolute; inset:0; background:#141416 url(${shot}) center / cover"></div>
  <div style="position:absolute; left:64px; top:56px; display:flex; align-items:center; gap:16px; color:#ECECEA; font:600 22px/1 Body">
    <div style="width:40px">${mark}</div>The Shades Media Group design system
  </div>
  <h1 style="position:absolute; left:52px; bottom:-18px; margin:0; color:#ECECEA; font:700 236px/0.9 Display; letter-spacing:-0.065em">Gradient</h1>
  <div class="spectrum" style="height:6px"></div>`,
  true,
)

const square = (size, pad) =>
  page(
    size,
    size,
    `<div style="width:${size}px; height:${size}px; padding:${pad}px; background:#e40523">${mark.replace('<rect width="56" height="56" fill="#E40523"/>', '')}</div>`,
  )

const JOBS = [
  ['apps/site/public/social-card.png', 1200, 630, preview],
  ['assets/readme-banner-light.png', 1600, 560, card(1600, 560, false)],
  ['assets/readme-banner-dark.png', 1600, 560, card(1600, 560, true)],
  ['apps/site/public/apple-touch-icon.png', 180, 180, square(180, 0)],
  ['apps/site/public/shades-mark.png', 512, 512, square(512, 0)],
  // The email header: Gmail shows no SVG, so the lockup ships as a PNG at twice its size.
  [
    'apps/site/public/email/shades-lockup.png',
    284,
    64,
    page(284, 64, brand('shades-lockup.svg')).replace(
      'body { background: #fdfdfc;',
      'body { background: transparent;',
    ),
  ],
]

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
)
for (const [out, width, height, html] of JOBS) {
  const tab = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await tab.setContent(html)
  await tab.evaluate(() => document.fonts.ready)
  mkdirSync(dirname(join(root, out)), { recursive: true })
  await tab.screenshot({ path: join(root, out), omitBackground: out.includes('/email/') })
  await tab.close()
  console.log(`Wrote ${out}`)
}
await browser.close()
