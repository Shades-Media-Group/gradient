# Compact mode

Gradient's default density is made for sites, Figma plugins and extensions: 48 px buttons, pills, room around every block. That is too loose for a work tool. A CRM, an admin panel or a dashboard shows tables, filters, menus and pop-ups on one screen, all day, and the owner's words for it were "very crowded with things … like a pilot dashboard".

Compact mode is the second density. Panes run edge to edge and are split by hairlines. A light icon rail and a light navigation panel sit on the left. The palette is black and white, and red is kept for the one main action and for alerts. Text is 13 px and controls are 28 px tall. It was built first in SocialMonitor and approved there.

## When to use it

| Use compact                                  | Keep the default                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| Admin panels, CRMs, dashboards, inboxes      | Websites, landing pages, docs                                                    |
| Screens people work in for hours             | Screens people read or pass through                                              |
| Many tables, filters and menus on one screen | One task per screen: plugin and extension panels ([tool panels](tool-panels.md)) |

Don't mix the two on one screen. A product can use the default for its website and compact for its app.

## Opt in

```js
import 'shades-gradient/gradient.css'
import 'shades-gradient/compact.css' // after gradient.css; not part of it
```

```html
<html lang="en" data-density="compact"></html>
```

Everything in `compact.css` is scoped to `[data-density='compact']`, so the attribute can also sit on one container. Menus and the command palette are fixed overlays: render them inside the compact element, or put the attribute on `<html>`. Light and dark follow `data-theme` and the system, the same way `tokens.css` does.

The existing components change inside compact: `.g-btn`, `.g-icon-btn`, `.g-segmented`, `.g-input`, `.g-select`, `.g-textarea`, `.g-badge` and `.g-kbd` become smaller and square-cornered. The rest of this page is classes that only exist in compact.

## Tokens

Components read Gradient's roles (`--g-accent`, `--g-danger`, `--g-success-soft` …) and these compact tokens, set for light and dark:

- surfaces: `--gc-bg`, `--gc-rail`, `--gc-panel`, `--gc-card`, `--gc-head` (table header band)
- lines and states: `--gc-line`, `--gc-line-2` (lighter, inside cards), `--gc-hover`, `--gc-active`
- text: `--gc-text`, `--gc-text-2`, `--gc-text-3`, and `--gc-ink` for black buttons and fills
- sizes: `--gc-control` (28 px), `--gc-row` (36 px), `--gc-pad`, `--gc-gap`, `--gc-radius`, `--gc-rail-w`, `--gc-nav-w`
- `--gc-feature` and `--gc-on-feature` for the featured figure, `--gc-scrim` behind the palette

Override them on `[data-density='compact']` to retune a product.

## Anatomy

### Shell

An icon rail for the product's areas, a navigation panel for the current area, and the main column. Under 900 px the panel becomes a drawer: toggle `is-nav-open` on `.g-shell` from a `.g-shell__toggle` button, which only shows at that width.

```html
<div class="g-shell">
  <nav class="g-rail" aria-label="Areas">
    <a class="g-rail__logo" href="/">…logo…</a>
    <a class="g-rail__btn" href="/" aria-current="page" aria-label="Home"><svg>…</svg></a>
    <a class="g-rail__btn" href="/inbox" aria-label="Inbox"><svg>…</svg></a>
    <span class="g-rail__spacer"></span>
    <a class="g-rail__btn" href="/settings" aria-label="Settings"><svg>…</svg></a>
  </nav>
  <aside class="g-navpanel">
    <div class="g-navpanel__head">
      <h2 class="g-navpanel__title">Workspace</h2>
      <button class="g-navpanel__icon" aria-label="Search"><svg>…</svg></button>
    </div>
    <ul class="g-nav">
      <li>
        <a class="g-nav__item" href="/" aria-current="page"><svg>…</svg>Overview</a>
      </li>
      <li>
        <a class="g-nav__item" href="/inbox"
          ><svg>…</svg>Inbox<span class="g-nav__count">4</span></a
        >
      </li>
      <li class="g-nav__group">Views</li>
      <li>
        <a class="g-nav__item" href="/contacts"
          ><svg>…</svg>Contacts<span class="g-nav__num">212</span></a
        >
      </li>
    </ul>
    <div class="g-navpanel__foot">Synced 2 min ago</div>
  </aside>
  <main class="g-main">
    <header class="g-pagehead">
      <button class="g-icon-btn g-shell__toggle" aria-label="Menu"><svg>…</svg></button>
      <h1 class="g-pagehead__title">Overview</h1>
      <span class="g-pagehead__sub">Last 7 days</span>
      <div class="g-pagehead__actions">
        <button class="g-btn g-btn--ghost">Export</button>
        <button class="g-btn g-btn--primary">New contact</button>
      </div>
      <div class="g-pagehead__bar">…filters, a .g-segmented…</div>
    </header>
    <div class="g-page">…</div>
  </main>
</div>
```

`.g-nav__count` is red: something waits for the user. `.g-nav__num` is a plain count. The page head sticks to the top; `__bar` takes its own line under the title.

### Layout and cards

Twelve columns. `.g-span-4` becomes half width under 1280 px and full width under 760 px; `.g-span-8` is full width under 1280 px.

```html
<div class="g-layout">
  <section class="g-card g-span-8">
    <div class="g-card__head">
      <h2>Contacts</h2>
      <a class="g-card__link" href="/contacts">See all</a>
    </div>
    <div class="g-card__flush">…a table…</div>
  </section>
  <section class="g-card g-span-4">
    <div class="g-card__head">
      <h2>Owner</h2>
      <span class="g-card__meta">Updated today</span>
    </div>
    …
  </section>
</div>
```

`.g-card__flush` runs edge to edge inside the card and scrolls sideways when its table is wide.

### Figures strip

One row of key numbers in one hairline box. The first figure is featured with a filled amber background. Don't add icons to the figures.

```html
<dl class="g-kpis">
  <div class="g-kpi">
    <dt>Open</dt>
    <dd class="g-kpi__value">
      <span class="g-num">1,204</span><span class="g-delta is-good">+12%</span>
    </dd>
    <dd class="g-kpi__sub">vs last week</dd>
  </div>
  <div class="g-kpi">…</div>
</dl>
```

`.g-delta` is grey alone, green with `.is-good`, red with `.is-bad`.

### Table

```html
<table class="g-dtable">
  <thead>
    <tr>
      <th>Name</th>
      <th>Status</th>
      <th class="g-dtable__num">Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Contact name</td>
      <td><span class="g-badge g-badge--success">Open</span></td>
      <td class="g-dtable__num">137</td>
    </tr>
  </tbody>
</table>
```

Rows are 36 px with a grey header band and a hover row. `.g-dtable__num` right-aligns a figure column. Badges in compact add `--info` and `--ink` to the default variants.

### Menu

The list is `position: fixed`; the script that opens it sets `top` and `left` from the trigger, so it never clips inside a scrolling pane.

```html
<button
  class="g-menu__trigger g-menu__trigger--icon"
  aria-haspopup="menu"
  aria-expanded="false"
  aria-label="More"
>
  <svg>…</svg>
</button>
<div class="g-menu" role="menu" hidden>
  <button class="g-menu__item" role="menuitem">Edit</button>
  <button class="g-menu__item is-danger" role="menuitem">Delete</button>
</div>
```

Without `--icon`, the trigger is a small outlined button with a label.

### Command palette

Opened with ⌘K. The script moves `aria-selected` with the arrow keys and runs the item on Enter.

```html
<div class="g-palette">
  <div class="g-palette__box" role="dialog" aria-label="Search and jump">
    <label class="g-palette__search">
      <svg>…</svg><input placeholder="Search pages and actions" /><span class="g-kbd">Esc</span>
    </label>
    <ul class="g-palette__list" role="listbox">
      <li class="g-palette__group">Pages</li>
      <li class="g-palette__item" role="option" aria-selected="true">
        <svg>…</svg><span>Contacts</span><small>Go to</small>
      </li>
    </ul>
  </div>
</div>
```

`.g-palette__empty` holds the line shown when nothing matches.

### Split view

A list, the selected item and its details, edge to edge under the page head. Each pane scrolls on its own. The details pane hides under 1280 px; under 1000 px the list and the item stack.

```html
<main class="g-main">
  <header class="g-pagehead">…</header>
  <div class="g-split">
    <ul class="g-split__list">
      <li class="g-split__row" tabindex="0" aria-selected="true">…</li>
    </ul>
    <article class="g-split__detail">…</article>
    <aside class="g-split__details">
      <p class="g-attr__title">Contact</p>
      <dl class="g-attr">
        <dt>Email</dt>
        <dd>name@example.com</dd>
        <dt>Status</dt>
        <dd><span class="g-badge g-badge--success">Open</span></dd>
      </dl>
    </aside>
  </div>
</main>
```

### Attributes

`.g-attr` is a `dl` of label and value rows, 96 px labels. `.g-attr__title` names a group of them. Use it in details panes and side cards.

## Rules that differ in compact mode

Compact keeps the [lessons](../lessons.md) except for these:

- **Tracked capitals, in two places.** Uppercase, tracked group labels are allowed in navigation (`.g-nav__group`, `.g-palette__group`) and attribute panels (`.g-attr__title`). Nowhere else: never above a heading.
- **Icons on navigation rows.** Rail buttons, navigation items and palette items carry an icon. Table rows, cards and figures don't.
- **Hairlines, no shadows.** Cards, figures and panes are separated by 1 px lines. Only floating things cast a shadow: menus, the palette, the drawer.
- **Black for actions, red for the one.** Buttons are black by default and outlined with `g-btn--ghost`. Red is for the one primary action on the screen, alerts (`.g-nav__count`, `.is-danger`, `.is-bad`) and nothing else.
- **13 px text, 28 px controls.** 12.5 px inside controls and tables, 11 to 12 px for meta, 16 px for the page title, 22 px for figures.
