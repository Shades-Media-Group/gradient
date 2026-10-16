# Skills

Every product built on Gradient is designed and built with these installed Claude skills, so each
one starts at the bar the best teams set rather than at the model's average. How the work moves (live first, parallel by default) is in
[How Shades projects are built](workflow.md). The `shades-craft`
skill is always loaded first: it carries Shades' own lessons and the audit. The skills below supply
method, references and checks. **Gradient wins every concrete value:** colour, type, spacing,
radius, logo and voice come from the tokens and the brand, never from a skill's defaults.

## Which skill, when

| Task | Skills |
| --- | --- |
| Direction for a new page, product or screen | `design-taste-frontend`, `high-end-visual-design`, `frontend-design`, `awesome-design-md` (how top teams solve the same screen) |
| Building and refining any UI | `impeccable` (the entry point), `ui-ux-pro-max`, `ux-designer`, `web-design-guidelines`, `better-colors`, `better-ui`, `better-interface`, `baseline-ui` |
| Upgrading something that exists | `redesign-existing-projects`, then `impeccable` |
| A named aesthetic, only when Cristian asks for it | `minimalist-ui`, `industrial-brutalist-ui`, `gpt-taste`, `stitch-design-taste` |
| Apple-level feel, gestures, sheets, springs | `apple-design`, `emil-design-eng`; on iPhone, `ios-design` |
| Motion | `animation-vocabulary` to name it, `transitions-dev` and `gsap-core` / `gsap-scrolltrigger` to build it, `improve-animations` to review it, `fixing-motion-performance` when it stutters |
| Prototypes and design-system extraction | `prototype`, `extract-design-system` |
| Brand boards and identity explorations | `brandkit`, `canvas-design`, `algorithmic-art` |
| Objects in 3D (merchandise, devices, signage) | `img2threejs`, then `threejs-materials`, `threejs-lighting`, `threejs-postprocessing`, shot in Gradient's studio (`scripts/renders/`) |
| Video and motion graphics | `remotion-best-practices` (the router), then `remotion-create`, `-captions`, `-markup`, `-multimedia`, `-maps`, `-interactivity`, `-saas`, `-studio`, `-render`, `-docs`, `-upgrade` |
| Store listings | `app-store-screenshots` |
| A new product end to end | the `replica-*` pack, used on a category, never on one app to copy: `replica-recon` (map the category) → `replica-architect` → `replica-design` (rebuilt on Gradient) → `replica-build` → `replica-backend` → `replica-test` → `replica-diff` → `replica-entrepreneur` (real users' complaints → our edge) → `replica-brand` → `replica-launch` → `replica-deploy` |
| Before calling anything done | `playwright-cli` for screenshots in light and dark at 375 and 1440 px, then one review gate: `impeccable` (critique, audit, detect) or `anti-ui-slop` |

## Guardrails

These override what any skill suggests:

- **Gradient's values only.** A skill's palette, font pairing or shadow is a reference. The product
  uses Gradient's tokens, the Shades logo files and the product's own mark.
- **Learn from others, never copy them.** References set hierarchy, rhythm and density. No other
  company's look, assets, code or copy, and no competitor named in anything public. The `replica-*`
  skills study a category to make something better, never a clone of one app.
- **No AI-generated images ship.** `imagegen-frontend-web` and `imagegen-frontend-mobile` are for
  private moodboards only. What ships is real: photographs, renders from the studio pipeline, or
  `img2threejs` models built in code.
- **One generator, one review gate.** Pick one direction skill, build, then run one review gate.
  Don't stack generators.
- **Effects are seasoning.** Motion explains something, buttons are flat, glow is opt-in
  (see the design philosophy).

## Installing

They live in `~/.claude/skills` or come from plugins, so every Claude Code chat on this Mac has them.
A missing one is installed from skills.sh with `npx -y skills@latest add <owner/repo> -s <name> -g -y -a claude-code`,
after checking its security verdicts. claude.ai chats only get what is uploaded in Customize → Skills.
