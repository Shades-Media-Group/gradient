// Parts for the Shades people scenes. Figures come from Humaaans by Pablo Stanley (CC0, ./humaaans/),
// recoloured to Gradient's --g-ill-* tokens; props, washes and sparkles are ours.
import fs from 'node:fs';

const SRC = new URL('./humaaans/', import.meta.url);
const f = n => { const s = (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, ''); return s === '-0' ? '0' : s; };

/** A token reference with its light fallback, e.g. v('red', '#E40523'). */
export const v = (n, x) => `var(--g-ill-${n},${x})`;

// Humaaans' own colours, mapped onto Gradient. Skins and hair keep their drawn tones except the navy hair.
const MAP = {
  '#2B44FF': v('violet', '#D212D6'), '#1F28CF': v('violet-deep', '#A00EA3'), '#2026A2': v('violet-deep', '#A00EA3'),
  '#FF4133': v('red', '#E40523'), '#DB2721': v('red-deep', '#B5031B'),
  '#FF9B21': v('amber', '#FFAF33'), '#E87613': v('amber-deep', '#E0900F'),
  '#89C5CC': v('green-soft', '#BFEBD9'), '#69A1AC': v('green-mid', '#7ACFAE'), '#C1DEE2': v('green-soft', '#BFEBD9'),
  '#2F3676': v('dark', '#2B2B3A'), '#5C63AB': v('dark-mid', '#55556A'), '#8991DC': v('violet-soft-deep', '#E8B9EA'),
  '#191847': v('hair', '#22202C'),
};

/**
 * One Humaaans figure, recoloured. name: a file in ./humaaans/ without .svg (standing-1..24, sitting-1..8).
 * x, y: top-left; s: scale (0.58 to 0.62 fits a 480x360 scene); flip: mirror; swap: { humaaansHex: v(...) } to dress it.
 */
export function figure(name, { x, y, s, flip = false, swap = {} }) {
  const t = fs.readFileSync(new URL(name + '.svg', SRC), 'utf8');
  const inner = t.slice(t.indexOf('>', t.indexOf('<g id=')) + 1, t.lastIndexOf('</g>'));
  const m = { ...MAP, ...swap };
  const g = inner.replace(/ id="[^"]*"/g, '').replace(/#[0-9A-Fa-f]{6}/g, h => m[h.toUpperCase()] ?? h);
  const tf = flip ? `translate(${x} ${y}) scale(${-s} ${s})` : `translate(${x} ${y}) scale(${s})`;
  return `<g transform="${tf}">${g}</g>`;
}

/** The 4-point sparkle every Shades spot uses. */
export const star4 = (c, r, col) => {
  const [x, y] = c, k = r * 0.14;
  return `<path d="M${f(x)} ${f(y - r)}Q${f(x + k)} ${f(y - k)} ${f(x + r * 0.62)} ${f(y)}Q${f(x + k)} ${f(y + k)} ${f(x)} ${f(y + r)}Q${f(x - k)} ${f(y + k)} ${f(x - r * 0.62)} ${f(y)}Q${f(x - k)} ${f(y - k)} ${f(x)} ${f(y - r)}Z" fill="${col}"/>`;
};

/** The soft wash behind a scene, in one pale tint. */
export const blob = c => `<path d="M90 254c-14-72 36-154 130-166 90-11 168 28 180 98 11 70-50 118-140 120-80 2-156 14-170-52z" fill="${c}"/>`;

export const svg = b => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" fill="none" aria-hidden="true">\n${b.join('\n')}\n</svg>\n`;

// Light values of the --g-ill-* tokens (packages/gradient/src/tokens.json), and the short names used while drawing.
const T = {
  amber: '#FFAF33', 'amber-dark': '#CC7B04', 'amber-soft': '#FFE7BF', dark: '#26262E', 'dark-soft': '#55556A',
  green: '#00A96E', 'green-dark': '#008556', 'green-mid': '#7ACFAE', 'green-soft': '#D8F7EB', 'green-wash': '#EAF8F2',
  line: '#1C1C20', 'line-soft': '#E4E4EA', paper: '#FFFFFF', red: '#E40523', 'red-dark': '#B5031B', 'red-soft': '#FFDDE2',
  'red-wash': '#FFF0F2', violet: '#D212D6', 'violet-dark': '#A00EA3', 'violet-soft': '#FAE0FA', 'violet-wash': '#FBF0FB',
};
const ALIAS = { 'red-deep': 'red-dark', 'violet-deep': 'violet-dark', 'green-deep': 'green-dark', 'amber-deep': 'amber-dark',
  'dark-mid': 'dark-soft', hair: 'dark', 'violet-soft-deep': 'violet-soft' };

/** Puts every colour on a real token with its canonical fallback, checks for references, adds the credit, minifies. */
export function finish(name, s) {
  s = s.replace(/var\(--g-ill-([a-z-]+),#[0-9A-Fa-f]{6}\)/g, (m, n) => {
    const k = ALIAS[n] ?? n;
    if (!T[k]) throw new Error(`${name}: unknown token ${n}; add it to tokens.json and to T in kit.mjs`);
    return `var(--g-ill-${k},${T[k]})`;
  });
  if (/xlink|<use|url\(#/.test(s)) throw new Error(`${name}: has references; scenes must be self-contained`);
  s = s.replace('<svg ', `<!-- Shades people: ${name}. Figure from Humaaans by Pablo Stanley (CC0), recoloured; scene by Shades Media Group. -->\n<svg `);
  return s.replace(/\n\s*\n/g, '\n').replace(/>\s+</g, '><') + '\n';
}
