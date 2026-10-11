# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Built the way PageRecast is built, at the owner's request:

- Yarn 1 workspaces on Node 22, written in TypeScript.
- `packages/gradient` is published to npm as `shades-gradient`. The name `gradient` is taken. It is framework-agnostic: CSS custom properties, CSS component classes, a Tailwind v4 `@theme` file, DTCG token JSON, icon SVG strings and brand SVGs.
- `apps/site` is a static multi-page Vite build. Pages come from templates plus one JSON dictionary per language. It is served by a Cloudflare Worker (static assets, wrangler) at `gradient.shades.md`, with a build-time SEO check.

## Users

The site is mainly for the Shades Media Group team, and the AI agents working with them, while they build Shades products and client work: PageRecast, the upcoming ImageReframe, the shades.md rebuild, nails-by-alynna, lms. Readers come to look up a token, copy a component, check a logo rule, or learn how a past project went before starting the next one. Clients may also be shown it as proof of how Shades works.

## Product Purpose

Gradient is the Shades Media Group design system. The company is called Shades, and a gradient is what you get when shades combine. It holds the brand: logo, colour, type, the Spectra mascot family and motion. It also holds the code every Shades project installs (tokens, CSS components, icons), the rules for print and merchandise (badges, cards, assets), and the written lessons from past projects.

Success means a new Shades project starts from Gradient instead of from a template, and nothing it ships reads as AI-generated.

## Positioning

It is one agency's living system, built from the projects it has actually shipped. It is not a generic UI kit. Every rule traces back to a real decision on a real product, including the things the owner rejected.

## Operating Context

- **Consumers:** React 19 + Tailwind v4 apps (nails-by-alynna, lms), Preact/Vite apps and extensions (PageRecast), static sites on Cloudflare Workers, and a Figma plugin (ImageReframe, planned).
- **Languages:** the site ships in English, French, Romanian, Russian, Spanish, Italian, Turkish, Hindi, Japanese, and Simplified and Traditional Chinese.
- **Authors:** work is often done by Claude Code sessions, so the docs have to be readable by agents (CLAUDE.md, llms.txt).

## Capabilities and Constraints

- **Brand theming:** tokens are split into Shades primitives and semantic roles, so client brands such as nails and lms can re-theme the roles without forking the components.
- **No framework lock-in:** the first release ships no React components. Framework wrappers are a later step.
- **Fast:** static HTML first, no third-party scripts, self-hosted fonts and a strict CSP.
- **Open source:** the code is MIT. The brand stays reserved: the Shades name, logo and Spectra characters belong to Shades Media Group (see TRADEMARKS.md).
- **Undecided:** the deeper brand philosophy, which the owner will revisit. Print specifications are a starting point, not yet production-proofed with a printer.

## Brand Commitments

- **Name:** Shades Media Group, "Shades", a creative and technology agency in Chișinău, Moldova.
- **Logo:** the live shades.md files are the only source. The mark is a sharp-cornered `#E40523` square with three white bars at 100%, 75% and 50% opacity. The lockup is the mark plus the SHADES wordmark in `#E40523`. The Claude Design exports draw it wrong.
- **Shades in the mark:** the bars at stepped opacity are the brand idea, and the reason for the name Gradient.
- **Mascots:** the Spectra family of characters belongs to the brand.
- **Credit lines:** in products, "Built by Shades Media Group". In READMEs, "Built by Cristian Brinza | Shades Media Group".
- **Public artifacts:** never name competitors or say a product copies one.
- **Voice:** sell the result, not the feature; short declarative lines; one slogan per surface ("Where identity becomes experience."). Word swaps: cheap → affordable, discount → special offer, unique → exceptional.
- **Rejected work:** the owner rejects anything that reads as AI-generated or templated. The full list is in CLAUDE.md and docs/lessons.

## Evidence on Hand

- **Logo:** `shades.md/client/public/images/logo.svg` and the `ShadesLogo` component in `Navbar.tsx`.
- **Brand explorations:** `shades.md/client/src/pages/Page_design_v2/`, covering the Brand System, the Spectra Family v1/v2 and Spectra Motion. Use them as reference only.
- **PageRecast:** live at pagerecast.shades.md, with its chat history (the project's decisions and the owner's rejections) and its repository.
- **Products using the system:** nails-by-alynna and lms, both running.
- **Not on hand:** client testimonials, metrics or customer logos. Never invent them.

## Product Principles

1. **Built from real work.** Every rule comes from a shipped project. Nothing is decoration.
2. **One source, many outputs.** Tokens are defined once and emitted to CSS, Tailwind and JSON. The logo geometry is defined once and emitted to every file.
3. **Recognised in a glance:** red, ink, paper and the three bars. Red is the signal, never wallpaper.
4. **Fast by default.** Every consumer inherits static, light and accessible output.
5. **Write down the "no".** Rejected patterns are documented as carefully as the approved ones.

## Accessibility & Inclusion

- WCAG 2.2 AA contrast in light and dark themes.
- Full keyboard use with visible focus.
- `prefers-reduced-motion` respected.
- Touch targets of at least 24 px.
- Type that covers Romanian diacritics, Cyrillic and CJK fallbacks.
