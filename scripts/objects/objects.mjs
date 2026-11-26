// The object spot drawings added after the approved seven (caller, pick, nothing, folder, done, welcome, offline),
// drawn in their language: 240 x 180, a 1.5 dark outline, colour fills offset down-left from the outline,
// a pale wash behind, outlined 4-point sparkles, one or two plain dots. `yarn objects` writes them.
import fs from 'node:fs';

const v = (n, x) => `var(--g-ill-${n},${x})`;
const c = {
  line: v('line', '#1C1C20'), paper: v('paper', '#FFFFFF'), dark: v('dark', '#26262E'),
  red: v('red', '#E40523'), redSoft: v('red-soft', '#FFDDE2'), redWash: v('red-wash', '#FFF0F2'),
  violet: v('violet', '#D212D6'), violetSoft: v('violet-soft', '#FAE0FA'),
  green: v('green', '#00A96E'), greenSoft: v('green-soft', '#D8F7EB'),
  amber: v('amber', '#FFAF33'), amberSoft: v('amber-soft', '#FFE7BF'), lineSoft: v('line-soft', '#E4E4EA'),
};
const S = `stroke="${c.line}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
const n = x => +x.toFixed(3);
/** Outlined 4-point sparkle, the same curve as the approved set. */
const star = (x, y, r, col) => {
  const a = n(0.084 * r), b = n(0.28 * r);
  return `<path d="M${x} ${y - r}C${n(x + a)} ${n(y - b)} ${n(x + b)} ${n(y - a)} ${x + r} ${y}C${n(x + b)} ${n(y + a)} ${n(x + a)} ${n(y + b)} ${x} ${y + r}C${n(x - a)} ${n(y + b)} ${n(x - b)} ${n(y + a)} ${x - r} ${y}C${n(x - b)} ${n(y - a)} ${n(x - a)} ${n(y - b)} ${x} ${y - r}z" fill="${col}" ${S}/>`;
};
/** The signature offset: the colour shape shifted 4 left and 4 down, the outline on top. */
const off = (d, col, fillTop = 'none') => `<path d="${d}" fill="${col}" transform="translate(-4 4)"/><path d="${d}" fill="${fillTop}" ${S}/>`;
const line = (d, col = c.line, w = 1.5) => `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const dot = (x, y, r, col) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`;
const rr = (x, y, w, h, r) => `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

const OBJECTS = {
  // No messages: an open envelope, the letter half out.
  inbox: () => [
    `<circle cx="120" cy="96" r="58" fill="${c.redWash}"/>`,
    `<path d="M60 88 120 46l60 42" fill="${c.paper}" ${S}/>`,
    `<g transform="rotate(-4 120 76)"><path d="${rr(80, 40, 80, 72, 6)}" fill="${c.paper}" ${S}/>${dot(96, 58, 7, c.violet)}${line('M110 55h34M110 63h22M92 80h54M92 90h40')}</g>`,
    off('M60 88h120v56a8 8 0 0 1-8 8H68a8 8 0 0 1-8-8z', c.red),
    line('M60 92l60 32 60-32', c.paper, 3),
    star(46, 56, 9, c.amber), star(196, 40, 7, c.violet), dot(196, 134, 5, c.green),
  ],
  // No events: a calendar page with one date ringed.
  calendar: () => {
    const grid = [];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) grid.push(dot(84 + k * 18, 96 + r * 18, 3.2, r === 1 && k === 3 ? c.red : c.lineSoft));
    return [
      `<circle cx="120" cy="94" r="58" fill="${c.violetSoft}"/>`,
      off(rr(64, 48, 112, 104, 10), c.violetSoft, c.paper),
      `<path d="M64 58a10 10 0 0 1 10-10h92a10 10 0 0 1 10 10v16H64z" fill="${c.red}" ${S}/>`,
      `<rect x="88" y="38" width="7" height="18" rx="3.5" fill="${c.dark}"/><rect x="145" y="38" width="7" height="18" rx="3.5" fill="${c.dark}"/>`,
      ...grid,
      `<circle cx="138" cy="114" r="10" stroke="${c.red}" stroke-width="2.4"/>`,
      star(194, 52, 9, c.amber), star(44, 120, 7, c.red), dot(48, 60, 5, c.green),
    ];
  },
  // No conversations: two bubbles, one still typing.
  chat: () => [
    `<ellipse cx="120" cy="154" rx="72" ry="8" fill="${c.violetSoft}"/>`,
    off('M110 38h76a14 14 0 0 1 14 14v30a14 14 0 0 1-14 14h-6l2 14-16-14h-56a14 14 0 0 1-14-14V52a14 14 0 0 1 14-14z', c.violet),
    line('M114 58h56M114 72h36', c.paper, 3).replace(/<path/, '<path transform="translate(-4 4)"'),
    `<path d="M62 84h74a14 14 0 0 1 14 14v28a14 14 0 0 1-14 14H80l-16 14 2-14h-4a14 14 0 0 1-14-14V98a14 14 0 0 1 14-14z" fill="${c.paper}" ${S}/>`,
    dot(78, 112, 5.5, c.red), dot(98, 112, 5.5, c.amber), dot(118, 112, 5.5, c.green),
    star(42, 60, 9, c.amber), star(206, 128, 7, c.red), dot(214, 34, 4, c.green),
  ],
  // No access: a closed padlock.
  locked: () => [
    `<circle cx="120" cy="96" r="58" fill="${c.amberSoft}"/>`,
    `<path d="M96 86V66a24 24 0 0 1 48 0v20" stroke="${c.line}" stroke-width="13" stroke-linecap="round"/>`,
    `<path d="M96 86V66a24 24 0 0 1 48 0v20" stroke="${c.lineSoft}" stroke-width="10" stroke-linecap="round"/>`,
    off(rr(76, 82, 88, 70, 12), c.red),
    `<circle cx="116" cy="110" r="8" fill="${c.paper}"/><rect x="112" y="112" width="8" height="18" rx="4" fill="${c.paper}"/>`,
    star(186, 54, 9, c.violet), star(52, 132, 7, c.amber), dot(52, 58, 6, c.green),
    line('M160 62l8-6M164 72l10 0', c.line),
  ],
  // Something broke: a page with a warning sign.
  error: () => [
    `<circle cx="116" cy="92" r="58" fill="${c.redWash}"/>`,
    `<path d="M72 30h54l22 22v86a8 8 0 0 1-8 8H72a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z" fill="${c.paper}" ${S}/>`,
    line('M126 30v14a8 8 0 0 0 8 8h14'), line('M78 62h40M78 74h52M78 86h30M78 98h44'),
    off('M154 84a6 6 0 0 1 10.4 0l26 46a6 6 0 0 1-5.2 9h-52a6 6 0 0 1-5.2-9z', c.amber),
    line('M159 104v16', c.dark, 4), dot(159, 129, 2.6, c.dark),
    star(190, 46, 9, c.violet), star(44, 136, 7, c.red), dot(44, 56, 5, c.green),
  ],
  // No images: a photo with a plus to add one.
  photo: () => [
    `<circle cx="120" cy="92" r="58" fill="${c.greenSoft}"/>`,
    `<g transform="rotate(-9 116 92)"><path d="${rr(62, 48, 108, 84, 8)}" fill="${c.violetSoft}" ${S}/></g>`,
    `<path d="${rr(70, 44, 108, 84, 8)}" fill="${c.paper}" ${S}/>`,
    `<path d="${rr(80, 54, 88, 56, 4)}" fill="${c.greenSoft}"/>`,
    `<path d="M80 110l26-28 18 18 12-10 32 20z" fill="${c.green}"/>`, dot(148, 70, 7, c.amber),
    `<g transform="translate(178 128)"><circle r="15" fill="${c.red}" ${S}/>${line('M0-6v12M-6 0h12', c.paper, 3)}</g>`,
    star(48, 52, 9, c.amber), star(206, 66, 6, c.violet), dot(50, 132, 4, c.red),
  ],
  // No notifications: the bell is asleep.
  bell: () => [
    `<circle cx="120" cy="96" r="58" fill="${c.violetSoft}"/>`,
    `<circle cx="120" cy="40" r="6" fill="${c.paper}" ${S}/>`,
    off('M120 46c-24 0-38 18-38 42v20l-12 16h100l-12-16V88c0-24-14-42-38-42z', c.amber),
    `<path d="M108 128a12 12 0 0 0 24 0z" fill="${c.dark}"/>`,
    line('M100 70c2-6 6-10 12-12', c.paper, 3).replace(/<path/, '<path transform="translate(-4 4)"'),
    line('M164 46h10l-10 10h10M180 30h7l-7 7h7', c.violet, 2.2),
    star(52, 60, 8, c.red), star(190, 128, 7, c.amber), dot(50, 130, 5, c.green),
  ],
  // No data yet: a chart card waiting for numbers.
  chart: () => [
    `<ellipse cx="120" cy="156" rx="74" ry="8" fill="${c.amberSoft}"/>`,
    off(rr(60, 40, 124, 104, 10), c.violetSoft, c.paper),
    `<rect x="80" y="100" width="16" height="28" rx="3" fill="${c.lineSoft}"/><rect x="104" y="84" width="16" height="44" rx="3" fill="${c.violet}"/><rect x="128" y="94" width="16" height="34" rx="3" fill="${c.amber}"/><rect x="152" y="68" width="16" height="60" rx="3" fill="${c.red}"/>`,
    line('M74 128h100'), line('M76 58h30'),
    line('M84 86l26-14 22 8 30-20', c.green, 2.4), dot(162, 60, 4, c.green),
    star(204, 44, 9, c.amber), star(40, 120, 7, c.violet), dot(40, 50, 5, c.red),
  ],
  // The trash is empty: a clean bin, lid lifted.
  trash: () => [
    `<ellipse cx="120" cy="156" rx="64" ry="8" fill="${c.greenSoft}"/>`,
    off('M80 76h80l-8 72a8 8 0 0 1-8 7H96a8 8 0 0 1-8-7z', c.violetSoft, c.paper),
    line('M106 92l2 46M120 92v46M134 92l-2 46'),
    `<g transform="rotate(-14 98 64)">${off(rr(72, 56, 96, 14, 6), c.red)}<path d="M108 56v-6a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v6" ${S}/></g>`,
    line('M60 54l-8-6M58 66H48M168 40l6-7'),
    star(188, 74, 9, c.amber), star(46, 112, 7, c.green), dot(192, 132, 5, c.violet),
  ],
  // Nothing matches the filters: everything poured in, nothing came out.
  filter: () => [
    `<circle cx="120" cy="100" r="58" fill="${c.amberSoft}"/>`,
    `<circle cx="96" cy="34" r="6" fill="${c.red}" ${S}/><circle cx="122" cy="26" r="6" fill="${c.amber}" ${S}/><circle cx="146" cy="38" r="6" fill="${c.green}" ${S}/>`,
    off('M58 56h124l-46 50v34l-32 14v-48z', c.violet),
    `<path d="M128 156h24" stroke="${c.line}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 5"/>`,
    star(196, 74, 9, c.red), star(42, 120, 7, c.amber), dot(194, 140, 5, c.green),
  ],
};

const root = new URL('../../', import.meta.url);
const outs = ['packages/gradient/illustrations/', 'apps/site/public/illustrations/'].map(p => new URL(p, root));
const only = process.argv.slice(2);
for (const [name, draw] of Object.entries(OBJECTS)) {
  if (only.length && !only.includes(name)) continue;
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none" aria-hidden="true">\n  ${draw().join('\n  ')}\n</svg>\n`;
  if (/xlink|<use|url\(#/.test(s)) throw new Error(`${name}: has references`);
  for (const o of outs) if (fs.existsSync(o)) fs.writeFileSync(new URL(`${name}.svg`, o), s);
  console.log(`${name}.svg ${s.length} B`);
}
