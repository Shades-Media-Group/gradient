// The Shades people scenes. `yarn people` writes packages/gradient/illustrations/people-*.svg and duo-*.svg
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
  // People with an object. The prop is drawn here in the people style (flat, no dark outline,
  // sized to the person) and sits in or under their hands, like Lookup's card and Pick one's tiles.
  // Never paste an outlined object drawing into a scene.
  inbox() {
    const B = [blob(v('red-wash', '#FFF0F2'))];
    B.push(paperCard(372, 92, 12, v('violet', '#D212D6')), paperCard(404, 184, -8, v('amber', '#FFAF33')));
    B.push(`<path d="M222 132 267 98l45 34z" fill="${v('red-deep', '#B5031B')}"/>`);
    B.push(`<g transform="rotate(-4 267 124)"><rect x="236" y="92" width="62" height="62" rx="6" fill="${paper}" stroke="${ls}" stroke-width="2"/><circle cx="252" cy="110" r="7" fill="${v('red', '#E40523')}"/><rect x="264" y="104" width="24" height="5" rx="2.5" fill="${dark}"/><rect x="264" y="114" width="16" height="4" rx="2" fill="${ls}"/></g>`);
    B.push(figure('standing-3', { x: 50, y: 36, s: 0.6, swap: { '#2B44FF': v('red', '#E40523'), '#1F28CF': v('red-deep', '#B5031B') } }));
    B.push(`<rect x="218" y="130" width="98" height="64" rx="7" fill="${v('red', '#E40523')}"/><path d="M220 134l47 32 47-32" stroke="${v('red-deep', '#B5031B')}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
    B.push(star4([346, 52], 12, v('amber', '#FFAF33')), star4([96, 112], 8, v('violet', '#D212D6')), star4([440, 262], 9, v('red', '#E40523')));
    B.push(`<circle cx="430" cy="128" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  calendar() {
    const B = [blob(v('violet-wash', '#FBF0FB'))];
    B.push(`<rect x="226" y="58" width="172" height="184" rx="12" fill="${paper}" stroke="${ls}" stroke-width="2"/>`);
    B.push(`<path d="M226 70a12 12 0 0 1 12-12h148a12 12 0 0 1 12 12v26H226z" fill="${v('red', '#E40523')}"/>`);
    B.push(`<rect x="262" y="48" width="8" height="20" rx="4" fill="${dark}"/><rect x="354" y="48" width="8" height="20" rx="4" fill="${dark}"/>`);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) {
      const x = 252 + k * 30, y = 120 + r * 32, on = r === 1 && k === 2;
      B.push(on ? `<circle cx="${x}" cy="${y}" r="12" fill="${v('red', '#E40523')}"/><circle cx="${x}" cy="${y}" r="4" fill="${paper}"/>` : `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="4" fill="${r === 3 && k > 2 ? paper : v('violet-soft', '#FAE0FA')}"/>`);
    }
    B.push(figure('standing-1', { x: 40, y: 36, s: 0.6, swap: { '#2B44FF': v('violet', '#D212D6'), '#1F28CF': v('violet-deep', '#A00EA3') } }));
    B.push(`<rect x="220" y="150" width="30" height="26" rx="4" fill="${v('amber', '#FFAF33')}" transform="rotate(-10 235 163)"/>`);
    B.push(star4([430, 70], 12, v('amber', '#FFAF33')), star4([98, 262], 8, v('red', '#E40523')), star4([436, 240], 9, v('violet', '#D212D6')));
    B.push(`<circle cx="96" cy="200" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  chat() {
    const B = [blob(v('amber-soft', '#FFE7BF'))];
    B.push(`<path d="M132 62h92a18 18 0 0 1 18 18v20a18 18 0 0 1-18 18h-10l8 18-26-18h-64a18 18 0 0 1-18-18V80a18 18 0 0 1 18-18z" fill="${v('red', '#E40523')}"/><rect x="134" y="80" width="72" height="6" rx="3" fill="${paper}"/><rect x="134" y="94" width="46" height="6" rx="3" fill="${paper}"/>`);
    B.push(`<path d="M88 146h86a16 16 0 0 1 16 16v14a16 16 0 0 1-16 16H112l-22 16 4-16h-6a16 16 0 0 1-16-16v-14a16 16 0 0 1 16-16z" fill="${paper}" stroke="${ls}" stroke-width="2"/>`);
    B.push(`<circle cx="106" cy="170" r="6" fill="${v('red', '#E40523')}"/><circle cx="128" cy="170" r="6" fill="${v('amber', '#FFAF33')}"/><circle cx="150" cy="170" r="6" fill="${v('green', '#00A96E')}"/>`);
    B.push(figure('sitting-2', { x: 240, y: 110, s: 0.6, swap: { '#2B44FF': v('green', '#00A96E'), '#1F28CF': v('green-deep', '#008556') } }));
    B.push(`<g transform="rotate(-18 290 192)"><rect x="276" y="168" width="28" height="48" rx="6" fill="${dark}"/><rect x="280" y="174" width="20" height="34" rx="3" fill="${v('violet-soft', '#FAE0FA')}"/></g>`);
    B.push(star4([258, 66], 11, v('amber', '#FFAF33')), star4([66, 110], 8, v('violet', '#D212D6')), star4([428, 112], 9, v('red', '#E40523')));
    B.push(`<circle cx="210" cy="226" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  locked() {
    const B = [blob(v('red-wash', '#FFF0F2'))];
    B.push(figure('standing-9', { x: 40, y: 36, s: 0.6, swap: { '#FF4133': v('amber', '#FFAF33'), '#DB2721': v('amber-deep', '#E0900F') } }));
    B.push(`<path d="M248 158v-30a32 32 0 0 1 64 0v30" stroke="${v('dark-soft', '#55556A')}" stroke-width="13" stroke-linecap="round"/>`);
    B.push(`<rect x="224" y="152" width="112" height="96" rx="16" fill="${v('red', '#E40523')}"/><rect x="224" y="152" width="112" height="16" rx="8" fill="${v('red-deep', '#B5031B')}"/>`);
    B.push(`<circle cx="280" cy="194" r="11" fill="${paper}"/><rect x="274" y="196" width="12" height="28" rx="6" fill="${paper}"/>`);
    B.push(`<path d="M356 150l12-8M360 168h14M354 186l12 6" stroke="${v('red', '#E40523')}" stroke-width="3" stroke-linecap="round"/>`);
    B.push(star4([404, 92], 12, v('violet', '#D212D6')), star4([104, 96], 8, v('red', '#E40523')), star4([420, 244], 9, v('amber', '#FFAF33')));
    B.push(`<circle cx="94" cy="214" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  error() {
    const B = [blob(v('violet-wash', '#FBF0FB'))];
    B.push(figure('standing-15', { x: 40, y: 36, s: 0.6 }));
    B.push(`<g transform="rotate(10 282 162)"><path d="M236 110h80v68l-10 8 8 10-6 14h-72z" fill="${paper}" stroke="${ls}" stroke-width="2" stroke-linejoin="round"/><rect x="248" y="126" width="44" height="6" rx="3" fill="${dark}"/><rect x="248" y="142" width="52" height="5" rx="2.5" fill="${ls}"/><rect x="248" y="156" width="36" height="5" rx="2.5" fill="${ls}"/></g>`);
    B.push(`<path d="M326 166l8-4 4 8zM344 190l9 1-4 8zM334 214l7-6 3 9z" fill="${paper}" stroke="${ls}" stroke-width="2" stroke-linejoin="round"/>`);
    B.push(`<path d="M300 172a6 6 0 0 1 10.4 0l24 42a6 6 0 0 1-5.2 9h-48a6 6 0 0 1-5.2-9z" fill="${v('amber', '#FFAF33')}"/><path d="M305 188v16" stroke="${dark}" stroke-width="5" stroke-linecap="round"/><circle cx="305" cy="213" r="3" fill="${dark}"/>`);
    B.push(star4([400, 80], 12, v('red', '#E40523')), star4([104, 98], 8, v('amber', '#FFAF33')), star4([424, 246], 9, v('violet', '#D212D6')));
    B.push(`<circle cx="430" cy="160" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  upload() {
    const B = [blob(v('violet-wash', '#FBF0FB'))];
    B.push(`<path d="M300 204a8 8 0 0 1 8-8h40l12 12h66a8 8 0 0 1 8 8v86H300z" fill="${v('red-deep', '#B5031B')}"/>`);
    B.push(`<rect x="320" y="186" width="54" height="66" rx="6" fill="${paper}" stroke="${ls}" stroke-width="2" transform="rotate(-8 347 219)"/><rect x="372" y="196" width="40" height="50" rx="6" fill="${v('green', '#00A96E')}" transform="rotate(10 392 221)"/>`);
    B.push(`<path d="M294 232a8 8 0 0 1 8-8h140a8 8 0 0 1 8 8l-8 66a8 8 0 0 1-8 7H310a8 8 0 0 1-8-7z" fill="${v('red', '#E40523')}"/><path d="M372 286v-36M356 264l16-16 16 16" stroke="${paper}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`);
    B.push(figure('standing-10', { x: 30, y: 36, s: 0.6, swap: { '#2B44FF': dark, '#1F28CF': v('dark-mid', '#55556A') } }));
    B.push(`<rect x="182" y="92" width="64" height="44" rx="6" fill="${v('violet-soft', '#FAE0FA')}" transform="rotate(-8 214 114)"/><rect x="188" y="98" width="64" height="44" rx="6" fill="${paper}" stroke="${ls}" stroke-width="2" transform="rotate(-4 220 120)"/><rect x="200" y="110" width="34" height="5" rx="2.5" fill="${dark}"/><rect x="200" y="122" width="24" height="4" rx="2" fill="${ls}"/>`);
    B.push(star4([300, 100], 11, v('amber', '#FFAF33')), star4([96, 96], 8, v('violet', '#D212D6')), star4([440, 150], 9, v('red', '#E40523')));
    B.push(`<circle cx="270" cy="168" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  call() {
    const B = [blob(v('red-wash', '#FFF0F2'))];
    B.push(paperCard(352, 118, 10, v('violet', '#D212D6')));
    B.push(figure('standing-24', { x: 50, y: 36, s: 0.6, swap: { '#2B44FF': v('red', '#E40523'), '#1F28CF': v('red-deep', '#B5031B') } }));
    B.push(`<g transform="rotate(8 236 136)"><rect x="206" y="84" width="60" height="106" rx="12" fill="${dark}"/><rect x="212" y="96" width="48" height="80" rx="6" fill="${paper}"/><circle cx="236" cy="122" r="12" fill="${v('red', '#E40523')}"/><rect x="222" y="146" width="28" height="5" rx="2.5" fill="${ls}"/><rect x="224" y="160" width="24" height="8" rx="4" fill="${v('green', '#00A96E')}"/></g>`);
    B.push(`<path d="M286 76c8 6 12 14 12 24M298 64c12 9 18 21 18 36" stroke="${v('red', '#E40523')}" stroke-width="4" stroke-linecap="round"/>`);
    B.push(star4([420, 70], 12, v('amber', '#FFAF33')), star4([100, 110], 8, v('violet', '#D212D6')), star4([424, 244], 9, v('red', '#E40523')));
    B.push(`<circle cx="330" cy="210" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  checklist() {
    const B = [blob(v('green-wash', '#EAF8F2'))];
    B.push(`<rect x="232" y="66" width="152" height="204" rx="12" fill="${paper}" stroke="${ls}" stroke-width="2" transform="rotate(4 308 168)"/>`);
    B.push(`<rect x="290" y="56" width="40" height="16" rx="6" fill="${dark}" transform="rotate(4 310 64)"/>`);
    const tick = (y, on) => on
      ? `<circle cx="266" cy="${y}" r="13" fill="${v('green', '#00A96E')}"/><path d="M260 ${y}l4.5 4.5 8-9" stroke="${paper}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<circle cx="266" cy="${y}" r="12" fill="${paper}" stroke="${ls}" stroke-width="3"/>`;
    for (const [y, on] of [[112, true], [164, true], [216, false]]) B.push(`<g transform="rotate(4 308 168)">${tick(y, on)}<rect x="290" y="${y - 8}" width="66" height="6" rx="3" fill="${on ? dark : ls}"/><rect x="290" y="${y + 4}" width="44" height="5" rx="2.5" fill="${ls}"/></g>`);
    B.push(figure('standing-8', { x: 40, y: 36, s: 0.6, swap: { '#2B44FF': v('green', '#00A96E'), '#1F28CF': v('green-deep', '#008556') } }));
    B.push(star4([420, 76], 12, v('amber', '#FFAF33')), star4([102, 100], 8, v('red', '#E40523')), star4([430, 236], 9, v('violet', '#D212D6')));
    B.push(`<circle cx="96" cy="206" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  chart() {
    const B = [blob(v('amber-soft', '#FFE7BF'))];
    for (const [x, h, col] of [[244, 70, v('violet-soft', '#FAE0FA')], [286, 128, v('violet', '#D212D6')], [328, 96, v('amber', '#FFAF33')], [370, 176, v('red', '#E40523')]]) B.push(`<rect x="${x}" y="${304 - h}" width="34" height="${h}" rx="4" fill="${col}"/>`);
    B.push(`<path d="M250 206l54-50 42 24 58-74" stroke="${v('green', '#00A96E')}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M392 104l14-4 2 14" stroke="${v('green', '#00A96E')}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`);
    B.push(`<path d="M232 304h188" stroke="${ls}" stroke-width="3" stroke-linecap="round"/>`);
    B.push(figure('standing-17', { x: 30, y: 36, s: 0.6 }));
    B.push(star4([300, 76], 12, v('amber', '#FFAF33')), star4([96, 96], 8, v('violet', '#D212D6')), star4([446, 196], 9, v('red', '#E40523')));
    B.push(`<circle cx="440" cy="84" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
  notify() {
    const B = [blob(v('violet-wash', '#FBF0FB'))];
    B.push(`<circle cx="196" cy="84" r="7" fill="${v('amber-deep', '#E0900F')}"/>`);
    B.push(`<path d="M196 88c-30 0-46 22-46 50v26l-12 18h116l-12-18v-26c0-28-16-50-46-50z" fill="${v('amber', '#FFAF33')}"/><path d="M168 120c3-9 9-15 18-18" stroke="${paper}" stroke-width="5" stroke-linecap="round"/>`);
    B.push(`<path d="M182 182a14 14 0 0 0 28 0z" fill="${v('dark-soft', '#55556A')}"/>`);
    B.push(`<path d="M114 72h14l-14 14h14M96 46h10l-10 10h10" stroke="${v('violet', '#D212D6')}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`);
    B.push(figure('sitting-7', { x: 206, y: 100, s: 0.6, swap: { '#2B44FF': v('red', '#E40523'), '#1F28CF': v('red-deep', '#B5031B') } }));
    B.push(star4([300, 70], 12, v('amber', '#FFAF33')), star4([92, 220], 8, v('red', '#E40523')), star4([440, 120], 9, v('violet', '#D212D6')));
    B.push(`<circle cx="112" cy="262" r="4" fill="${v('green', '#00A96E')}"/>`);
    return B;
  },
};

/** A small contact or message card in the people style: paper, a soft edge, a coloured dot, two bars. */
function paperCard(x, y, a, dot) {
  return `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-34" y="-22" width="68" height="44" rx="8" fill="${paper}" stroke="${ls}" stroke-width="2"/><circle cx="-16" cy="-3" r="8" fill="${dot}"/><rect x="-2" y="-10" width="26" height="5" rx="2.5" fill="${dark}"/><rect x="-2" y="0" width="18" height="4" rx="2" fill="${ls}"/><rect x="-22" y="11" width="44" height="4" rx="2" fill="${ls}"/></g>`;
}

// Duo: a person beside one of the outlined object drawings, two styles side by side.
// The Owner approved these in SocialMonitor on 2026-11-26, next to the held-prop people-* scenes.
const DUO = {
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
};
const WASH = { 'red-wash': '#FFF0F2', 'violet-wash': '#FBF0FB', 'green-wash': '#EAF8F2', 'amber-soft': '#FFE7BF' };
for (const [name, [pose, w, swap, obj = name]] of Object.entries(DUO)) {
  const sitting = pose.startsWith('sitting');
  SCENES[`duo-${name}`] = () => [
    blob(v(w, WASH[w])),
    object(obj, { x: 168, y: sitting ? 70 : 56, s: 1.3 }),
    figure(pose, { x: 34, y: sitting ? 96 : 44, s: sitting ? 0.6 : 0.58, swap }),
  ];
}

const root = new URL('../../', import.meta.url);
const outs = ['packages/gradient/illustrations/', 'apps/site/public/illustrations/'].map(p => new URL(p, root));
const only = process.argv.slice(2);
for (const [name, draw] of Object.entries(SCENES)) {
  if (only.length && !only.includes(name)) continue;
  const s = finish(name, svg(draw()));
  const file = name.startsWith('duo-') ? `${name}.svg` : `people-${name}.svg`;
  for (const o of outs) fs.writeFileSync(new URL(file, o), s);
  console.log(`${file} ${s.length} B`);
}
