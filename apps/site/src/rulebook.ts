// Self-contained styles (fonts and tokens come in through rulebook.css), so the
// public pages' shared stylesheet stays as it was. The reader's theme still
// applies: preferences-boot.js sets it before paint.
import './rulebook.css'

import { preferences } from 'shades-gradient/preferences'

// The theme menu in the corner, as on every Gradient page; no consent banner (nothing is tracked here).
preferences({ consent: false })

// Phone: the topics open as a drawer from the left; "On this page" opens as a sheet from the bottom.
const backdrop = document.querySelector<HTMLElement>('.rb-backdrop')!
const menuButton = document.querySelector<HTMLButtonElement>('.rb-menu-open')
const tocButton = document.querySelector<HTMLButtonElement>('.rb-toc-open')
const closePanels = () => {
  document.body.classList.remove('rb-nav-open', 'rb-toc-sheet')
  menuButton?.setAttribute('aria-expanded', 'false')
  tocButton?.setAttribute('aria-expanded', 'false')
  backdrop.hidden = true
}
menuButton?.addEventListener('click', () => {
  const open = !document.body.classList.contains('rb-nav-open')
  closePanels()
  if (!open) return
  document.body.classList.add('rb-nav-open')
  menuButton.setAttribute('aria-expanded', 'true')
  backdrop.hidden = false
})
tocButton?.addEventListener('click', () => {
  const open = !document.body.classList.contains('rb-toc-sheet')
  closePanels()
  if (!open) return
  document.body.classList.add('rb-toc-sheet')
  tocButton.setAttribute('aria-expanded', 'true')
  backdrop.hidden = false
})
backdrop.addEventListener('click', closePanels)
document.querySelector('.rb-toc')?.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) closePanels() })
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanels() })

// Search: every chapter, section, inspiration piece and version, in a window like the CRM's.
interface Hit { k: string; t: string; c: string; u: string; x: string }
const search = document.querySelector<HTMLDialogElement>('.rb-search')!
const field = search.querySelector<HTMLInputElement>('input')!
const results = search.querySelector<HTMLUListElement>('.rb-search-results')!
let index: Hit[] | null = null
let active = 0
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const mark = (t: string, words: string[]) => words.reduce((h, w) => h.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>'), esc(t))
const snippet = (x: string, w: string) => {
  const i = x.toLowerCase().indexOf(w)
  return i < 0 ? x.slice(0, 140) : (i > 50 ? '…' : '') + x.slice(Math.max(0, i - 50), i + 110) + '…'
}
async function openSearch() {
  search.showModal()
  field.select()
  if (!index) index = await fetch('/rulebook/assets/search.json').then((r) => r.json()).catch(() => [])
  run()
}
function run() {
  const words = field.value.toLowerCase().split(/\s+/).filter((w) => w.length > 1)
  if (!index || !words.length) { results.innerHTML = ''; return }
  const scored = index
    .map((h) => {
      const t = h.t.toLowerCase(), c = h.c.toLowerCase(), x = h.x.toLowerCase()
      if (!words.every((w) => t.includes(w) || c.includes(w) || x.includes(w))) return null
      const score = words.reduce((s, w) => s + (t.startsWith(w) ? 12 : t.includes(w) ? 8 : 0) + (c.includes(w) ? 3 : 0) + (x.includes(w) ? 1 : 0), 0) + (h.k === 'Chapter' ? 2 : 0)
      return { h, score }
    })
    .filter((r): r is { h: Hit; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40)
  active = 0
  results.innerHTML = scored.length
    ? scored.map(({ h }, i) => `<li role="option" aria-selected="${i === 0}"><a href="${h.u}"><span class="rb-hit-kind">${esc(h.k)} · ${esc(h.c)}</span><strong>${mark(h.t, words)}</strong><span class="rb-hit-text">${mark(snippet(h.x, words[0]!), words)}</span></a></li>`).join('')
    : '<li class="rb-search-none">Nothing matches. Try fewer or other words.</li>'
}
function move(step: number) {
  const items = [...results.querySelectorAll<HTMLElement>('[role="option"]')]
  if (!items.length) return
  items[active]?.setAttribute('aria-selected', 'false')
  active = (active + step + items.length) % items.length
  items[active]!.setAttribute('aria-selected', 'true')
  items[active]!.scrollIntoView({ block: 'nearest' })
}
field.addEventListener('input', run)
field.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
  if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
  if (e.key === 'Enter') results.querySelectorAll<HTMLAnchorElement>('[role="option"] a')[active]?.click()
})
search.addEventListener('click', (e) => { if (e.target === search) search.close() })
document.querySelector('.rb-search-open')!.addEventListener('click', openSearch)
document.addEventListener('keydown', (e) => {
  const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
  if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); openSearch() }
})

// The inspiration gallery: chips filter the pieces; within a facet any chip matches,
// across facets every facet must match.
const pieces = [...document.querySelectorAll<HTMLElement>('.rb-piece')]
const count = document.querySelector('.rb-count span')
for (const chip of document.querySelectorAll<HTMLButtonElement>('.rb-chip')) {
  chip.addEventListener('click', () => {
    chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'))
    const active = [...document.querySelectorAll<HTMLElement>('.rb-facet')].map((f) => ({
      facet: f.dataset.facet!,
      values: [...f.querySelectorAll('.rb-chip[aria-pressed="true"]')].map((c) => (c as HTMLElement).dataset.value!),
    }))
    let shown = 0
    for (const piece of pieces) {
      const ok = active.every(({ facet, values }) => !values.length || values.some((v) => (piece.dataset[facet] ?? '').split(' ').includes(v)))
      piece.hidden = !ok
      if (ok) shown++
    }
    if (count) count.textContent = String(shown)
  })
}

// A piece's thumbnails swap its big preview.
for (const thumb of document.querySelectorAll<HTMLButtonElement>('.rb-thumb')) {
  thumb.addEventListener('click', () => {
    const piece = thumb.closest('.rb-piece')!
    const main = piece.querySelector<HTMLImageElement>('.rb-piece-main')!
    main.src = thumb.dataset.src!
    main.alt = thumb.getAttribute('aria-label') ?? ''
    for (const t of piece.querySelectorAll('.rb-thumb')) t.setAttribute('aria-pressed', String(t === thumb))
  })
}

// The gallery's view: rows with notes, or images only (a wall to browse; a click opens the piece).
const list = document.querySelector<HTMLElement>('.rb-pieces')
const view = document.querySelector<HTMLSelectElement>('.rb-view select')
const dialog = document.querySelector<HTMLDialogElement>('.rb-dialog')
if (list && view && dialog) {
  const set = (mode: string) => {
    list.classList.toggle('is-grid', mode === 'grid')
    view.value = mode
    try { localStorage.setItem('rb-view', mode) } catch { /* private window: keep the default */ }
  }
  let saved = 'rows'
  try { saved = localStorage.getItem('rb-view') ?? 'rows' } catch { /* default */ }
  set(saved)
  view.addEventListener('change', () => set(view.value))

  const body = dialog.querySelector<HTMLElement>('.rb-dialog-body')!
  list.addEventListener('click', (event) => {
    if (!list.classList.contains('is-grid')) return
    const piece = (event.target as HTMLElement).closest<HTMLElement>('.rb-piece')
    if (!piece || (event.target as HTMLElement).closest('a')) return
    body.replaceChildren(piece.cloneNode(true))
    for (const thumb of body.querySelectorAll<HTMLButtonElement>('.rb-thumb')) {
      thumb.addEventListener('click', () => {
        const main = body.querySelector<HTMLImageElement>('.rb-piece-main')!
        main.src = thumb.dataset.src!
        for (const t of body.querySelectorAll('.rb-thumb')) t.setAttribute('aria-pressed', String(t === thumb))
      })
    }
    dialog.showModal()
  })
  dialog.querySelector('.rb-dialog-close')!.addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close() })
}

// The version button opens the list of rulebook versions.
const versions = document.querySelector<HTMLDialogElement>('.rb-versions')
document.querySelector('.rb-version')?.addEventListener('click', () => versions?.showModal())
versions?.querySelector('.rb-dialog-close')?.addEventListener('click', () => versions.close())
versions?.addEventListener('click', (event) => { if (event.target === versions) versions.close() })

// A click on a visual opens it alone over a grey overlay; arrows step through the piece's slides.
const lightbox = document.querySelector<HTMLDialogElement>('.rb-lightbox')!
const lbImg = lightbox.querySelector('img')!
const lbCaption = lightbox.querySelector<HTMLElement>('.rb-lightbox-caption')!
let slides: { src: string; alt: string }[] = []
let at = 0
const showSlide = (i: number) => {
  at = (i + slides.length) % slides.length
  lbImg.src = slides[at]!.src
  lbImg.alt = slides[at]!.alt
  lbCaption.textContent = slides.length > 1 ? `${at + 1} / ${slides.length}  ${slides[at]!.alt}` : slides[at]!.alt
  lightbox.classList.toggle('is-single', slides.length < 2)
}
document.addEventListener('click', (event) => {
  const img = (event.target as HTMLElement).closest<HTMLImageElement>('.rb-piece-main, .rb-gallery img')
  if (!img || img.closest('.rb-lightbox')) return
  // In the images-only wall a click opens the piece's notes instead.
  if (img.closest('.rb-pieces.is-grid') && !img.closest('.rb-dialog')) return
  const piece = img.closest('.rb-piece')
  const thumbs = piece ? [...piece.querySelectorAll<HTMLButtonElement>('.rb-thumb')] : []
  slides = thumbs.length
    ? thumbs.map((t) => ({ src: t.dataset.src!, alt: t.getAttribute('aria-label') ?? '' }))
    : [...(img.closest('.rb-gallery')?.querySelectorAll('img') ?? [img])].map((i) => ({ src: i.currentSrc || i.src, alt: i.closest('figure')?.querySelector('figcaption')?.textContent ?? i.alt }))
  const current = slides.findIndex((s) => img.src.endsWith(s.src) || s.src === img.currentSrc)
  showSlide(Math.max(0, current))
  lightbox.showModal()
})
lightbox.querySelector('.rb-lightbox-close')!.addEventListener('click', () => lightbox.close())
lightbox.querySelector('.rb-lightbox-prev')!.addEventListener('click', () => showSlide(at - 1))
lightbox.querySelector('.rb-lightbox-next')!.addEventListener('click', () => showSlide(at + 1))
lightbox.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close() })
lightbox.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') showSlide(at - 1)
  if (event.key === 'ArrowRight') showSlide(at + 1)
})
