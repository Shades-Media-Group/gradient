# Releasing

## One version

`packages/gradient/package.json` carries the version of the system. The root and the site share it. `yarn release` keeps them all in step.

## Which number changes

- **Patch, `0.1.x`:** a fix that changes no class, token or icon name. Includes a contrast fix, a broken state or a typo on the site.
- **Minor, `0.x.0`:** something new that breaks nothing. A token, component, icon, page or language.
- **Major, `x.0.0`:** anything renamed or removed. A token, class, icon name or export. Say in the changelog how to move.

Before 1.0.0, minor versions may still rename things. Each such change is marked **Breaking** in the changelog.

## Cutting a release

```bash
yarn verify
yarn release minor          # bumps every package.json, writes CHANGELOG.md, commits and tags
git push --follow-tags      # the tag runs .github/workflows/release.yml
```

The workflow:

1. Verifies again.
2. Checks the tag matches the version.
3. Packs the npm tarball.
4. Publishes a GitHub release with the changelog entry.

## Publishing to npm

The account is `shades.media.group`, with two-factor sign-in. Publish from a terminal so the browser can confirm the one-time code:

```bash
cd packages/gradient
npm publish --access public
```

`prepublishOnly` builds `dist/` first. Check the result with `npm view shades-gradient version`.

## Deploying the site

```bash
yarn deploy:site
```

This builds, runs the site audit and deploys with wrangler. The Worker is `gradient-site`, on the custom domain `gradient.shades.md`.
