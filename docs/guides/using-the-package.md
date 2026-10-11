# Using the package

`shades-gradient` is framework-free: CSS custom properties, CSS classes, SVG strings. Below is how each kind of Shades project uses it.

## React 19 + Tailwind v4 (nails-by-alynna, lms)

```css
/* src/styles/index.css */
@import 'tailwindcss';
@import 'shades-gradient/theme.css';
@import 'shades-gradient/components.css';
@import 'shades-gradient/motion.css';
```

- **Utilities:** the theme maps every token to Tailwind utilities, `bg-accent`, `text-text-2`, `border-line`, `rounded-pill`, `shadow-md`, `ease-move`. They follow light and dark on their own.
- **Components:** keep your own React components and point their classes at the roles, or render the Gradient classes directly:

```tsx
export function Button({ variant = 'primary', ...props }: ButtonProps) {
  return <button className={`g-btn g-btn--${variant}`} {...props} />
}
```

Icons, as a React component, without a library:

```tsx
import { renderIcon, type IconName } from 'shades-gradient'

export function Icon({
  name,
  size = 20,
  label,
}: {
  name: IconName
  size?: number
  label?: string
}) {
  return (
    <span
      className="inline-flex"
      // renderIcon escapes the label and draws from the package's own paths.
      dangerouslySetInnerHTML={{ __html: renderIcon(name, size, label) }}
    />
  )
}
```

## A client brand

A client keeps the components and changes the roles. In one stylesheet loaded after Gradient:

```css
:root {
  --g-accent: #d4115f; /* the client's primary */
  --g-accent-hover: #b80e52;
  --g-accent-press: #9c0b45;
  --g-accent-text: #b80e52; /* must reach 4.5:1 on --g-bg */
  --g-accent-soft: #fde7fc;
  --g-bg: #fdf6fd;
  --g-font-display: 'Onest Variable', system-ui, sans-serif;
  --g-font-body: 'Onest Variable', system-ui, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --g-accent-text: #ff7aa8;
  }
}
```

Check every text role you change against its background at 4.5:1. Gradient's own test (`packages/gradient/src/tokens.test.ts`) shows how. The Shades mark and the Spectra characters are never part of a client's product.

## Preact and the Figma plugin panels (PageRecast, ImageReframe)

The same CSS works. Panels are denser than web pages, so scale the components with the custom properties they expose:

```css
.panel .g-btn {
  --g-btn-h: 28px;
  --g-btn-px: 10px;
  font-size: 12px;
}
```

Figma plugin UIs are single-file builds. Import the CSS in the entry and let `vite-plugin-singlefile` inline it.

## Plain HTML and static sites

```html
<link rel="stylesheet" href="/node_modules/shades-gradient/dist/gradient.css" />
<svg width="24" height="24"><use href="/icons.svg#g-arrow-right" /></svg>
```

Copy `dist/icons.svg` next to the page for the sprite. The Gradient website itself is built this way: [`apps/site`](../../apps/site).

## Light and dark

Themes follow the system. To pin one on any element, use `data-theme`:

```html
<html data-theme="dark">
  …
  <section data-theme="light">a light panel inside a dark page</section>
</html>
```
