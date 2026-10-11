# Security

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

Fixes land in the latest minor release. Older versions are not patched.

## Reporting a vulnerability

Please do not open a public issue. Instead:

- open a [private security advisory](https://github.com/Shades-Media-Group/gradient/security/advisories/new), or
- email **security@shades.md**.

Include what you found, where (the npm package, the website, or a workflow), and the steps to reproduce it. You will get an answer within three working days. Once a fix ships, the advisory credits you unless you would rather stay anonymous.

## What Gradient does to stay safe

- **The package runs nothing on install.** It has no `postinstall` script and no runtime dependencies. Its JavaScript is `renderIcon`, which escapes the titles it is given, and an opt-in magnetic-hover helper.
- **The website is static.** It is served by a Cloudflare Worker with no server code, under a strict Content Security Policy:
  - scripts, styles, fonts and connections come from its own origin only
  - no page can be framed
  - no third-party script, font or analytics is loaded
- **The build is checked.** CI runs typecheck, lint, tests and the site audit on every push. Dependabot keeps dependencies current, and the release workflow publishes only from a tag that matches the version.
