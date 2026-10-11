# ImageRefold: the brief

**Status:** live at [imagerefold.shades.md](https://imagerefold.shades.md) ([repository](https://github.com/Shades-Media-Group/ImageRefold)). Its mark is "Scale": three rounded squares sharing a corner, in PageRecast's red, rose and ink. This is the starting brief, kept as the record of how the project began.

## What it is

A free, open-source Figma plugin under the Shades brand for exporting images from Figma and importing them into it. It starts from what the most-used image-compression plugin already does, then adds what that plugin lacks:

- **Export:** layers, frames and selections.
- **Formats:** WebP, JPG and PNG, with compression and the result visible before saving.

## The product rules, inherited

- **Free forever.** No account, no limits, no upgrade prompts.
- **Local.** Images are processed on the user's machine. Nothing is uploaded.
- **Never name the product it starts from** in anything public. Describe ImageRefold on its own merits.
- **Credits:** "Free and open source. Built by Shades Media Group" in the product. "Built by Cristian Brinza | Shades Media Group" in the README.
- **Fast:** the plugin UI opens instantly and stays responsive while it encodes. Encoding runs off the main thread.

## Before any screen

1. Write `PRODUCT.md` (see [Start a new project](../guides/start-a-project.md)).
2. List every feature of the existing plugins and the requests users leave in their reviews. Keep that list local and out of git.
3. Decide the mark. Like PageRecast, ImageRefold can have its own flat logomark. Its type, roles, icons and rules come from Gradient.
4. Read [docs/lessons.md](../lessons.md).

## What Gradient gives it

- **The Figma panel UI:** `shades-gradient` tokens and components, with the panel density PageRecast's plugin uses (32 px rows, 11–13 px text, one red primary action).
- **Icons:** the Shades icon set. Add `crop`, `aspectRatio`, `image`, `download` and new ones as needed, drawn to the rules.
- **The website:** the same site build as gradient.shades.md and pagerecast.shades.md, in the same eleven languages, at imagerefold.shades.md.

## Features to plan

- **Formats and quality:** WebP, AVIF, JPG and PNG with quality, a size preview and a before/after comparison.
- **Scale:** 0.5×, 1×, 2×, 3× and custom widths, several at once.
- **Batches:** every selected frame, with a file-naming pattern.
- **Import:** drop images into Figma, already compressed, replacing image fills in place.
- **Presets per file:** remembered with `clientStorage`.
- **Languages:** the same six as the rest of Shades.

## The panel redesign

The first Figma panel was rejected as AI slop: "very complicated, hard to tell the setting blocks apart, a lot of font sizes, the grid looks AI". The owner was asked what felt wrong before anything changed, and the old panel was tagged `plugin-ui-v1` first.

The approved panel (ImageRefold commits `586839b`, `1214228`, `8237ac3`):

- one calm screen per tab: the real file on a stage, one result figure, labelled rows, one red action in the dock
- three type sizes (11, 12, 20 px) and two weights
- rare options behind a gear, ending with Reset all preferences
- light whatever Figma's theme, with Dark and Automatic as choices
- every setting remembered, older saved settings migrated

It was built in a browser harness, then tested in Figma desktop with real selections and huge frames. The layout is now the rule for every Shades panel: [Tool panels](../guides/tool-panels.md). The rejected patterns are lessons 25 to 29 in [lessons.md](../lessons.md).
