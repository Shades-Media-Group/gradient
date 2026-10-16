# Design philosophy

Why Gradient looked "made by AI" even when it was clean, what senior teams do instead, and the rules every Shades page now follows. Read with [lessons.md](lessons.md): that file lists what the owner rejected; this one says what to do.

## The problem, named

A page reads as generated when it is the average of everything else. Anthropic calls it "distributional convergence": with no direction, a model drifts to the safest, most common choice ([Anthropic](https://claude.com/resources/articles/improving-frontend-design-through-skills)). Gradient had three of the common tells:

1. **The stock skeleton.** A centred hero with two buttons, a three-column row, then the same chapter (heading left, lead right) stamped ten times ([codemyspec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same), [Krebs](https://www.adriankrebs.ch/blog/design-slop/)).
2. **Graphics built from primitives.** Code-drawn art is shapes and coordinates: fine for icons and diagrams, childish for objects, material and scenes ([Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/06/claude-image-generation/), [Willison](https://simonwillison.net/2024/Oct/25/pelicans-on-a-bicycle/)). A tote drawn from two rectangles is the giveaway.
3. **Filler.** Facts that repeat the paragraph above, notes nobody needs, copy that says "how we look, speak and build" instead of what the thing is.

## What senior teams do

- **Care you can feel, including where nobody looks.** Apple's "finishing the back of the drawer" ([MacTrast](https://www.mactrast.com/2012/05/jony-ive-apples-most-important-design-is-what-were-working-on-right-now/amp/)); a team that is "bitterly critical of our work" ([Macworld](https://www.macworld.com/article/671046/jony-ive-on-design-apple-copycats-future-tech.html)).
- **Taste over consensus.** "More taste. Less consensus." ([Alan Dye, Cultured](https://www.culturedmag.com/?p=83298)).
- **Expressive, never at the cost of clarity.** Google's Material 3 Expressive came from 46 studies; bold shape, colour and size made key actions up to four times faster to find ([Google Design](https://design.google/library/expressive-material-design-google-research)).
- **One camera, one light, every image.** Tinkoff's 3D system keeps the same angle and lighting on every picture ([Workspace](https://workspace.ru/cases/3d-illyustracii-dlya-ekosistemy-tinkoff/)); a set lit differently looks "like five different shops" ([Creatsy](https://creatsy.com/blog/1924095317-stationery-mockup-guide-how-to-present-envelopes-notebooks-stickers-desk-sets)).
- **No sterile shots.** MTS asks for unusual angles and both a warm and a cool accent in every frame ([ONY](https://en.ony.ru/work/mts)).
- **Test the identity on real surfaces**, from a phone screen to a courier's bag ([Yandex, AdIndex](https://adindex.ru/news/design/2021/03/31/292419.phtml)).
- **No gap between design and build.** "There should be no discrepancies" ([T-Bank, Habr](https://habr.com/en/companies/tbank/articles/339660)).
- **Build the graphics as a pipeline.** Apple renders products in CGI made to be reused ([Renderspeed](https://www.renderspeed.com/apple-ipad.html)); Stripe draws its illustrations in code, driven by its tokens ([Stripe](https://stripe.com/blog/connect-front-end-experience)). AI, where brands use it, sits in production (resizing, localising), not in the hero art ([Adobe](https://news.adobe.com/news/news-details/2024/adobe-introduces-firefly-services-and-custom-models-to-accelerate-enterprise-content-creation-and-production)).

## The rules

### Graphics

1. **Real objects are photographed, never drawn.** Business cards, badges, bags, tees and stickers come from `yarn renders`: the real print files, shot in a code-built studio (`scripts/renders/`). Flat drawings are only for diagrams, specimens and print files.
2. **One light for the whole set.** Late sun from the left through a window, the same direction in every frame. Backgrounds rotate between ink and paper; one frame per page may be red.
3. **Apply the brand with confidence.** The mark oversized and cropped by the edge, or tiny and deliberate. Never small and centred on a blank object.
4. **Weight, slack, texture.** Cloth hangs and folds, card bows, ink sits in the weave. Perfect and weightless reads as a template.
5. **Fewer, stronger frames.** If a shot fails the audit below, it is cut, not shipped.

### Layout

6. **Vary the device.** A chapter grammar is a vocabulary, not a stamp. No two consecutive chapters share the same layout.
7. **Every block earns its place.** If it repeats what is already on screen, delete it.
8. **Real content at full size.** Components, type and colour shown working, as Carbon and GOV.UK do, instead of pictures of them.

### Copy

9. **Say what it is, in the reader's words.** One idea per sentence, 20 words at most, concrete nouns. "The brand and the code behind every Shades product," not "how Shades looks, speaks and builds".
10. **Cut, then cut again.** Leads are one or two sentences. Notes appear only when they change what someone does.
11. **No filler devices:** no "seamless", "elevate", "empower", "unlock"; no rule of three for rhythm; no rhetorical questions.

### Mobile first

12. **Design the phone, not a shrunken desktop.** Most visitors are on a phone: decide per breakpoint what to add, remove or reshape.
13. **Thumb reach.** Primary actions are full-width and low on the screen; nothing important hides behind a banner.
14. **Swipe, don't stack.** Sets of related items (merchandise, products) become a horizontal row to swipe on a phone, with the next item peeking.

### Interface

15. **Effects are seasoning.** The red glow under a button (`g-btn--glow`) is for the single most important action on a marketing page, and most pages don't need it. Forms, dialogs, panels, tools and sign-in use flat buttons. A glow, a shadow or a gradient on every button is what makes an interface read as generated.
16. **Work screens look like the operating system.** Sign-in and tools set type in the system face (`--g-font-system`: SF Pro, Segoe UI, Roboto) with neutral near-black text, the way large account pages do. The brand faces carry the wordmark and marketing pages. Grey text on a cream ground in a fashionable grotesk is the look of a template.
17. **Labels inside fields, focus in the text colour.** A field's label sits in its box and moves up when it is used. Focus is a dark outline: red on a field reads as an error.
18. **A border only where the fill disappears.** A button whose fill differs from what sits under it (the red primary, the ink inverse) has no outline. Only a button whose fill is transparent or matches its ground gets a hairline, so its edge still shows.

### Method

19. **Build with the best tools, keep our values.** Every Shades product is designed and built with the skills in [Skills](guides/skills.md): taste and direction skills before designing, `impeccable` while building, motion, 3D and video skills where they fit, `playwright-cli` and a review gate before it ships. They supply method and references; Gradient supplies every value.
20. **Live first, parallel by default.** Server apps are built by their "[Server]" chat straight in the production checkout and made live at once with `live.sh`, then committed and pushed at the end of every prompt. Independent parts of a request run at the same time as background agents. See [How Shades projects are built](guides/workflow.md).

## The audit, before anything ships

Run it on every render, chapter and page, and write the flaws down before deciding.

| Student                                  | Professional                                                     |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Small logo centred on a blank object     | Mark oversized and cropped, or tiny and deliberate               |
| Dead-on, symmetric front view            | Off-axis, long lens, one asymmetric crop                         |
| Even soft light everywhere               | One hard key light, real cast shadows, the same side every frame |
| Generic beige or grey object             | The object is a brand colour: ink, red or paper                  |
| Perfect and weightless                   | Weight, creases, slack, texture                                  |
| Every item lit and framed differently    | One system across the set                                        |
| The same section layout repeated         | A different device for each chapter                              |
| Copy that describes the brand's feelings | Copy that says what the thing is and does                        |
| A desktop page squeezed onto a phone     | A phone layout designed for the thumb                            |

Then the mechanical checks: `yarn audit:layout`, light and dark at phone and desktop widths, and `impeccable detect`.
