/**
 * Builds the package from src/ into dist/.
 *
 * src/tokens.json is the only place a value is written. From it come
 * tokens.css (custom properties, light and dark), theme.css (a Tailwind v4
 * theme over those properties) and tokens.json. The hand-written stylesheets
 * are copied as they are and also joined into gradient.css, except the
 * opt-in compact.css and auth.css, which ship on their own; the scripts are
 * bundled with esbuild and typed with tsc.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'src')
const dist = join(root, 'dist')
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const banner = `/* shades-gradient ${version} · MIT · https://gradient.shades.md */\n`

export const tokens = JSON.parse(readFileSync(join(src, 'tokens.json'), 'utf8'))

/** Each token group and the prefix its custom properties carry. */
const GROUPS = [
  ['color.red', 'red'],
  ['color.ink', 'ink'],
  ['color.secondary', 'secondary'],
  ['color.blue', 'blue'],
  ['color.violet', 'violet'],
  ['color.pink', 'pink'],
  ['color.orange', 'orange'],
  ['color.amber', 'amber'],
  ['color.green', 'green'],
  ['color.spectrum', 'spectrum'],
  ['color.family', 'family'],
  ['gradient', 'gradient'],
  ['role', ''],
  ['font', 'font'],
  ['text', 'size'],
  ['leading', 'leading'],
  ['tracking', 'tracking'],
  ['space', 'space'],
  ['radius', 'radius'],
  ['shadow', 'shadow'],
  ['duration', 'dur'],
  ['ease', 'ease'],
]

const at = (path) => path.split('.').reduce((node, key) => node?.[key], tokens)

/** A group's tokens as [name, token], skipping $-keys. */
const entries = (path) => Object.entries(at(path)).filter(([key]) => !key.startsWith('$'))

const varName = (prefix, name) => `--g-${prefix ? `${prefix}-` : ''}${name}`

/** The custom property a reference like {color.red.500} points at. */
function refVar(ref) {
  const path = ref.slice(1, -1)
  for (const [group, prefix] of GROUPS)
    if (path.startsWith(`${group}.`)) return `var(${varName(prefix, path.slice(group.length + 1))})`
  throw new Error(`Unknown token reference ${ref}`)
}

/** A reference resolved all the way to its literal value. */
export function resolve(value) {
  if (typeof value === 'string' && value.startsWith('{'))
    return resolve(at(value.slice(1, -1)).$value)
  return value
}

function css(value, token) {
  if (typeof value === 'string' && value.startsWith('{')) return refVar(value)
  // A DTCG gradient: stops of { color, position }, the angle kept in an extension.
  if (Array.isArray(value) && typeof value[0] === 'object') {
    const angle = token?.$extensions?.['md.shades.gradient']?.angle ?? 180
    const stops = value.map(({ color, position }) => `${css(color)} ${Math.round(position * 100)}%`)
    return `linear-gradient(${angle}deg, ${stops.join(', ')})`
  }
  if (Array.isArray(value))
    return typeof value[0] === 'number'
      ? `cubic-bezier(${value.join(', ')})`
      : value.map((f) => (/\s/.test(f) ? `'${f}'` : f)).join(', ')
  return String(value)
}

const darkOf = (token) => token.$extensions?.['md.shades.gradient']?.dark

function tokensCss() {
  const light = []
  const dark = []
  const lightRoles = []
  for (const [group, prefix] of GROUPS) {
    for (const [name, token] of entries(group)) {
      light.push(`  ${varName(prefix, name)}: ${css(token.$value, token)};`)
      if (darkOf(token)) {
        dark.push(`  ${varName(prefix, name)}: ${css(darkOf(token))};`)
        lightRoles.push(`  ${varName(prefix, name)}: ${css(token.$value)};`)
      }
    }
  }
  const spectrum =
    'linear-gradient(90deg, var(--g-spectrum-blue), var(--g-spectrum-magenta) 34%, var(--g-spectrum-red) 67%, var(--g-spectrum-orange))'
  return `${banner}
:root {
  color-scheme: light;
${light.join('\n')}
  --g-spectrum: ${spectrum};
  --g-focus: 0 0 0 2px var(--g-bg), 0 0 0 4px var(--g-accent);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    color-scheme: dark;
${dark.map((line) => `  ${line}`).join('\n')}
  }
}

/* Themes can also be pinned on any element: a dark section, a preview. */
[data-theme='dark'] {
  color-scheme: dark;
${dark.join('\n')}
}

[data-theme='light'] {
  color-scheme: light;
${lightRoles.join('\n')}
}
`
}

/** Tailwind v4: utilities named like the tokens, reading the live custom properties. */
function themeCss() {
  const lines = []
  const add = (twPrefix, prefix, group) => {
    for (const [name] of entries(group))
      lines.push(`  --${twPrefix}-${name}: var(${varName(prefix, name)});`)
  }
  add('color-red', 'red', 'color.red')
  add('color-ink', 'ink', 'color.ink')
  add('color-secondary', 'secondary', 'color.secondary')
  add('color-blue', 'blue', 'color.blue')
  add('color-violet', 'violet', 'color.violet')
  add('color-pink', 'pink', 'color.pink')
  add('color-orange', 'orange', 'color.orange')
  add('color-amber', 'amber', 'color.amber')
  add('color-green', 'green', 'color.green')
  add('color-spectrum', 'spectrum', 'color.spectrum')
  add('color', '', 'role')
  add('font', 'font', 'font')
  add('text', 'size', 'text')
  add('leading', 'leading', 'leading')
  add('tracking', 'tracking', 'tracking')
  add('radius', 'radius', 'radius')
  add('shadow', 'shadow', 'shadow')
  add('ease', 'ease', 'ease')
  return `${banner}@import './tokens.css';

@theme inline {
${lines.join('\n')}
}
`
}

rmSync(dist, { recursive: true, force: true })
mkdirSync(dist)
const sheets = ['base.css', 'components.css', 'motion.css', 'preferences.css']
const tokenSheet = tokensCss()
writeFileSync(join(dist, 'tokens.css'), tokenSheet)
writeFileSync(join(dist, 'theme.css'), themeCss())
copyFileSync(join(src, 'tokens.json'), join(dist, 'tokens.json'))
for (const sheet of sheets)
  writeFileSync(join(dist, sheet), banner + readFileSync(join(src, sheet), 'utf8'))
writeFileSync(
  join(dist, 'gradient.css'),
  [tokenSheet, ...sheets.map((sheet) => readFileSync(join(src, sheet), 'utf8'))].join('\n'),
)
// Compact mode is opt-in: shipped on its own, left out of gradient.css.
writeFileSync(join(dist, 'compact.css'), banner + readFileSync(join(src, 'compact.css'), 'utf8'))
writeFileSync(join(dist, 'auth.css'), banner + readFileSync(join(src, 'auth.css'), 'utf8'))

// A sprite for plain HTML: <svg><use href="/icons.svg#g-arrow-right"/></svg>
const { icons } = await import(
  `data:text/javascript,${encodeURIComponent(
    readFileSync(join(src, 'icons.ts'), 'utf8').replace(/ as const/g, ''),
  )}`
)
const kebab = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
writeFileSync(
  join(dist, 'icons.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg">\n${Object.entries(icons)
    .map(
      ([name, body]) =>
        `  <symbol id="g-${kebab(name)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`,
    )
    .join('\n')}\n</svg>\n`,
)

await build({
  entryPoints: [join(src, 'index.ts'), join(src, 'magnetic.ts'), join(src, 'preferences.ts'), join(src, 'consent.ts'), join(src, 'email.ts')],
  outdir: dist,
  bundle: true,
  format: 'esm',
  // preferences.js and consent.js share one consent module, so one banner.
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  target: 'es2020',
  banner: { js: banner },
  loader: { '.svg': 'text' },
  logLevel: 'warning',
})
// A classic script for <head>, so preferences apply before the first paint.
await build({
  entryPoints: [join(src, 'preferences-boot.ts')],
  outfile: join(dist, 'preferences-boot.js'),
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2017',
  banner: { js: banner },
  logLevel: 'warning',
})
execFileSync('npx', ['tsc', '-p', join(root, 'tsconfig.build.json')], { stdio: 'inherit' })
console.log(`shades-gradient ${version} built to dist/`)
