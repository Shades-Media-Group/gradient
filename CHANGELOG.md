# Changelog

Every notable change to Gradient and the `shades-gradient` package. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). See [docs/releasing.md](docs/releasing.md) for what makes a patch, a minor or a major.

## [Unreleased]

## [0.8.0] - 2026-10-16

### Added

- **Shades login** in `auth.css`, for one Shades account (Shades ID) across the products. `g-auth--shades` is the Shades ID page: the brand panel turns Shades red with the white lockup, and the form's one action turns ink. `g-auth-sso` is the "Shades login" link on a product's sign-in, a hairline pill with the red mark, placed under "Forgot password" after a `g-auth-or` divider. `g-auth-text` holds the words of a state screen. The sign-in guide covers the page, the second step, the states (not a Shades address, locked, no role yet) and the link.

## [0.7.2] - 2026-10-13

### Added

- **Email logo for dark mode:** `EmailBrand.logoDark`, a light-text PNG that mail apps in dark mode (Apple Mail, Outlook) show in place of the logo. Shades' own lockup ships one.

## [0.7.1] - 2026-10-13

### Fixed

- **Sign-in looks the same in every app:** `auth.css` is no longer in a cascade layer, so an app's unlayered resets (`h1`, `p`, `:focus-visible`, button shadows) can't shrink the title, move the statement, turn the focus red or bring back the glow.

## [0.7.0] - 2026-10-13

### Changed

- **Breaking:** primary buttons are flat. The red glow moved to an opt-in `g-btn--glow`, for at most one action per marketing page. Add it where a page's main call to action needs it.
- **Sign-in** moved out of `gradient.css` into the opt-in `shades-gradient/auth.css`, like compact mode, and was redrawn as a split screen. The brand panel on the inverse ground has the logo, one line and the Shades credit. The form is one centred column in the system face: a bold title, labels inside the fields (`g-auth-field`), a dark focus outline, one full-width flat button, the spectrum as the busy bar, and the theme choice as plain words. It supports one-screen and stepped flows. `g-auth-card`, `g-auth-head`, `g-auth-lead`, `g-auth-body`, `g-auth-actions` and `g-auth-reveal` are gone; use `g-auth-brand`, `g-auth-main` and `g-auth-form`.

### Added

- `--g-font-system`: the operating system's own face, for sign-in and work tools.
- Interface rules in the design philosophy and the lessons: effects are seasoning, work screens look like the operating system, labels inside fields.

## [0.6.0] - 2026-10-12

### Added

- **Sign-in** (`g-auth`): one sign-in for every Shades app. It is a two-column card: the product's logo, title and lead on the left, the step on the right, and the one action at the bottom right. The card dissolves into the page on phones. Steps run email, then password with an account chip and a show/hide button, then an optional code. A thin bar on the card's top edge shows work in progress. See [docs/guides/sign-in.md](docs/guides/sign-in.md).
- **Compact mode for work tools** (`shades-gradient/compact.css`): a second density for admin panels, CRMs and dashboards, opt-in with `data-density="compact"` and left out of `gradient.css`. 13 px text, 28 px controls, hairlines instead of shadows, black buttons with red kept for the one primary action and alerts. It adds `--gc-*` tokens for light and dark, the shell (`.g-shell`, `.g-rail`, `.g-navpanel`, `.g-nav`), `.g-pagehead`, `.g-card`, a 12-column `.g-layout`, the figures strip (`.g-kpis`, `.g-delta`), `.g-dtable`, `.g-menu`, the `.g-palette` command palette, the three-pane `.g-split` and `.g-attr`, and tightens the existing buttons, inputs, badges and keys inside it. See [docs/guides/compact.md](docs/guides/compact.md).
- **Shades CRM:** the company CRM joins the family on the site, in progress and staff only, with its crm wordmark.

## [0.5.0] - 2026-10-12

### Added

- **Complementary colours:** `color.blue`, `violet`, `pink`, `orange`, `amber` and `green`, each from 50 to 900 and anchored to the brand book's own tints, plus `--g-info` and quiet `--g-*-soft` backgrounds and solid `--g-*-fill` fills (with `--g-on-*-fill` text) for info, success, warning and danger. Nothing existing changed.
- **Tokens:** `color.secondary` (blue, orange, pink, green, amber) and five signature gradients, `gradient.spectrum`, `shade`, `dawn`, `rose` and `ink`, built to `--g-gradient-*`.
- **Spectra:** four expressions as SVG files in `brand/spectra/` (hello, idea, nice, hmm).
- **Brand page:** Spectra's construction and expressions, six brand devices, photographs to use and to avoid, and "Keep Shades, Shades": ten rules in the page's red chapter.
- **Foundations page:** the secondary and complementary colours and the signature gradients.
- **Print page:** speaker, attendee and crew badges, packaging, and the brand-guidelines book, all shot in the studio.
- **Applications page:** the photography direction, eight social posts, stories and reel covers, billboards and banners with street renders, and keynote slides, in every language.
- **SocialMonitor:** the fourth product, listed as in progress with its own Share of voice logo.

### Changed

- **The homepage split** runs on the compositor, locked to the scroll; on phones the row of names becomes a column with their descriptions.

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
