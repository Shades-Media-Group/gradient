# Accessibility

Every Shades product targets **WCAG 2.2 AA**, which the European standard EN 301 549 builds on and the European Accessibility Act has required since June 2025. This page is the working version of [gradient.shades.md/accessibility](https://gradient.shades.md/accessibility/): what each product promises, how it is checked, and the gaps that are still open.

## What every product promises

1. **Contrast:** every text role reaches 4.5 : 1 against its background in light and dark. `packages/gradient/src/tokens.test.ts` fails the build otherwise.
2. **Keyboard:** Tab moves, Enter and Space act, Escape closes, and arrow keys move inside groups (segmented controls, tabs, the display panel's theme choice).
3. **Visible focus:** `--g-focus`, a two-pixel accent ring with a gap, is used on every interactive element.
4. **Motion:** everything stops under `prefers-reduced-motion` and under the display panel's "Reduce motion". Scripts check `reducedMotion()` from `shades-gradient/preferences` before animating.
5. **Text that grows:** layouts reflow to 320 px and at 200 % zoom without sideways scrolling.
6. **Language:** every page sets `lang`, so screen readers pronounce it correctly.
7. **Images:** meaningful images have alt text written like a caption; decorative ones have `alt=""` or `aria-hidden`.
8. **Forms:** a visible label on every field, hints and errors wired with `aria-describedby`, and errors that say how to fix them.
9. **Targets:** at least 44 px to hit on touch. The display dot is 20 px to look at and 44 px to hit.
10. **Never colour alone:** states carry a word or an icon as well as a colour.

## The display panel

`shades-gradient/preferences` adds it to any site. It offers:

- a theme: light, dark or automatic
- larger text (zooms the page by 15 % and reflows it)
- more contrast (quiet text and hairlines at full strength)
- reduced motion
- underlined links
- easier reading (WCAG 1.4.12 spacing)

Choices stay in `localStorage`. `preferences-boot.js` applies them before the first paint. System settings always win: the panel adds to them and never overrides them.

## How it is checked

**On every build**, the checks fail CI:

- `tokens.test.ts`: contrast for every role pair, in both themes.
- `scripts/audit-site.mjs`: one h1 per page, no skipped heading levels, a name on every button and link, a label on every field, unique ids, `lang` and hreflang on every page.
- `scripts/audit-layout.mjs`: every page in every language at 375 and 1440 px, with no overflow and no console errors.

**Before every release**, by a person:

1. The whole flow with the keyboard only.
2. VoiceOver on macOS and iOS, NVDA on Windows.
3. 200 % zoom and enlarged text.
4. Reduced motion and both themes, at the system and in the panel.
5. One-handed use on a phone.
6. The copy read aloud.

## Known gaps

| Product            | Open gap                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| gradient.shades.md | No end-to-end screen-reader pass yet. The Spectra illustrations rely on the names printed beside them. |
| PageRecast         | The Figma plugin's densest controls are 28 px. The extension still needs a screen-reader pass.         |
| nails-by-alynna    | Moving through the booking calendar with a screen reader needs a dedicated test.                       |
| lms                | The food and training illustrations need fuller alt text.                                              |
| Shades emails      | Dark-mode colours in Gmail and Outlook depend on the client's own colour inversion.                    |

A gap leaves this table only once it is fixed and checked.

## Report a barrier

Email **support@shades.md** or open an [issue](https://github.com/Shades-Media-Group/gradient/issues/new/choose). Say:

- what you were trying to do
- what got in the way
- which device, browser and assistive technology you used

A person answers within three working days.
