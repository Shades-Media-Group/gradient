// node scripts/people/sheet.mjs out.png [names...]: drawings at full and half size, on paper and on dark.
// No names: every people-* scene. Names are file names without .svg (people-lookup, inbox, ...).
// Look at the sheet before a scene ships: proportions, hands, feet, colour balance, the small size.
import fs from 'node:fs';
import { chromium } from '@playwright/test';

const dir = new URL('../../packages/gradient/illustrations/', import.meta.url);
const [out, ...names] = process.argv.slice(2);
if (!out) throw new Error('usage: node scripts/people/sheet.mjs out.png [lookup done ...]');
const files = fs.readdirSync(dir).filter(f => names.length ? names.includes(f.slice(0, -4)) : f.startsWith('people-'));
const tokens = fs.readFileSync(new URL('../../packages/gradient/dist/tokens.css', import.meta.url), 'utf8');
const cell = (f, theme) => { const t = fs.readFileSync(new URL(f, dir), 'utf8'); return `<div class="c" data-theme="${theme}"><div class=big>${t}</div><div class=small>${t}</div><b>${f.slice(0, -4)}</b></div>`; };
const html = `<!doctype html><style>${tokens}
body{margin:0;padding:20px;font:12px sans-serif;display:grid;grid-template-columns:repeat(2,840px);gap:16px;background:#f4f4f6}
.c{display:flex;gap:12px;align-items:flex-start;padding:12px;border-radius:16px;background:var(--g-surface,#fff);color:var(--g-text)}
.big svg{width:480px;height:360px}.small svg{width:240px;height:180px}.c b{width:80px;overflow-wrap:anywhere}</style>${files.map(f => cell(f, 'light') + cell(f, 'dark')).join('')}`;
// CHROMIUM=<path> uses an installed browser when Playwright's own download is a different version.
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await b.newPage({ viewport: { width: 1600, height: 800 }, deviceScaleFactor: 2 });
await p.setContent(html);
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log(`wrote ${out}`);
