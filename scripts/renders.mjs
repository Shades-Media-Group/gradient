/**
 * Renders the product shots the site shows (business cards, badges, tote,
 * sticker) as WebP into apps/site/public/renders/. The objects carry the
 * real print files: each face is laid out in HTML with the brand fonts and
 * the logo from packages/gradient/brand, then photographed in a Three.js
 * studio (scripts/renders/). Nothing is drawn by hand or generated.
 *
 * Run with `yarn renders [name…]` on a machine with a GPU; the files are
 * committed, so CI never renders.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { build } from 'esbuild'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'apps/site/public/renders')
const brand = (file) => readFileSync(join(root, 'packages/gradient/brand', file), 'utf8')
const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(root, 'node_modules', pkg, 'files', file)).toString('base64')}`
const display = font('@fontsource-variable/space-grotesk', 'space-grotesk-latin-wght-normal.woff2')
const body = font('@fontsource-variable/hanken-grotesk', 'hanken-grotesk-latin-wght-normal.woff2')
const bodyExt = font(
  '@fontsource-variable/hanken-grotesk',
  'hanken-grotesk-latin-ext-wght-normal.woff2',
)
// Romanian ș, ț and ă live in the latin-ext subset.
const EXT = 'U+0100-02AF, U+0300-0301, U+1E00-1EFF'

/** Print faces, laid out at 25 px per millimetre. */
const MM = 25
const face = (width, height, background, content) => ({
  width: width * MM,
  height: height * MM,
  html: `<!doctype html><html><head><style>
    @font-face { font-family: Display; src: url(${display}); font-weight: 300 700; }
    @font-face { font-family: Body; src: url(${body}); font-weight: 100 900; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${width * MM}px; height: ${height * MM}px; overflow: hidden; background: ${background}; color: #0a0a0b; font-family: Body; }
    svg { display: block; width: 100%; height: auto; }
  </style></head><body>${content}</body></html>`,
})

const pt = (points) => `${((points * 25.4) / 72) * MM}px`

const FACES = {
  cardFront: face(
    85,
    55,
    '#E40523',
    `<div style="display:grid; place-items:center; height:100%"><div style="width:${20 * MM}px">${brand('shades-mark.svg')}</div></div>`,
  ),
  cardBack: face(
    85,
    55,
    '#FDFDFC',
    `<div style="display:grid; grid-template-columns:1fr auto; grid-template-rows:1fr auto; height:100%; padding:${6 * MM}px">
      <div>
        <div style="font:700 ${pt(10)}/1.1 Display; letter-spacing:-0.02em">Ana Popescu</div>
        <div style="margin-top:${0.8 * MM}px; font:400 ${pt(7.5)}/1.3 Body; color:#56565e">Brand designer</div>
      </div>
      <div></div>
      <div style="grid-row:2; font:400 ${pt(7.5)}/${pt(11)} Body">ana@shades.md<br>+373 60 000 000<br>shades.md</div>
      <div style="grid-row:2; align-self:end; width:${25 * MM}px">${brand('shades-lockup.svg')}</div>
    </div>`,
  ),
}

const badge = (first, last, role, band) =>
  face(
    90,
    130,
    '#FDFDFC',
    `<div style="display:grid; grid-template-rows:auto 1fr auto; height:100%">
      <div style="display:flex; align-items:center; gap:${3.5 * MM}px; padding:${16 * MM}px ${8 * MM}px 0; font:600 ${4.2 * MM}px/1 Body">
        <div style="width:${10 * MM}px">${brand('shades-mark.svg')}</div>Shades Day 2027
      </div>
      <div style="align-self:center; padding:0 ${8 * MM}px">
        <div style="font:700 ${17 * MM}px/0.95 Display; letter-spacing:-0.04em">${first}</div>
        <div style="margin-top:${1.6 * MM}px; font:500 ${6.3 * MM}px/1.2 Body">${last}</div>
      </div>
      <div style="padding:${5 * MM}px ${8 * MM}px; background:${band}; color:#fff; font:700 ${4.9 * MM}px/1 Display">${role}</div>
    </div>`,
  )
FACES.badgeTeam = badge('Ana', 'Popescu', 'Shades team', '#E40523')
FACES.badgeGuest = badge('Ion', 'Rusu', 'Guest', '#0A0A0B')

// The tee's back print, 300 × 420 mm at 8 px/mm, one ink on a clear ground.
// The three bars of the mark, tall, the second and third as halftone at 75
// and 50 per cent: shades of one colour, printed with one screen.
const INK = '#EDEBE5'
const dots = (radius) =>
  `background-image: radial-gradient(circle, ${INK} ${radius * 8}px, transparent ${radius * 8 + 0.8}px); background-size: ${2.2 * 8}px ${2.2 * 8}px;`
FACES.teeBack = {
  width: 300 * 8,
  height: 420 * 8,
  clear: true,
  html: `<!doctype html><html><head><style>
    @font-face { font-family: Display; src: url(${display}); font-weight: 300 700; }
    @font-face { font-family: Body; src: url(${body}); font-weight: 100 900; }
    @font-face { font-family: Body; src: url(${bodyExt}); font-weight: 100 900; unicode-range: ${EXT}; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${300 * 8}px; height: ${420 * 8}px; background: transparent; color: ${INK}; }
    .bars { display: grid; grid-template-columns: repeat(3, ${68 * 8}px); gap: ${18 * 8}px; padding: 0 ${30 * 8}px; height: ${300 * 8}px; }
    .info { padding: ${16 * 8}px ${30 * 8}px 0; }
    .name { font: 700 ${15 * 8}px/1 Display; letter-spacing: -0.03em; }
    .row { display: flex; justify-content: space-between; margin-top: ${5 * 8}px; font: 500 ${6.5 * 8}px/1.3 Body; font-variant-numeric: tabular-nums; }
  </style></head><body>
    <div class="bars"><div style="background:${INK}"></div><div style="${dots(1.07)}"></div><div style="${dots(0.88)}"></div></div>
    <div class="info">
      <div class="name">Shades Media Group</div>
      <div class="row"><span>Chișinău, Moldova</span><span>47.0105° N, 28.8638° E</span></div>
      <div class="row"><span>Brand · Interface · Web · Marketing</span></div>
    </div>
  </body></html>`,
}

async function faces(browser) {
  const page = await browser.newPage()
  const result = {}
  for (const [name, { width, height, html, clear }] of Object.entries(FACES)) {
    await page.setViewportSize({ width, height })
    await page.setContent(html)
    await page.evaluate(() => document.fonts.ready)
    result[name] =
      `data:image/png;base64,${(await page.screenshot({ type: 'png', omitBackground: !!clear })).toString('base64')}`
  }
  await page.close()
  return result
}

const bundle = await build({
  entryPoints: [join(root, 'scripts/renders/scenes.js')],
  bundle: true,
  format: 'iife',
  write: false,
  logLevel: 'warning',
})

const browser = await chromium.launch({
  args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'],
})
// The wordmark alone, in white: the mono lockup cropped past the mark.
const wordmark = brand('shades-lockup-mono.svg')
  .replace(/viewBox="[^"]*"/, 'viewBox="41 0 101 32"')
  .replace(/width="\d+" height="\d+"/, 'width="303" height="96"')
  .replace(/currentColor/g, '#FFFFFF')
const assets = {
  ...(await faces(browser)),
  markMono: brand('shades-mark-mono.svg'),
  wordmark,
  spectra: brand('spectra/spectra.svg')
    .replace(/<ellipse[^>]*opacity="0\.28"\/>/, '')
    .replace('viewBox="0 0 160 200"', 'viewBox="0 -2 160 166"'),
}
const page = await browser.newPage()
page.on('console', (m) => m.type() === 'error' && console.error(m.text()))
page.on('pageerror', (e) => console.error(e))
await page.setContent('<!doctype html><html><body></body></html>')
await page.addScriptTag({ content: bundle.outputFiles[0].text })

mkdirSync(out, { recursive: true })
const names = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['cards', 'badges', 'tote', 'sticker']
for (const name of names) {
  const started = Date.now()
  const files = await page.evaluate(([n, a]) => window.render(n, a), [name, assets])
  for (const [width, data] of files)
    writeFileSync(join(out, `${name}-${width}.webp`), Buffer.from(data.split(',')[1], 'base64'))
  console.log(`${name}: ${((Date.now() - started) / 1000).toFixed(1)} s`)
}
await browser.close()
