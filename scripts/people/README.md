# People scenes

The eight `people-*` illustrations in `packages/gradient/illustrations/` are built here. The Owner approved them on 2026-11-25 ("nice, like them"). They go beside the seven object drawings (`nothing`, `pick`, `folder`, `done`, `welcome`, `offline`, `caller`), which stay unchanged and are not built here.

- `humaaans/`: 32 figures (`standing-1` to `standing-24`, `sitting-1` to `sitting-8`) from Humaaans by Pablo Stanley, humaaans.com, under CC0. They're free for commercial use and need no credit; every scene credits them in a comment anyway.
- `kit.mjs`: `figure()` recolours a pose onto the `--g-ill-*` tokens. It also holds `star4()`, the 4-point sparkle; `blob()`, the soft wash; `svg()`, the 480 × 360 frame; and `finish()`. `finish()` maps names to tokens, rejects references and adds the credit.
- `scenes.mjs`: one function per scene. `yarn people` writes every scene into the package and the site, and `yarn people lookup` writes one.
- `sheet.mjs`: `node scripts/people/sheet.mjs /tmp/people.png` renders every scene at 480 and 240 px, on light and on dark.

## Adding a scene

1. **The moment.** Name the state in one sentence: "nothing found", "you're offline". A scene goes on a full page or a hero. A small pane or compact tool uses an object drawing.
2. **The pose.** Choose a pose from `humaaans/` that acts the moment out: reaching, walking in, sitting and waiting, holding something out. Pick a different pose from the other scenes'. Never draw or edit a body by hand.
3. **The clothes.** Dress the figure with `swap`, mapping a Humaaans hex to a token. Tops and trousers can be red, violet, amber, green or dark, and red leads the set. Each part takes a fill and its darker shade (`red` with `red-deep`, `violet` with `violet-deep`). Skins and hair stay as drawn.
4. **One prop that says the moment.** A door, a magnifier, a plug, a card. Use flat token fills, `line-soft` for edges on white, and no outlines on the figure.
5. **The wash and the sparkles.** Use one pale wash (`red-wash`, `violet-wash`, `green-wash` or `amber-soft`), three `star4` sparkles in three colours and one dot. Keep them clear of the figure.
6. **Check it.** Run `yarn people <name>` and the sheet. At 240 px the moment must still read. On dark the colours must hold. Any new token goes into `src/tokens.json` with a dark value, and into `T` in `kit.mjs`.
7. **Ship it.** Name the file `people-<moment>.svg`, add it to the components page and the README, and make a minor release.

## What the Owner rejected

- **People drawn in code.** He rejected six rounds of these between 2026-11-24 and 2026-11-25: outlined stick figures, colour-block figures with long necks and mitten hands, figures built from a kit, and people hand-coded from Google's rules ("distorphic and not human and imposible").
- **A stock library used as it comes.** "better, but not the new style, too detailed".
- **Copying Google's people 1:1.** That would be their work.

## Two ways to show a person with an object

- **`people-*`**: draw the prop flat, in the people style, sized to the person, and put it in or under the hands (`people-lookup`, `people-pick`, `people-inbox`). Measure the pose's hands first.
- **`duo-*`**: place a whole outlined object drawing beside the figure with `object()` from `kit.mjs`. The Owner approved these on 2026-11-26.

Both ship. Mix them with objects alone and people alone, so every screen has its own drawing.
