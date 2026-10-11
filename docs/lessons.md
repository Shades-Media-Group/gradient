# Lessons every Shades project follows

These rules come from the owner's own corrections on PageRecast, the first product built after the brand settled, and from the shades.md site he wants rebuilt. Each one names a pattern he rejected as "AI slop": work that reads as generated or templated instead of made by senior designers. A Shades product ships none of them.

If a rule seems to be in the way, raise it in an issue. Don't quietly break it.

## Show the real thing

1. **No stand-ins.** No skeleton illustrations, grey placeholder bars, fake browser windows with three dots, or mock app screens. Show the real product, page, capture or file. If it doesn't exist yet, show nothing.
2. **No fake demos.** On PageRecast a made-up sample site was rejected: "not add this fake site, bring it back". When a demo needs material, use a real Shades page or a clearly labelled sample built for the purpose.
3. **No invented proof.** No made-up stats, testimonials, client logos or "∞ possibilities" numbers. The old shades.md shipped blurred lorem-ipsum testimonials and vanity stats; Gradient doesn't.

## Type

4. **No monospace costume.** Numbers, sizes and metadata use tabular figures in the body face (`.g-num`). Monospace is only for code someone types. The owner called mono data text "AI slop" on PageRecast.
5. **No labels above headings.** No eyebrows, tracked small caps, kicker words or decorative section numbers. The heading carries its own weight.
6. **Buttons and links are never italic.**
7. **Normal, professional faces.** When he rejected fonts, the fix was a more ordinary, more professional face, not a quirkier one.

## Layout

8. **No boxes inside boxes.** Lists sit on hairlines. Cards are rare and never nested. No tinted callout boxes, no coloured side borders.
9. **Icons only when they mean something.** No icon on every row or list item, and no icon in a circle as the centrepiece of an empty state.
10. **Every space has a job.** Dense and purposeful, never empty for effect and never padded with filler. "All the space needs to be used for a purpose."
11. **Don't repeat a device.** PageRecast's red "Nothing leaves your computer" block was reused until he objected. One red chapter per page; vary the rest.
12. **Not too long.** A side panel that scrolled forever was cut down. Say it once, at the right size.

## Brand

13. **Flat marks.** Logos are flat and two-dimensional, like Google's and Apple's. No shadows, no glossy 3D app-icon renders. Twenty-plus logo rounds on PageRecast ended on a flat overlap.
14. **Products can have their own mark.** PageRecast has its own identity and relies less on Shades visuals. A product uses Gradient's type, roles and rules, not necessarily the Shades mark.
15. **The logo comes from shades.md.** The Claude Design explorations draw it wrong (rounded corners, pink bars). Gradient generates it from the site's own files.
16. **No gradient text, glass, glow or decorative blur.** The old shades.md hero used rainbow gradient words, a blurred aurora image, a glowing cursor trail and a mouse "scroll" cue. All four are out.

## Craft

17. **Buttons people want to press.** When CTAs felt weak, the fix was the brand's pill buttons with a clear arrow. Where people liked existing buttons, those stayed: "not replace them all".
18. **Recognisable brand marks inside buttons.** Store buttons carry the Chrome or Figma mark in a rounded tile, so the giants are recognised at a glance.
19. **Animation like Apple's: it explains something.** PageRecast's exploded layers and Gradient's splitting mark show how the thing works. Motion that only decorates is cut.
20. **Fast first.** Static HTML, no third-party scripts, self-hosted fonts, a strict CSP. The page opens instantly on a phone.

## Process

21. **Check before calling it done.** Screenshots in light and dark at phone and desktop widths, the audits green, the design review run. "Done" without a check is not done.
22. **Commits like a real project.** One logical change per conventional commit, pushed as you go, with no AI attribution.
23. **Never name competitors in public.** Not in the README, docs, UI, store listings or commits.
24. **Free means free.** No paywalls, limits or upgrade prompts in the open-source products.
