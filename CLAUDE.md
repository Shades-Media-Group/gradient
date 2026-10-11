# Gradient: working notes for agents

Gradient is the design system of Shades Media Group. It holds:

- the brand: logo, colour, type, the Spectra characters, voice, print
- the `shades-gradient` npm package that every Shades product installs
- the website at gradient.shades.md, in eleven languages

Product truth lives in [PRODUCT.md](PRODUCT.md); the rejected patterns live in [docs/lessons.md](docs/lessons.md). Read both before any visual work.

## Commands

```bash
yarn verify          # typecheck, lint, tests, package build, site build, site audit: before every commit
yarn audit:layout    # all 77 pages at 375 and 1440 px: before every UI commit
yarn dev:site        # the website with live reload
yarn deploy:site     # build, audit, wrangler deploy to gradient.shades.md
yarn brand           # regenerate the logo files from the shades.md geometry
yarn --cwd packages/gradient icons   # rebuild src/icons.ts from icons/*.svg
yarn assets          # social card, touch icon, README banners
```

Use Node 22: `export PATH=$HOME/.nvm/versions/node/v22.23.1/bin:$PATH`; the shell defaults to an older Node.

## Non-negotiables

- **The logo comes from shades.md:** `client/public/images/logo.svg` and the `ShadesLogo` lockup in `Navbar.tsx`. It is a sharp-cornered `#E40523` square with white bars at 100/75/50%. Never redraw it from the Claude Design exports; they round the corners and tint the bars.
- **One source per value:** tokens in `tokens.json`, logo geometry in `scripts/brand.mjs`, icons in `icons/*.svg`. Generated files are never edited by hand.
- **Roles, not raw colours:** components read role tokens (`--g-accent`, `--g-text`, …) only, so a client theme can restyle them.
- **Red is the signal:** the mark, one primary action per view, at most one red chapter per page. The spectrum appears once per layout, never on text.
- **Credits:** in products, "Built by Shades Media Group". In READMEs, "Built by Cristian Brinza | Shades Media Group".
- **Never name or compare competitors in anything public.** Competitor research stays in local, git-excluded files.
- **Commits:** conventional, one logical change each, pushed to `main`. No AI attribution or Co-Authored-By lines.
- **Never invent proof:** numbers, clients, testimonials.

## Design rules

The site follows the PageRecast site's grammar, which the owner approved:

- full-bleed chapters that alternate paper, ink and one red
- a two-column chapter head (heading left, lead right)
- pill buttons, lists on hairlines, real content at full size

Never ship any of these:

- skeleton illustrations, fake browser windows, mock app screens
- monospace for numbers, labels or metadata (use `.g-num`); monospace is for code only
- eyebrow labels, tracked small caps above headings, decorative section numbers
- icons on every row, an icon in a circle as the centre of an empty state
- cards inside cards, lists in rounded boxes, tinted callout boxes, coloured side borders
- gradient text, glass, glow, decorative blur
- emoji or Unicode glyphs as icons: icons come from `packages/gradient/icons`
- italic buttons or links
- 3D or shadowed logos

Before committing UI:

1. Run `yarn audit:layout`.
2. Look at the changed pages in light and dark at both widths.
3. Run `impeccable detect` on the changed templates and CSS.

## Versions

The package version in `packages/gradient/package.json` is the system's version. `yarn release <patch|minor|major>` bumps every workspace, writes the changelog and tags. See [docs/releasing.md](docs/releasing.md).
