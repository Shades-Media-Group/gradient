# Tool panels

How a Shades tool panel is laid out: a Figma plugin, a browser extension, a small app. It comes from the ImageRefold redesign, which replaced a first panel the owner called AI slop: "very complicated, hard to tell the setting blocks apart, a lot of font sizes, the grid looks AI". The approved panel is the reference: `assets/store/source/plugin-export-light.png` and `plugin-optimise-dark.png` in the [ImageRefold repository](https://github.com/Shades-Media-Group/ImageRefold), built from `apps/figma-plugin/src/ui/app.css` and `views.tsx`.

## The shape

- **One calm screen per task.** The main job fits without scrolling, in this order:
  1. the stage: what you are working on, about 208 px tall, radius 12 px, the real file shown whole
  2. one figure: the result at 20 px / 600, with what it means in 11 px beside it
  3. labelled rows
  4. one action
- **Labelled rows, not headed blocks.** A 56 px label column (11 px, muted) and one control per row. No section titles. No hairline between every group: hairlines only between zones (stage and rows, rows and list, content and dock).
- **Three type sizes, two weights.** 11 px for meta, 12 px for body and controls, 20 px for the one figure. Weights 400 and 600.
- **One action, in the dock.** A red pill (radius 999 px, soft red shadow) that says what it does and what it produces: "Download 2 files as ZIP · 87 KB".
- **Gradient's controls at panel density.**
  - A pill segmented track with a raised pill for one choice.
  - Pill chips for several choices; selected is an ink fill.
  - Inputs with radius 8 px.
- **Typing beats chips for long tails.** Common values are one-click chips (1×, 2×, 3×); anything else is typed ("0.5x, 1200").

## Settings, memory, theme

- **Rare options live in Settings,** behind a gear icon at the top right: theme, naming, output mode, advanced switches.
- **Reset all preferences** closes the Settings page. It stays disabled until something differs from the defaults, and it confirms in two steps.
- **Credit, version, feedback and source links** close the Settings page too, not every screen.
- **Everything the user sets is remembered** between runs (`clientStorage` in Figma, `storage` in extensions). Older saved settings are migrated, never dropped.
- **Light by default, whatever the host's theme.** `data-theme` on `<html>` is `light`, `dark` or `auto`, chosen in Settings as Light / Dark / Automatic. Dark tokens apply only under `[data-theme='dark']`, or under `[data-theme='auto']` when the host is dark. Websites do the same with `<html data-theme-default="light">` (shades-gradient 0.4.0).

## Words on the panel

- **Empty states are two lines:** what to do, and what you'll get. They sit in a dashed, rounded box in the stage's place. No feature lists, no intro paragraphs, no "What it does".
- **Text earns its place.** No explanatory paragraphs on the main screens, one short note at most.
- **Errors say what failed and what to do next.**

## The process

1. **Ask before redesigning.** Ask the owner what feels wrong, as one structured question with two or three options. Don't guess.
2. **Tag the current version** before a redesign (ImageRefold's is `plugin-ui-v1`), so a rollback is one command.
3. **Build in a browser harness** that stands in for the host (ImageRefold's `apps/figma-plugin/harness.html`). Check light, dark and every screen, then run `impeccable detect`.
4. **Test in the real host** (Figma desktop) before publishing: real selections, huge frames, every format.
5. **Guard the edges the harness can't show.** Refuse work too big to finish, with a clear message, before starting it. Recover from a crashed worker.
6. **Retake the store screenshots and README banners** from the real panel after every UI change.
