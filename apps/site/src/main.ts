import '@fontsource-variable/space-grotesk/wght.css'
import '@fontsource-variable/hanken-grotesk/wght.css'
import '@fontsource-variable/inter/wght.css'
import 'shades-gradient/gradient.css'
import { magnetic } from 'shades-gradient/magnetic'
import type { ConsentLabels } from 'shades-gradient/consent'
import { preferences, reducedMotion, type PreferenceLabels } from 'shades-gradient/preferences'
import './site.css'

type Strings = {
  copied: string
  iconCopied: string
  prefs: PreferenceLabels
  consent: ConsentLabels
}
const strings = JSON.parse(document.getElementById('strings')?.textContent ?? '{}') as Strings
const fill = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) => [
  ...root.querySelectorAll<T>(selector),
]

document.documentElement.classList.add('js')

/** One live region for every "copied" message. */
const announcer = Object.assign(document.createElement('p'), { className: 'toast' })
announcer.setAttribute('role', 'status')
document.body.append(announcer)
let toastTimer = 0
function toast(message: string) {
  announcer.textContent = message
  announcer.dataset.show = ''
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => delete announcer.dataset.show, 1800)
}

async function copy(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast(message)
  } catch {
    toast(text)
  }
}

// Copy buttons: the install command in the hero.
for (const button of $$<HTMLButtonElement>('[data-copy]'))
  button.addEventListener('click', () =>
    copy(button.dataset.copy!, fill(strings.copied, { token: button.dataset.copy! })),
  )

// Sections rise in as they arrive; without script they are simply there.
const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries)
      if (entry.isIntersecting) {
        entry.target.setAttribute('data-shown', '')
        reveal.unobserve(entry.target)
      }
  },
  { rootMargin: '0px 0px -10% 0px' },
)
for (const el of $$('[data-reveal]')) reveal.observe(el)

// The split: the mark's three bars slide out of the square and become the
// three layers of the system. Progress is 0 at the top of the section and 1
// once it has scrolled its own extra height; reduced motion shows the end.
const split = document.querySelector<HTMLElement>('[data-split]')
if (split) {
  let frame = 0
  const narrow = matchMedia('(max-width: 860px)')
  const update = () => {
    frame = 0
    const rect = split.getBoundingClientRect()
    const travel = Math.max(1, split.offsetHeight - innerHeight)
    const t = reducedMotion() || narrow.matches ? 1 : Math.min(1, Math.max(0, -rect.top / travel))
    split.style.setProperty('--t', t.toFixed(4))
    split.toggleAttribute('data-done', t > 0.82)
  }
  const schedule = () => (frame ||= requestAnimationFrame(update))
  addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', schedule)
  document.addEventListener('shades:preferences', schedule)
  update()
}

// Radio-like segmented controls.
for (const group of $$('[data-segmented], [data-theme-preview], [data-email-switch]')) {
  const options = $$<HTMLButtonElement>('[role="radio"]', group)
  const choose = (chosen: HTMLButtonElement, focus = false) => {
    for (const option of options) {
      option.setAttribute('aria-checked', String(option === chosen))
      option.tabIndex = option === chosen ? 0 : -1
    }
    if (focus) chosen.focus()
    group.dispatchEvent(new CustomEvent('choose', { detail: chosen.dataset.value }))
  }
  options.forEach((option, i) => {
    option.tabIndex = option.getAttribute('aria-checked') === 'true' ? 0 : -1
    option.addEventListener('click', () => choose(option))
    option.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
      if (!step) return
      event.preventDefault()
      choose(options[(i + step + options.length) % options.length]!, true)
    })
  })
}

// Tabs demo on the components page: arrow keys move, the selected tab is marked.
for (const list of $$('[data-tabs]')) {
  const tabs = $$<HTMLButtonElement>('[role="tab"]', list)
  const select = (tab: HTMLButtonElement, focus = false) => {
    for (const t of tabs) {
      t.setAttribute('aria-selected', String(t === tab))
      t.tabIndex = t === tab ? 0 : -1
    }
    if (focus) tab.focus()
  }
  tabs.forEach((tab, i) => {
    tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1
    tab.addEventListener('click', () => select(tab))
    tab.addEventListener('keydown', (event) => {
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key]
      if (next === undefined) return
      event.preventDefault()
      select(tabs[(next + tabs.length) % tabs.length]!, true)
    })
  })
}

// The email page: one preview at a time.
const emailSwitch = document.querySelector('[data-email-switch]')
emailSwitch?.addEventListener('choose', (event) => {
  for (const frame of $$<HTMLIFrameElement>('[data-email]'))
    frame.hidden = frame.dataset.email !== (event as CustomEvent<string>).detail
})

// Theme preview on the foundations page.
const preview = document.querySelector('[data-theme-preview]')
const roles = document.querySelector<HTMLElement>('[data-roles]')
preview?.addEventListener('choose', (event) => {
  if (roles) roles.dataset.theme = (event as CustomEvent<string>).detail
})

// Swatches: show each colour's hex from the live tokens; a click copies the variable.
const styles = getComputedStyle(document.documentElement)
for (const swatch of $$<HTMLLIElement>('[data-token]')) {
  const token = swatch.dataset.token!
  const value = styles.getPropertyValue(token).trim()
  swatch.innerHTML = `<button type="button"><b>${token.replace('--g-', '')}</b><span>${value.toUpperCase()}</span></button>`
  swatch
    .querySelector('button')!
    .addEventListener('click', () =>
      copy(`var(${token})`, fill(strings.copied, { token: `var(${token})` })),
    )
}

// The busy demo on the components page.
for (const button of $$<HTMLButtonElement>('[data-busy-demo]'))
  button.addEventListener('click', () => {
    button.setAttribute('aria-busy', 'true')
    setTimeout(() => button.removeAttribute('aria-busy'), 1600)
  })

// The animated mark demo.
for (const holder of $$('[data-animate-mark]'))
  holder.querySelector('svg')?.setAttribute('data-animate', '')

// Motion speeds: each button replays its curve.
for (const button of $$<HTMLButtonElement>('[data-speed]'))
  button.addEventListener('click', () => {
    button.removeAttribute('data-run')
    void button.offsetWidth
    button.setAttribute('data-run', '')
  })

// Icon search and copy.
const grid = document.querySelector('[data-icon-grid]')
if (grid) {
  const search = document.querySelector<HTMLInputElement>('[data-icon-search]')!
  const empty = document.querySelector<HTMLElement>('[data-icon-empty]')!
  const items = $$<HTMLButtonElement>('[data-icon]', grid)
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase()
    let shown = 0
    for (const item of items) {
      const match = !query || item.dataset.search!.includes(query)
      item.parentElement!.hidden = !match
      if (match) shown++
    }
    empty.hidden = shown > 0
  })
  for (const item of items)
    item.addEventListener('click', () =>
      copy(item.dataset.icon!, fill(strings.iconCopied, { name: item.dataset.icon! })),
    )
}

// Menus built on <details> close on Escape and on a click outside them.
const menus = $$<HTMLDetailsElement>('details.lang, details.nav-more')
document.addEventListener('click', (event) => {
  for (const menu of menus) if (!menu.contains(event.target as Node)) menu.open = false
})
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return
  for (const menu of menus)
    if (menu.open) {
      menu.open = false
      menu.querySelector('summary')?.focus()
    }
})

preferences({ labels: strings.prefs, consent: strings.consent })
magnetic()
