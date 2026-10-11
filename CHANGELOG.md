# Changelog

Every notable change to Gradient and the `shades-gradient` package. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). See [docs/releasing.md](docs/releasing.md) for what makes a patch, a minor or a major.

## [Unreleased]

### Added

- **Tokens:** `color.secondary` (blue, orange, pink, green, amber) and five signature gradients, `gradient.spectrum`, `shade`, `dawn`, `rose` and `ink`, built to `--g-gradient-*`.
- **Brand page:** Spectra's construction and four expressions (hello, idea, nice, hmm, also as SVG files in `brand/spectra/`), six brand devices, and "Keep Shades, Shades": ten rules in the page's red chapter.
- **Foundations page:** the secondary colours and the signature gradients.
- **Print page:** speaker, attendee and crew badges, shot beside the team and guest ones.
- **Applications page:** the photography direction, eight social posts, stories and reel covers, and keynote slides, in every language.

## [0.4.0] - 2026-10-11

### Added

- **A default theme:** `<html data-theme-default="light">` (or `"dark"`) opens a site in that theme until the reader chooses. The boot script applies it before paint, the panel shows it selected, Reset returns to it, and `defaultTheme()` reads it. The Gradient site now opens in light.
- **Documentation page** (`/docs/`): install, the files in the package, tokens and roles, theming, Tailwind v4, components, icons, display settings and consent, email, motion and versions, in every language, linked from the nav.
- **Accessibility page:** the WCAG 2.2 AA standard, ten promises every product keeps, what each display-panel option does and who it helps, each product's status with its known gaps, how it is tested, and how to report a barrier.
- **Home page:** an "About Shades" section and the product family, with the Gradient, PageRecast, ImageRefold and LMS marks; the brand page lists LMS among the products. ImageRefold appears under its own name and mark.
- **Docs:** `docs/accessibility.md` and `docs/design-philosophy.md`, with the audit every page passes.
- **Product shots** (`yarn renders`): the print files photographed in a code-built studio, and the tee print set into a real photograph.
- **Email passes** (`shades-gradient/email`): every message centres on an ink, red or paper pass with a stub, through `pass()`, `ticket()` and `code()`, in a 520 px column.
- **Site:** an index mosaic of real specimens on the home page, a specimen on every page head, a sticky section bar, a full-screen phone menu, studio shots of the print, and ImageRefold marked live.

### Changed

- **Softer roles:** the page is warm paper (`ink.25`, #F7F6F3), text is `ink.800`, secondary text `ink.500`; dark mode moves to charcoal (`ink.900`) with off-white text. Every pair still passes WCAG AA.
- **Consent banner on phones:** a compact sheet above the home indicator, with Customise beside the title.

### Fixed

- Statement chapters take the full measure on desktop (site)
- Logo plates and the copied note on phones (site)
- A calmer menu size and an optically centred footer wordmark (site)
- Set the email specimen apart from the page (site)
- Headings never split a word, the company name never wraps (site)
- A compact sheet on phones instead of half the screen (consent)
- Drop the about facts that repeated the paragraph (site)
- Show every product as its own logo at one size (site)
- Tighten small text under names and fit every page from 320 px (site)
- Call ImageRefold by its name and show its real mark (site)

## [0.3.0] - 2026-10-11

### Added

- **Email** (`shades-gradient/email`): transactional email that holds up in every client.
  - Outlook-safe table layout, VML buttons for Outlook, a plain-text twin.
  - Codes that Gmail can copy and Apple Mail can fill.
  - RFC 5545 calendar invites, plus Google and Outlook links.
  - schema.org markup for Gmail.
  - Client brands pass their own colours, logo and font.
- **Components:** tabs, inline messages, progress, breadcrumbs, toasts and avatars.
- **Website, new email page:** live previews and a client support matrix.
- **Website, brand page:** now also covers lockups and placement, sizes, colour in use with measured pairings, type in the brand, photography, where each Spectra character appears, writing by moment, and products.
- **Website, components page:** now also covers states, sizes, navigation, feedback, people and accessibility.
- **Website, foundations page:** now also covers elevation, layout and a contrast table computed from the tokens.
- **Website, Google button:** "Add as a preferred source" in the footer and on the home page.

## [0.2.0] - 2026-10-11

### Added

- **Consent banner** (`shades-gradient/consent`): three equal choices, accept all, only necessary or customise by category. Analytics and marketing stay off until the reader says yes; `onConsent()` lets a script wait for it.
- **Display and accessibility panel** (`shades-gradient/preferences`): a 20 px dot in the corner opens it. Readers choose light, dark or the system theme, and can turn on larger text, more contrast, reduced motion, underlined links and easier reading.
  - Choices are saved in the browser only.
  - `preferences-boot.js` applies them before the first paint.
- **Icons:** `contrast` and `accessibility`.
- **Website:** Italian, Turkish, Hindi, Japanese and Traditional Chinese, for eleven languages in all.

## [0.1.0] - 2026-10-11

The first release.

### Added

- **Tokens:** written once, in DTCG `tokens.json`, and built into CSS custom properties, a Tailwind v4 theme and JSON.
  - Shades Red from the logo
  - the ink scale and the four-shade spectrum
  - the Spectra family colours
  - semantic roles for light and dark, with WCAG AA held by a test
  - type, space, radius, shadow and motion
- **Themes:** `data-theme="light"` and `"dark"` pin a theme on any element.
- **Stylesheets:** base, components and motion. Components cover:
  - buttons with a busy state
  - fields, switch and segmented control
  - hashtag tags, badges and the keyboard key
  - disclosure, table and code
  - the spectrum strip, the loader and the animated mark
- **Icons:** 76 interface icons drawn for Shades on a 24 px grid with 2 px round strokes. They come with `renderIcon()`, an SVG sprite and 13 service marks from Simple Icons.
- **Brand files:** the Shades mark and lockup, generated from the shades.md geometry, plus reverse and one-colour versions.
- **Spectra:** the seven characters as SVG, with their idle motions.
- **Magnetic hover:** a magnetic-pull helper for primary actions.
- **Website:** gradient.shades.md, 42 static pages in English, French, Romanian, Russian, Spanish and Chinese, with search metadata, llms.txt, and audits for search, speed, accessibility, links and layout.
