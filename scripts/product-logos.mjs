/**
 * Writes the product lockups the home page shows beside PageRecast's and
 * ImageRefold's own: Gradient (the Shades mark) and LMS (its supplied mark).
 *
 * Same construction as PageRecast's scripts/brand.mjs, so the four logos sit
 * at one optical size: the wordmark is Space Grotesk 700 turned into outlines
 * at -0.035 em tracking, the mark is 1.9 × the cap height, the gap 0.3 × the
 * mark. Square marks are inset to 80/96 of the box, as PageRecast's shapes
 * are, so a full square doesn't look heavier than rounded ones.
 *
 * Run with `node scripts/product-logos.mjs`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'apps/site/public/products')
const INK = '#0A0A0B'

const buffer = readFileSync(
  require.resolve('@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff'),
)
const font = opentype.parse(
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length),
)

function wordmark(text) {
  const size = 100
  const options = { kerning: true, letterSpacing: -0.035 }
  // ponytail: opentype.js 2.0's toPathData prints NaN for some coordinates, so the commands are written here.
  const n = (v) => String(Math.round(v * 100) / 100)
  const d = font
    .getPath(text, 0, 0, size, options)
    .commands.map(
      (c) =>
        c.type +
        ['x1', 'y1', 'x2', 'y2', 'x', 'y']
          .filter((k) => k in c)
          .map((k) => n(c[k]))
          .join(' '),
    )
    .join('')
  if (d.includes('NaN')) throw new Error(`Broken outline for ${text}`)
  const width = font.getAdvanceWidth(text, size, options) - 0.035 * size
  return { d, width, capHeight: (font.tables.os2.sCapHeight / font.unitsPerEm) * size }
}

/** The inner markup of an SVG file and its viewBox size. */
function inner(file) {
  const svg = readFileSync(file, 'utf8')
  const [, , , w] = svg
    .match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/)
    .slice(1)
    .map(Number)
  return {
    body: svg
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replace(/<title>.*?<\/title>/, '')
      .trim(),
    size: w,
  }
}

function lockup(name, markFile, label, textFill) {
  const word = wordmark(name)
  const markSize = word.capHeight * 1.9
  const gap = markSize * 0.3
  const height = markSize
  const width = markSize + gap + word.width
  const baseline = height / 2 + word.capHeight / 2
  const mark = inner(markFile)
  const inset = markSize * (8 / 96)
  const scale = (markSize - inset * 2) / mark.size
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(1)} ${height.toFixed(1)}" role="img" aria-label="${label}"><title>${label}</title><g transform="translate(${inset.toFixed(2)} ${inset.toFixed(2)}) scale(${scale.toFixed(4)})">${mark.body}</g><path fill="${textFill}" transform="translate(${(markSize + gap).toFixed(1)} ${baseline.toFixed(1)})" d="${word.d}"/></svg>\n`
}

const shadesMark = join(root, 'packages/gradient/brand/shades-mark.svg')
const lmsMark = join(out, 'lms-mark.svg')
const files = {
  'gradient-logo.svg': lockup('Gradient', shadesMark, 'Gradient', INK),
  'lms-logo.svg': lockup('LMS', lmsMark, 'LMS', INK),
}
for (const [file, content] of Object.entries(files)) writeFileSync(join(out, file), content)
console.log(`Wrote ${Object.keys(files).join(', ')}`)
