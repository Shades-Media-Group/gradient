# Adding an icon

The Shades icon set is drawn by hand, one SVG per icon, in `packages/gradient/icons/`.

## The rules

1. **Grid:** 24 × 24 with 2 px of padding. The drawing stays between 2 and 22.
2. **Strokes:** 2 px, with round caps and round joins. Use a fill only for dots of 1 to 1.6 px radius.
3. **Corners:** 2 px on rectangles. No sharp boxes, no hairlines.
4. **Colour:** `currentColor` only. Never a fixed colour inside the file.
5. **Meaning:** if the label alone is clear, leave the icon out. Check the lessons before adding decoration.

## The file

Name it in kebab case after what it means here, not what it looks like: `calendar-add.svg`, not `calendar-plus-outline.svg`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/>
</svg>
```

## Then

```bash
yarn --cwd packages/gradient icons   # writes src/icons.ts
yarn test                            # checks the rules above
yarn dev:site                        # see it on /icons/ next to the others
```

Look at it beside its neighbours at 20 and 24 px: same weight, same optical size, same corner language. If it reads heavier or lighter, redraw it rather than nudging the stroke width.

Marks of other services (GitHub, Figma…) are not drawn. Add them to the `BRANDS` list in `scripts/icons.mjs`, from Simple Icons.
