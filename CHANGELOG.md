# Changelog

Every notable change to Gradient and the `shades-gradient` package. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). See [docs/releasing.md](docs/releasing.md) for what makes a patch, a minor or a major.

## [Unreleased]

### Added

- **Display and accessibility panel** (`shades-gradient/preferences`): a 20 px dot in the corner opens it. Readers choose light, dark or the system theme, and can turn on larger text, more contrast, reduced motion, underlined links and easier reading.
  - Choices are saved in the browser only.
  - `preferences-boot.js` applies them before the first paint.
  - A one-time notice says the site sets no cookies.
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
