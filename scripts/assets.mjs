/**
 * Renders the raster files the site and the repository need, from the brand
 * SVGs and the package's own CSS, with Playwright's Chromium:
 *
 *   apps/site/public/social-card.png   1200 × 630, the link preview
 *   apps/site/public/apple-touch-icon.png 180 × 180
 *   apps/site/public/shades-mark.png      512 × 512, for structured data
 *   apps/site/public/email/shades-lockup.png 284 × 64, the email header
 *   apps/site/public/email/shades-lockup-dark.png 284 × 64, the same for dark mail apps
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

// Email hero: two bands of the Spectra family and the mark on a soft red ground,
// one above and one below the white card, every figure whole.
const band = (height, items) =>
  page(
    1040,
    height,
    `<div style="position:absolute; inset:0; background:#FFF0F2"></div>
    ${items
      .map(
        ([x, y, w, r, what]) =>
          `<div style="position:absolute; left:${x}px; top:${y}px; width:${w}px; transform:rotate(${r}deg)">${what === 'mark' ? mark : family[what]}</div>`,
      )
      .join('')}`,
  )
// [left, top, width, rotation, what]: what is a family index or 'mark'
const heroTop = band(240, [
  [64, 44, 112, -8, 0], [238, 96, 64, 14, 'mark'], [372, 30, 104, 6, 1],
  [560, 112, 58, -12, 'mark'], [676, 40, 96, -5, 2], [858, 70, 110, 9, 3],
])
const heroBottom = band(220, [
  [92, 34, 100, 7, 4], [282, 96, 60, -10, 'mark'], [430, 40, 104, -6, 5],
  [640, 104, 56, 12, 'mark'], [760, 30, 108, 5, 6], [930, 120, 52, -14, 'mark'],
])

// Email edge: the page breaks into the ink footer in layered waves, the spectrum
// riding the top wave and the Spectra family travelling along it, with sparkles.
// Transparent above the waves, so it sits on the light page and the dark one alike.
const sparkle = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`
const star = (x, y, s, c) =>
  `<path d="M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z" fill="${c}"/>`
const riders = [
  [50, 104, 104, 8, 0], [236, 96, 66, -10, 'mark'], [380, 52, 98, -6, 1],
  [574, 70, 60, 12, 'mark'], [688, 96, 102, 6, 2], [868, 112, 96, -8, 3],
]
const edge = page(
  1040,
  320,
  `<svg viewBox="0 0 1040 320" width="1040" height="320" style="position:absolute; inset:0">
    <defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#6364ff"/><stop offset=".34" stop-color="#d212d6"/><stop offset=".67" stop-color="#e40523"/><stop offset="1" stop-color="#ff5900"/></linearGradient></defs>
    <path d="M0 190 C 220 110, 420 110, 620 160 S 900 230, 1040 150 L1040 320 L0 320 Z" fill="#FFF0F2"/>
    <path d="M0 214 C 230 140, 430 140, 630 186 S 905 250, 1040 176 L1040 320 L0 320 Z" fill="#FFC4CF"/>
    <path d="M0 236 C 240 166, 440 166, 640 210 S 910 270, 1040 200 L1040 320 L0 320 Z" fill="#141416"/>
    <path d="M0 214 C 230 140, 430 140, 630 186 S 905 250, 1040 176" fill="none" stroke="url(#s)" stroke-width="5"/>
    ${[[150, 120, 4, '#FFC24D'], [330, 96, 3, '#FFC24D'], [520, 120, 5, '#FFC24D'], [810, 150, 3, '#FFC24D'], [980, 120, 4, '#FFC24D'], [610, 250, 3, '#FFC24D'], [300, 250, 2.5, '#FFC24D'], [880, 268, 3, '#FFC24D']].map((d) => sparkle(...d)).join('')}
    ${[[200, 160, 9, '#FFFFFF'], [560, 92, 7, '#FFC24D'], [960, 220, 10, '#FFFFFF'], [460, 250, 8, '#FFFFFF']].map((d) => star(...d)).join('')}
  </svg>
  ${riders
    .map(
      ([x, y, w, r, what]) =>
        `<div style="position:absolute; left:${x}px; top:${y}px; width:${w}px; transform:rotate(${r}deg)">${what === 'mark' ? mark : family[what]}</div>`,
    )
    .join('')}`,
).replace('body { background: #fdfdfc;', 'body { background: transparent;')

// Social icons for the ink footer: white glyphs on transparent, at twice their size.
const glyph = (paths) =>
  page(
    64,
    64,
    `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`,
  ).replace('body { background: #fdfdfc;', 'body { background: transparent;')
const SOCIAL = {
  instagram: glyph('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="#FFFFFF" stroke="none"/>'),
  tiktok: glyph('<path d="M15.5 3c.3 2.4 1.8 4 4.2 4.2V10a7.3 7.3 0 0 1-4.2-1.4v6.6a5.3 5.3 0 1 1-5.3-5.3c.3 0 .6 0 .9.1v2.9a2.5 2.5 0 1 0 1.7 2.3V3h2.7z" fill="#FFFFFF" stroke="none"/>'),
  facebook: glyph('<path d="M13.5 21v-7.3h2.6l.4-3h-3V8.8c0-.9.3-1.5 1.5-1.5h1.6V4.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z" fill="#FFFFFF" stroke="none"/>'),
}

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
  [
    'apps/site/public/email/shades-lockup-dark.png',
    284,
    64,
    page(284, 64, brand('shades-lockup-reverse.svg')).replace(
      'body { background: #fdfdfc;',
      'body { background: transparent;',
    ),
  ],
]

JOBS.push(
  ['apps/site/public/email/shades-hero-top.png', 1040, 240, heroTop],
  ['apps/site/public/email/shades-hero-bottom.png', 1040, 220, heroBottom],
  ['apps/site/public/email/shades-edge.png', 1040, 320, edge],
  ...Object.entries(SOCIAL).map(([name, html]) => [`apps/site/public/email/social-${name}.png`, 64, 64, html]),
)

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
