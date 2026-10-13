---
name: shades-craft
description: The Shades Media Group quality bar for design, graphics, layout, product panels and copy. Use for any Shades work (gradient.shades.md, PageRecast, ImageRefold, shades.md, a Shades client site or deck) before designing a page, screen, plugin or extension panel, graphic, render, mockup, social post or slide, before writing brand or site copy, and as the audit before calling visual work done.
---

# Shades craft

The owner rejects work that looks generated or templated: "made by a graphic design student", "AI slop", copy full of "water". This skill is the bar. Read these first, in this order:

1. [references/lessons.md](references/lessons.md): every pattern he rejected, in his words.
2. [references/design-philosophy.md](references/design-philosophy.md): why work reads as generated, what senior teams do instead, and the audit.
3. [references/tool-panels.md](references/tool-panels.md): how a plugin, extension or small-app panel is laid out.

The concrete values (colours, type, spacing, logo) come from the Gradient design system, never from memory or from a design export:

- Tokens: `packages/gradient/src/tokens.json` in the gradient repo (on this Mac: `~/Documents/GitHub/shades/gradient`), or the `shades-gradient` package's `tokens.css`.
- Logo: the files in `packages/gradient/brand/`, generated from the shades.md site's own logo. Never redraw it from a Claude Design export: those round the corners and tint the bars.
- Live reference: https://gradient.shades.md.

## Non-negotiables

- Red (#E40523) is the signal: the mark, one primary action per view, at most one red chapter per page. The spectrum appears once per layout, never on text.
- Components read role tokens (`--g-accent`, `--g-text`, …), never raw colours.
- Light is the default theme; dark and system stay choices.
- Monospace is for code only; numbers use tabular figures in the body face.
- No eyebrow labels, cards inside cards, icons on every row, gradient text, glass, glow or decorative blur. Buttons are flat; the red glow (`g-btn--glow`) is opt-in, at most once per marketing page, never in forms or tools.
- Sign-in and work tools use the system face (`--g-font-system`) and neutral near-black text, never brand grotesks with grey on cream.
- Never invent proof: no made-up numbers, clients, quotes or testimonials.
- Never name or compare competitors in anything public.
- No AI-generated images. Real objects are rendered or photographed; downloading a photo needs the owner's yes.
- Emails are built with `shades-gradient/email`, never plain text alone. One-time codes lead the subject with the code and sit on the copyable code pass; meetings attach an .ics invitation plus Google and Outlook links; bookings get a ticket pass and schema.org markup. Rules: `docs/guides/email.md` in the gradient repo.
- Credits: "Built by Shades Media Group" in products, "Built by Cristian Brinza | Shades Media Group" in READMEs.

## Before you design

1. Name the one idea the section or screen must get across, in a sentence.
2. Pick a device that the previous section did not use.
3. Decide the phone layout first: what is added, removed or reshaped below 560 px. Sets of related items swipe on a phone; they don't stack.

## Graphics

- Physical objects (stationery, badges, merchandise, signage) are rendered in the studio pipeline, never drawn. In the gradient repo: add a scene to `scripts/renders/scenes.js`, lay out the print face in `scripts/renders.mjs`, run `yarn renders <name>`, then look at the WebP and audit it.
- One light for the whole set: late sun from the left through a window, a long lens, off-axis, real depth of field.
- Apply the mark large and cropped, or small and deliberate. Never small and centred on a blank object.
- Diagrams, specimens and print files may be flat SVG. Pictures of objects may not.

## Copy

One idea per sentence, 20 words at most, concrete nouns, leads of one or two sentences. No "seamless", "elevate", "empower", "unlock", no rule of three for rhythm, no rhetorical questions. A Shades site string goes into every language file the site has.

## The audit (mandatory, every time)

Write the flaws down before deciding. A visual passes only if all of these are true:

1. Would Apple, Pentagram or a top bank's brand team publish it as it is?
2. Silhouette, proportions and material read as the real thing at a glance.
3. Same light direction and lens logic as the rest of the set; no colour cast.
4. The brand is applied with confidence, not centred small.
5. On a 375 px phone it is designed, not squeezed, and nothing covers it.
6. No block repeats what is already on screen.

If any is false, fix it or cut it. Never present a failing visual as done. Then look at light and dark at phone and desktop widths, run the project's layout audit, and run `impeccable detect` on the changed templates and CSS.
