/**
 * Magnetic pull for primary actions, from the shades.md site: the nearest
 * marked element within reach leans a fifth of the way toward the pointer and
 * springs back on release. Mouse and pen only; nothing runs under reduced motion.
 *
 *   import { magnetic } from 'shades-gradient/magnetic'
 *   const stop = magnetic('[data-magnetic]')
 */
const REACH = 80
const STRENGTH = 0.2
const MAX = 28

export function magnetic(selector = '[data-magnetic]', root: Document = document): () => void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  let active: HTMLElement | null = null

  const release = (el: HTMLElement) => {
    el.style.transform = ''
    el.removeAttribute('data-pulled')
  }

  const move = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    let nearest: { el: HTMLElement; dx: number; dy: number; d: number } | null = null
    for (const el of root.querySelectorAll<HTMLElement>(selector)) {
      const r = el.getBoundingClientRect()
      const dx = event.clientX - (r.left + r.width / 2)
      const dy = event.clientY - (r.top + r.height / 2)
      const outside = Math.hypot(
        Math.max(0, Math.abs(dx) - r.width / 2),
        Math.max(0, Math.abs(dy) - r.height / 2),
      )
      if (outside <= REACH && (!nearest || outside < nearest.d)) nearest = { el, dx, dy, d: outside }
    }
    if (active && active !== nearest?.el) release(active)
    active = nearest?.el ?? null
    if (!nearest) return
    const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v * STRENGTH))
    nearest.el.setAttribute('data-pulled', '')
    nearest.el.style.transform = `translate(${clamp(nearest.dx)}px, ${clamp(nearest.dy)}px)`
  }

  const leave = () => active && release(active)
  addEventListener('pointermove', move, { passive: true })
  root.addEventListener('pointerleave', leave)
  return () => {
    removeEventListener('pointermove', move)
    root.removeEventListener('pointerleave', leave)
    leave()
  }
}
