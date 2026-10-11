# Start a new Shades project

The same five steps every time, so each product starts where the last one finished.

## 1. Write the product record

Create `PRODUCT.md` at the repository root before any code. Use the sections in Gradient's own [PRODUCT.md](../../PRODUCT.md):

- **Users:** who it is for, in what situation, doing what job.
- **Product purpose:** what it does and what success means.
- **Positioning:** what a neighbouring product could not truthfully claim.
- **Capabilities and constraints:** what it must never do, such as charge, track or upload.
- **Brand commitments:** its own mark or the Shades one, credits, voice.
- **Evidence on hand:** real content you have, and what must not be invented.

Add a `CLAUDE.md` with the commands, the non-negotiables and a link to Gradient's [lessons](../lessons.md). Agents read it first.

## 2. Set up the repository like the others

- **Workspace:** Yarn 1, Node 22 (`.nvmrc`), TypeScript, ESLint, Prettier, Vitest.
- **Licence and docs:** MIT `LICENSE`, plus `README`, `CONTRIBUTING`, `SECURITY`, `CODE_OF_CONDUCT`, `SUPPORT`, `CHANGELOG`.
- **GitHub:** CI on every push, Dependabot, issue forms, a pull-request template.
- **Git exclusions:** `graphify-out/`, `.idea/` and any competitor research go in `.gitignore` or `.git/info/exclude`, never in a commit.
- **History:** conventional commits from the first one, with no AI attribution.

## 3. Install Gradient

```bash
yarn add shades-gradient
```

See [Using the package](using-the-package.md) for React with Tailwind, Preact and plain HTML. A client project re-themes the roles; a Shades product keeps them.

## 4. Decide the mark

Either:

- **wear the Shades mark** (internal tools, Shades services), or
- **give the product its own flat logomark**, as PageRecast did, and credit "Built by Shades Media Group".

Either way, the logo files are generated from one geometry by a script, never drawn twice.

## 5. Build, check, ship

- **The website:** copy `apps/site` from Gradient. You get templates, six dictionaries, `pages.ts`, the audits, `wrangler.jsonc` with a `<name>.shades.md` custom domain, and the CSP in `public/_headers`.
- **Before calling anything done:**
  - `yarn verify`
  - the site audit and the layout audit
  - screenshots in light and dark at phone and desktop widths
  - impeccable as the design review
- **Deploy:** `yarn deploy:site`. The first deploy creates the custom domain on the shades.md zone.
- **Release:** `yarn release <patch|minor|major>`, then `git push --follow-tags`.

Afterwards, add the project to `docs/projects/` in Gradient: what was asked, what was rejected, what stayed.
