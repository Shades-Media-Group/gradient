---
name: shades-craft
description: The Shades Media Group quality bar for any visual, layout or copy work on gradient.shades.md or a Shades product site. Use before designing a page or chapter, making a graphic, render or mockup, writing site copy, or adapting a layout for phones, and as the audit before calling visual work done.
---

# Shades craft

The owner rejects work that looks generated or templated: "made by a graphic design student", "AI slop", "water" copy. This skill is the bar. Read [docs/design-philosophy.md](../../../docs/design-philosophy.md) and [docs/lessons.md](../../../docs/lessons.md) first; the brand values come from `packages/gradient/src/tokens.json` and the logo from `packages/gradient/brand/`.

## Before you design

1. Name the one idea the section must get across, in a sentence.
2. Pick a device that has not been used in the previous chapter.
3. Decide the phone layout first: what is added, removed or reshaped below 560 px.

## Graphics

- Physical objects (stationery, merchandise, signage) are rendered, never drawn: add or edit a scene in `scripts/renders/scenes.js`, lay out the print file in `scripts/renders.mjs`, run `yarn renders <name>`, then Read the WebP and audit it.
- Studio rules: the window sun from the left (`windowFrame` + `light({ kind: 'area' })` + a `sky`), long lens (fov 13 to 25), `shoot(256, 7, { aperture, focus })` for depth of field. Cloth comes from `scripts/renders/garment.js` (simulated), never from a puffed outline.
- Apply the mark large and cropped, or small and deliberate; one colour on fabric; the spectrum only as a trim, once.
- Diagrams, specimens and print files may be flat SVG. Illustrations of objects may not.

## Copy

Use the installed `stop-slop` and `better-writing` skills on every string you write, then check: one idea per sentence, 20 words at most, no restating what the heading says, leads of one or two sentences. Every string goes into all eleven `apps/site/i18n/*.json` files.

## The audit (mandatory, every time)

Write the flaws down before deciding. A visual passes only if all are true:

1. Would Apple, Pentagram or a top bank's brand team publish it as it is?
2. Silhouette, proportions and material read as the real thing at a glance.
3. Same light direction and lens logic as the rest of the set; no colour cast.
4. The brand is applied with confidence, not centred small.
5. On a 375 px phone it is designed, not squeezed, and nothing covers it.
6. No block repeats what is already on screen.

If any is false, fix it or cut it. Never present a failing visual as done. Then run `yarn audit:layout`, look at light and dark at both widths, and run `impeccable detect` on changed templates and CSS.
