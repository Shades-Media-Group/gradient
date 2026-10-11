# ImageReframe: the brief

**Status:** planned. This is the starting brief, kept here so the project begins from Gradient and from what PageRecast taught.

## What it is

A free, open-source Figma plugin under the Shades brand for exporting images from Figma and importing them into it. It starts from what the most-used image-compression plugin already does, then adds what that plugin lacks:

- **Export:** layers, frames and selections.
- **Formats:** WebP, JPG and PNG, with compression and the result visible before saving.

## The product rules, inherited

- **Free forever.** No account, no limits, no upgrade prompts.
- **Local.** Images are processed on the user's machine. Nothing is uploaded.
- **Never name the product it starts from** in anything public. Describe ImageReframe on its own merits.
- **Credits:** "Free and open source. Built by Shades Media Group" in the product. "Built by Cristian Brinza | Shades Media Group" in the README.
- **Fast:** the plugin UI opens instantly and stays responsive while it encodes. Encoding runs off the main thread.

## Before any screen

1. Write `PRODUCT.md` (see [Start a new project](../guides/start-a-project.md)).
2. List every feature of the existing plugins and the requests users leave in their reviews. Keep that list local and out of git.
3. Decide the mark. Like PageRecast, ImageReframe can have its own flat logomark. Its type, roles, icons and rules come from Gradient.
4. Read [docs/lessons.md](../lessons.md).

## What Gradient gives it

- **The Figma panel UI:** `shades-gradient` tokens and components, with the panel density PageRecast's plugin uses (32 px rows, 11–13 px text, one red primary action).
- **Icons:** the Shades icon set. Add `crop`, `aspectRatio`, `image`, `download` and new ones as needed, drawn to the rules.
- **The website:** the same site build as gradient.shades.md and pagerecast.shades.md, in the same eleven languages, at imagereframe.shades.md.

## Features to plan

- **Formats and quality:** WebP, AVIF, JPG and PNG with quality, a size preview and a before/after comparison.
- **Scale:** 0.5×, 1×, 2×, 3× and custom widths, several at once.
- **Batches:** every selected frame, with a file-naming pattern.
- **Import:** drop images into Figma, already compressed, replacing image fills in place.
- **Presets per file:** remembered with `clientStorage`.
- **Languages:** the same six as the rest of Shades.
