// Self-contained styles (fonts and tokens come in through rulebook.css), so the
// public pages' shared stylesheet stays as it was. The reader's theme still
// applies: preferences-boot.js sets it before paint.
import './rulebook.css'

// On a phone the topic list starts folded, so the page itself is seen first.
if (matchMedia('(max-width: 860px)').matches)
  document.querySelector('.rb-nav-all')?.removeAttribute('open')

// Find on this page: hides every section that doesn't contain all the words typed.
const input = document.querySelector<HTMLInputElement>('.rb-find input')!
const sections = [...document.querySelectorAll<HTMLElement>('.rb-section')]
const empty = document.querySelector<HTMLElement>('.rb-empty')!
const text = new Map(sections.map((s) => [s, s.textContent!.toLowerCase()]))

input.addEventListener('input', () => {
  const words = input.value.toLowerCase().split(/\s+/).filter(Boolean)
  let shown = 0
  for (const section of sections) {
    const hit = words.every((w) => text.get(section)!.includes(w))
    section.hidden = !hit
    if (hit) shown++
  }
  empty.hidden = shown > 0 || words.length === 0
})

// "/" jumps to the find field, as in most docs.
document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.target instanceof HTMLInputElement) return
  event.preventDefault()
  input.focus()
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
