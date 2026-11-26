// The Shades people scenes. `yarn people` writes packages/gradient/illustrations/people-*.svg
// and the site's copies. `yarn people <name>` writes one. Method: scripts/people/README.md.
import fs from 'node:fs';
import { figure, object, svg, star4, blob, v, finish } from './kit.mjs';

const ls = v('line-soft', '#E4E4EA'), paper = v('paper', '#FFFFFF'), dark = v('dark', '#26262E');

const SCENES = {
  // Lookup: reaching for the contact that just came up; two more cards drift behind.
  lookup() {
    const B = [`<path d="M96 250c-14-70 30-150 120-168 74-15 150 10 176 70 24 58-6 120-70 136-60 15-200 26-226-38z" fill="${v('red-wash', '#FFF0F2')}"/>`];
    const card = (x, y, a, dot, bg = v('paper', '#FFFFFF')) => `<g transform="translate(${x} ${y}) rotate(${a})">
<rect x="-38" y="-24" width="76" height="48" rx="8" fill="${bg}" stroke="${v('line-soft', '#E4E4EA')}" stroke-width="2"/>
<circle cx="-19" cy="-3" r="9" fill="${dot}"/>
<rect x="-3" y="-11" width="30" height="5" rx="2.5" fill="${v('dark', '#2B2B3A')}"/>
<rect x="-3" y="-1" width="20" height="4" rx="2" fill="${v('line-soft', '#C9C9D2')}"/>
<rect x="-26" y="12" width="52" height="4" rx="2" fill="${v('line-soft', '#C9C9D2')}"/></g>`;
    B.push(card(372, 100, -10, v('violet', '#D212D6')));
    B.push(card(398, 186, 9, v('amber', '#FFAF33')));
    B.push(figure('standing-13', { x: 84, y: 34, s: 0.62, swap: { '#1F28CF': v('red', '#E40523'), '#2B44FF': v('dark', '#2B2B3A'), '#2026A2': v('red-deep', '#B5031B') } }));
    B.push(card(270, 114, -4, v('red', '#E40523')));
    B.push(star4([342, 52], 13, v('amber', '#FFAF33')), star4([432, 262], 9, v('red', '#E40523')), star4([96, 120], 8, v('violet', '#D212D6')));
    B.push(`<circle cx="440" cy="120" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  // All done: striding off, one hand out towards the big tick.
  done() {
    const B = [`<path d="M104 262c-20-74 36-160 130-170 86-9 160 34 168 104 8 72-56 118-140 116-70-2-140 14-158-50z" fill="${v('green-wash', '#EAF8F2')}"/>`];
    B.push(`<circle cx="338" cy="122" r="46" fill="${v('green', '#00A96E')}"/>`);
    B.push(`<path d="M316 123l15 15 29-31" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`);
    B.push(figure('standing-23', { x: 86, y: 40, s: 0.6 }));
    B.push(star4([396, 66], 13, v('amber', '#FFAF33')), star4([292, 58], 8, v('red', '#E40523')), star4([408, 214], 10, v('violet', '#D212D6')));
    B.push(`<circle cx="112" cy="110" r="5" fill="${v('red', '#E40523')}"/>`, `<circle cx="420" cy="150" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  // Nothing here yet: sitting on a cube beside an open, empty folder.
  empty() {
    const B = [`<path d="M80 258c-12-72 40-150 140-160 90-9 170 30 180 100 10 70-50 112-140 112-80 0-168 14-180-52z" fill="${v('violet-wash', '#FBF0FB')}"/>`];
    B.push(`<path d="M78 196h40l10 12h62a6 6 0 0 1 6 6v92H78a6 6 0 0 1-6-6v-98a6 6 0 0 1 6-6z" fill="${v('amber-deep', '#E0900F')}"/>`);
    B.push(`<path d="M66 236h134a6 6 0 0 1 6 7l-10 63H72l-12-63a6 6 0 0 1 6-7z" fill="${v('amber', '#FFAF33')}"/>`);
    B.push(figure('sitting-4', { x: 200, y: 70, s: 0.6, swap: { '#2B44FF': v('green', '#00A96E'), '#1F28CF': v('green-deep', '#008556') } }));
    B.push(star4([136, 160], 12, v('red', '#E40523')), star4([94, 176], 7, v('violet', '#D212D6')), star4([420, 96], 10, v('amber', '#FFAF33')));
    B.push(`<circle cx="190" cy="150" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  // Welcome: walking in through an open red door.
  welcome() {
    const B = [blob(v('red-wash', '#FFF0F2'))];
    B.push(`<rect x="300" y="70" width="96" height="238" rx="6" fill="${v('red', '#E40523')}"/>`);
    B.push(`<rect x="312" y="82" width="72" height="226" fill="${v('red-soft', '#FFDDE2')}"/>`);
    B.push(`<path d="M384 82l46 26v214l-46-14z" fill="${v('amber', '#FFAF33')}"/><circle cx="420" cy="200" r="4" fill="${dark}"/>`);
    B.push(figure('standing-5', { x: 112, y: 34, s: 0.58, swap: { '#FF4133': v('violet', '#D212D6'), '#DB2721': v('violet-deep', '#A00EA3') } }));
    B.push(star4([446, 60], 11, v('amber', '#FFAF33')), star4([110, 120], 9, v('red', '#E40523')), star4([236, 54], 7, v('violet', '#D212D6')));
    B.push(`<circle cx="98" cy="214" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  // No results: a big magnifier held out, nothing under it.
  search() {
    const B = [blob(v('violet-wash', '#FBF0FB'))];
    B.push(figure('standing-16', { x: 70, y: 30, s: 0.62, swap: { '#2B44FF': v('red', '#E40523'), '#1F28CF': v('red-deep', '#B5031B') } }));
    B.push(`<path d="M298 112l-30 26" stroke="${dark}" stroke-width="10" stroke-linecap="round"/>`);
    B.push(`<circle cx="326" cy="86" r="38" fill="${paper}" stroke="${dark}" stroke-width="10"/>`);
    B.push(`<path d="M306 70a24 24 0 0 1 20-8" stroke="${v('violet-soft', '#FAE0FA')}" stroke-width="6" stroke-linecap="round"/>`);
    B.push(star4([410, 72], 12, v('amber', '#FFAF33')), star4([420, 230], 9, v('violet', '#D212D6')), star4([120, 92], 8, v('green', '#00A96E')));
    B.push(`<circle cx="392" cy="176" r="4" fill="${v('red', '#E40523')}"/>`);
    return B;
  },
  // Pick one: sitting on a ball, reaching for the highlighted card of three.
  pick() {
    const B = [blob(v('amber-soft', '#FFE7BF'))];
    const tile = (x, y, on) => `<rect x="${x}" y="${y}" width="58" height="72" rx="8" fill="${on ? v('red', '#E40523') : paper}" stroke="${on ? 'none' : ls}" stroke-width="2"/><circle cx="${x + 29}" cy="${y + 26}" r="11" fill="${on ? paper : v('violet-soft', '#FAE0FA')}"/><rect x="${x + 14}" y="${y + 48}" width="30" height="5" rx="2.5" fill="${on ? paper : v('line-soft', '#C9C9D2')}"/>`;
    B.push(tile(40, 142, false), tile(106, 142, false), tile(172, 128, true));
    B.push(figure('sitting-1', { x: 196, y: 88, s: 0.6, swap: { '#FF4133': v('green', '#00A96E'), '#DB2721': v('green-deep', '#008556'), '#2B44FF': dark, '#1F28CF': v('dark-mid', '#55556A') } }));
    B.push(star4([200, 96], 12, v('amber', '#FFAF33')), star4([420, 110], 9, v('red', '#E40523')), star4([96, 230], 7, v('violet', '#D212D6')));
    return B;
  },
  // Offline: the cable is out; the socket waits on the right.
  offline() {
    const B = [blob(v('green-wash', '#EAF8F2'))];
    B.push(`<rect x="370" y="150" width="54" height="70" rx="10" fill="${paper}" stroke="${ls}" stroke-width="2"/><rect x="386" y="172" width="6" height="18" rx="3" fill="${dark}"/><rect x="402" y="172" width="6" height="18" rx="3" fill="${dark}"/>`);
    B.push(figure('sitting-8', { x: 104, y: 76, s: 0.6, swap: { '#FF9B21': v('violet', '#D212D6'), '#E87613': v('violet-deep', '#A00EA3') } }));
    B.push(`<path d="M190 300c40 10 90 6 120-20 20-18 26-44 30-70" stroke="${dark}" stroke-width="5" stroke-linecap="round" fill="none"/>`);
    B.push(`<rect x="326" y="186" width="30" height="24" rx="6" fill="${v('red', '#E40523')}" transform="rotate(-70 341 198)"/><path d="M338 178v-12M348 181l2-12" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>`);
    B.push(star4([364, 120], 11, v('amber', '#FFAF33')), star4([108, 110], 9, v('red', '#E40523')), star4([440, 260], 7, v('violet', '#D212D6')));
    return B;
  },
  // Team: two people meet over a contact card.
  team() {
    const B = [blob(v('red-wash', '#FFF0F2'))];
    B.push(figure('standing-6', { x: 46, y: 40, s: 0.58, swap: { '#FF9B21': v('red', '#E40523'), '#E87613': v('red-deep', '#B5031B') } }));
    B.push(figure('standing-12', { x: 436, y: 40, s: 0.58, flip: true, swap: { '#2F3676': v('violet', '#D212D6'), '#5C63AB': v('violet-deep', '#A00EA3') } }));
    B.push(`<g transform="translate(240 116) rotate(-6)"><rect x="-30" y="-20" width="60" height="40" rx="7" fill="${paper}" stroke="${ls}" stroke-width="2"/><circle cx="-14" cy="-2" r="8" fill="${v('green', '#00A96E')}"/><rect x="0" y="-8" width="20" height="4" rx="2" fill="${dark}"/><rect x="0" y="1" width="14" height="4" rx="2" fill="${v('line-soft', '#C9C9D2')}"/></g>`);
    B.push(star4([240, 52], 13, v('amber', '#FFAF33')), star4([100, 96], 8, v('violet', '#D212D6')), star4([400, 82], 9, v('red', '#E40523')));
    return B;
  },
  // People with an object: a Humaaans figure acting with one of Gradient's object drawings.
  ...withObject({
    inbox: ['standing-3', 'red-wash', { '#2B44FF': v('red', '#E40523'), '#1F28CF': v('red-deep', '#B5031B') }],
    calendar: ['standing-1', 'violet-wash', {}],
    chat: ['sitting-2', 'amber-soft', { '#2B44FF': v('green', '#00A96E'), '#1F28CF': v('green-deep', '#008556') }, 'chat'],
    locked: ['standing-9', 'red-wash', { '#FF4133': v('amber', '#FFAF33'), '#DB2721': v('amber-deep', '#E0900F') }],
    error: ['standing-15', 'violet-wash', {}],
    upload: ['standing-10', 'violet-wash', { '#2B44FF': dark, '#1F28CF': v('dark-mid', '#55556A') }, 'folder'],
    call: ['standing-24', 'red-wash', { '#2B44FF': v('red', '#E40523'), '#1F28CF': v('red-deep', '#B5031B') }, 'caller'],
    checklist: ['standing-8', 'green-wash', { '#2B44FF': v('green', '#00A96E'), '#1F28CF': v('green-deep', '#008556') }, 'done'],
    chart: ['standing-17', 'amber-soft', {}],
    notify: ['sitting-7', 'violet-wash', {}, 'bell'],
  }),
};

function withObject(list) {
  const out = {};
  const wash = { 'red-wash': '#FFF0F2', 'violet-wash': '#FBF0FB', 'green-wash': '#EAF8F2', 'amber-soft': '#FFE7BF' };
  for (const [name, [pose, w, swap, obj = name]] of Object.entries(list)) {
    const sitting = pose.startsWith('sitting');
    out[name] = () => [
      blob(v(w, wash[w])),
      object(obj, { x: 168, y: sitting ? 70 : 56, s: 1.3 }),
      figure(pose, { x: 34, y: sitting ? 96 : 44, s: sitting ? 0.6 : 0.58, swap }),
    ];
  }
  return out;
}

const root = new URL('../../', import.meta.url);
const outs = ['packages/gradient/illustrations/', 'apps/site/public/illustrations/'].map(p => new URL(p, root));
const only = process.argv.slice(2);
for (const [name, draw] of Object.entries(SCENES)) {
  if (only.length && !only.includes(name)) continue;
  const s = finish(name, svg(draw()));
  for (const o of outs) fs.writeFileSync(new URL(`people-${name}.svg`, o), s);
  console.log(`people-${name}.svg ${s.length} B`);
}
