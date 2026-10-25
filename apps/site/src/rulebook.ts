// Self-contained styles (fonts and tokens come in through rulebook.css), so the
// public pages' shared stylesheet stays as it was. The reader's theme still
// applies: preferences-boot.js sets it before paint.
import './rulebook.css'

// On a phone the contents start folded, so the text is the first thing seen.
if (matchMedia('(max-width: 900px)').matches) document.querySelector('.rb-toc details')?.removeAttribute('open')

// Find a rule: hides every section that doesn't contain all the words typed.
const input = document.querySelector<HTMLInputElement>('.rb-find input')!
const sections = [...document.querySelectorAll<HTMLElement>('.rb-section')]
const chapters = [...document.querySelectorAll<HTMLElement>('.rb-chapter')]
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
  for (const chapter of chapters)
    chapter.hidden = words.length > 0 && !chapter.querySelector('.rb-section:not([hidden])')
  empty.hidden = shown > 0
})

// "/" jumps to the search field, as in most docs.
document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.target instanceof HTMLInputElement) return
  event.preventDefault()
  input.focus()
})
