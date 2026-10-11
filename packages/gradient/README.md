# shades-gradient

The design system of [Shades Media Group](https://shades.md) as one package. It holds:

- design tokens, built as CSS custom properties, a Tailwind v4 theme and DTCG JSON
- framework-free component classes and motion
- the Shades icon set
- the brand SVGs

Documentation and live examples: **[gradient.shades.md](https://gradient.shades.md)**.

```bash
npm i shades-gradient
```

## Use it

### Everything, in any project

```js
import 'shades-gradient/gradient.css'
```

`gradient.css` is `tokens.css`, `base.css`, `components.css` and `motion.css` in one file (about 6 KB compressed). Import the parts on their own if you only want some of them.

Fonts are not bundled. Load Space Grotesk and Hanken Grotesk, plus Inter for Cyrillic, or override `--g-font-display` and `--g-font-body`:

```js
import '@fontsource-variable/space-grotesk/wght.css'
import '@fontsource-variable/hanken-grotesk/wght.css'
```

### Tailwind v4

```css
@import 'tailwindcss';
@import 'shades-gradient/theme.css';
```

Every token becomes a utility that follows light and dark: `bg-accent`, `text-on-accent`, `text-text-2`, `border-line`, `rounded-pill`, `font-display`, `text-display`, `shadow-md`, `ease-move`, `bg-red-500`, `bg-ink-950`.

### Components

```html
<button class="g-btn g-btn--primary">Send the brief</button>
<button class="g-btn">Secondary</button>
<button class="g-btn g-btn--primary" aria-busy="true">
  Save <span class="g-loader" aria-hidden="true"><i></i><i></i><i></i></span>
</button>

<div class="g-field">
  <label class="g-label" for="email">Work email</label>
  <input class="g-input" id="email" type="email" />
</div>

<span class="g-tag">Branding</span>
<span class="g-badge g-badge--success">Shipped</span>
<hr class="g-spectrum" />
```

The components page lists every class and state: [gradient.shades.md/components](https://gradient.shades.md/components/).

### Icons

```js
import { renderIcon, icons, brandIcons } from 'shades-gradient'

button.innerHTML = renderIcon('arrowRight', 20) // hidden from assistive technology
link.innerHTML = renderIcon('github', 20, 'GitHub') // labelled
```

For plain HTML, copy `shades-gradient/icons.svg` next to your page:

```html
<svg width="24" height="24"><use href="/icons.svg#g-arrow-right" /></svg>
```

The source SVGs are under `shades-gradient/icons/*`.

### Brand files

```js
import { logo, family } from 'shades-gradient'

header.innerHTML = logo.lockup // also mark, markMono, lockupReverse, lockupMono
hero.innerHTML = family.sage // spectra, mera, sol, nova, sage, vio, sunny
```

The files themselves are under `shades-gradient/brand/*`. They are trademarks of Shades Media Group, not MIT: read [TRADEMARKS.md](https://github.com/Shades-Media-Group/gradient/blob/main/TRADEMARKS.md) before using them.

### Display and accessibility panel

A 20 px dot in the bottom-right corner opens a panel. It offers light, dark or the system theme, plus larger text, more contrast, reduced motion, underlined links and easier reading. Choices stay in the reader's browser. A one-time notice says so, because the page sets no cookies.

```html
<!-- In <head>, before the stylesheets: applies the choices before the first paint -->
<script src="/preferences-boot.js"></script>
```

Copy `shades-gradient/preferences-boot.js` next to your pages. Then:

```js
import 'shades-gradient/preferences.css' // already inside gradient.css
import { preferences, reducedMotion } from 'shades-gradient/preferences'

preferences({ labels: { open: 'Display and accessibility' /* … in the page's language */ } })
if (!reducedMotion()) startTheAnimation()
```

The panel works on sites that don't use the rest of Gradient: its colours fall back to the Shades ink and paper. The switches set attributes on `<html>`:

- `data-theme` for light or dark
- `data-g-text`, `data-g-contrast`, `data-g-motion`, `data-g-links` and `data-g-reading` for the other options

A site's own styles can respond to them too.

### Magnetic hover

```js
import { magnetic } from 'shades-gradient/magnetic'

const stop = magnetic('[data-magnetic]')
```

### Tokens as data

```js
import tokens from 'shades-gradient/tokens.json' with { type: 'json' }
```

## Themes

Light and dark follow the system setting. To pin either one on any element, use `data-theme`:

```html
<section data-theme="dark">…</section>
```

A client brand re-themes the whole set by overriding the role tokens:

```css
:root {
  --g-accent: #d4115f;
  --g-accent-hover: #b80e52;
  --g-accent-press: #9c0b45;
  --g-bg: #fdf6fd;
  --g-font-body: 'Onest Variable', system-ui, sans-serif;
}
```

## Licence

The code and the interface icons are [MIT](LICENSE). The Shades name, mark, lockup and Spectra characters are trademarks of Shades Media Group.

Built by Shades Media Group.
