# PageRecast: how it was made

**What it is:** a free, open-source Chrome extension and Figma plugin that turn any web page into editable Figma layers. It also captures pages behind a login, on staging and on localhost.
**Where:** [pagerecast.shades.md](https://pagerecast.shades.md) · [github.com/Shades-Media-Group/PageRecast](https://github.com/Shades-Media-Group/PageRecast) · Chrome Web Store · Figma Community (`@shades_design`) · npm (`pagerecast`, `pagerecast-mcp`)
**When:** built from zero between 10 and 11 October 2026, from v1.0.0 to v1.2.0.

This is the record of how it went: what was asked, what was rejected, what stayed. The next Shades product should start where this one ended.

## The brief

The repository began as an older "Shades Web2Figma" draft in beige, blue and orange. The owner's verdict: "I don't like anything about it". The brief was to delete everything and start again:

- **Scope:** a Chrome extension and a Figma plugin with the full feature set people expect from the leading web-to-Figma tool, plus what the market was still asking for.
- **Product:** version 1.0.0, MIT, public, free forever. No account, no limits, nothing leaves the user's machine.
- **Design:** a new logo, custom icons and new colours, all reviewed with the impeccable skill so nothing reads as AI-made. Dense and purposeful, not "a vibe-coded app".
- **Repository:** it should look like a top-tier GitHub project, with contributing, security, versions, releases and a wiki.
- **Publishing:** a guide to the Chrome Web Store and the Figma Community under the owner's accounts.

## How it went

1. **A plan first.** Every feature of the market leader, plus the gaps users complain about, went into a local `PLAN.md`. When the owner saw a public section comparing against the competitor, he asked for it to be hidden. Competitor analysis now stays out of git entirely.
2. **The logo.** Over twenty directions in four rounds:
   - The 3D and shadowed app-icon renders were rejected outright.
   - He wanted flat marks "like Google products" and pointed at a DesignRush article on the best brand logos.
   - The chosen mark, "Overlap", is two rounded pages with their intersection in ink: red `#F9000A`, rose `#FF8299`, ink `#0A0A0B`.
   - The product needed both a primary logo and a logomark.
3. **The product.** The pieces:
   - **Capture:** the Chrome DevTools Protocol, several widths in one go, light and dark, a page language, pages behind a login.
   - **Import:** a gzip JSON `.recast` format and a Figma plugin that builds frames, text, images and vectors, Auto Layout where it fits, and Light/Dark variables.
   - **Extras added on request:** font install suggestions, per-site import settings, feedback to GitHub issues, a help button, and an MCP bridge and CLI for agents.
4. **The website.** pagerecast.shades.md:
   - **Hosting:** a static Vite build on a Cloudflare Worker.
   - **Signature moment:** a pinned, exploded 3D view of a real page's layers on scroll.
   - **Rest of the page:** a width viewer, a red privacy band, the install row, FAQ and footer.
   - **Reach:** later translated into six languages, then eleven, with JSON-LD, a sitemap, llms.txt and a Google "preferred source" button.
5. **Round after round of "this looks AI-made".** Each correction became a rule; see below.
6. **Shipping.** Every channel went live:
   - Chrome Web Store, under the "Shades Media Group" publisher
   - Figma Community, as `@shades_design`, renamed for search to "PageRecast — Import websites to Figma (HTML, CSS, web to design)"
   - npm and GitHub releases
   - a wiki
   - a "Protect main" ruleset with linear history

## What the owner rejected, in his words

| He said                                   | What it was                                          | The rule it left                            |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| "the mono data text is AI slop"           | Monospace numbers and labels                         | Tabular figures in the body face            |
| "this all is very ai slop"                | The how-to-capture list in bordered cards with icons | Lists on hairlines, icons only with meaning |
| "you are using this kinda a lot too much" | The red privacy block reused                         | One red chapter per page                    |
| "not add this fake site, bring it back"   | A made-up sample website as the demo                 | Show the real thing                         |
| "isn't the panel too long"                | An extension panel that scrolled forever             | Say it once, at the right size              |
| "the CTA buttons aren't pleasing"         | Plain link CTAs                                      | The brand's pill buttons, with an arrow     |
| "button should never have italic"         | Italic button text                                   | Never italic                                |
| "not sans serif… make more normal"        | A quirky display face                                | A normal, professional face                 |
| "no 3D or shadows"                        | Glossy app-icon logo renders                         | Flat 2D marks                               |
| "it feels ai made… maybe it's the grid"   | Equal-card grids for information                     | Vary the structure; real content leads      |

## What stayed

- **The real product on screen.** The live site itself was used as the demo capture, never a mock.
- **Bold full-width chapters:** ink, paper and one red.
- **Pill buttons** with a clear arrow, and the old buttons where he liked them.
- **Store buttons** with the Chrome and Figma marks in rounded tiles.
- **A footer** with columns, languages and a giant wordmark.
- **Credits:** "Free and open source. Built by Shades Media Group" in the product, "Built by Cristian Brinza | Shades Media Group" in the README.

## What it gave Gradient

- **The site grammar:** chapters, the two-column chapter head, pill CTAs and the footer wordmark. The owner liked it and asked for it to be reused.
- **The build:** templates plus language dictionaries, prerendered pages with full search metadata, a Cloudflare Worker with a strict CSP, and a build-time SEO check.
- **The lessons:** the list in [docs/lessons.md](../lessons.md).
- **The habit of checking:** screenshots in both themes and both widths before anything is shown, and impeccable as the review gate.

## Open at the time of writing

- **v1.2.0:** the plugin and the extension, in six languages, waiting on the stores.
- **Translation proxy:** Google's proxy is blocked by the shades.md zone's bot protection, so the extra machine-translated languages are switched off.
