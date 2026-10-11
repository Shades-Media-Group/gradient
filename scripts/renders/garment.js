/**
 * A T-shirt that hangs like one: front and back panels cut from a flat
 * pattern, sewn along the seams, pinned at the shoulders to a hanger, then
 * let fall under gravity (position-based dynamics). The folds are the
 * simulation's, not drawn.
 *
 * Pattern units are millimetres, size M: origin at the hem's centre, y up.
 */
import { THREE, noise } from './studio.js'

export const NECK = 718

/** The outline as segments, each a seam or an opening (neck, hem, sleeve hems). */
function pattern() {
  const right = {
    neck: [92, NECK],
    shoulder: [232, 684],
    sleeveTop: [372, 592],
    sleeveHem: [318, 498],
    underarm: [262, 548],
    waist: [266, 300],
    hem: [260, 0],
  }
  const mirror = ([x, y]) => [-x, y]
  const segments = []
  const add = (a, b, open) => segments.push({ a, b, open })
  const r = right
  add(r.neck, r.shoulder, false)
  add(r.shoulder, r.sleeveTop, false)
  add(r.sleeveTop, r.sleeveHem, true)
  add(r.sleeveHem, r.underarm, false)
  add(r.underarm, r.waist, false)
  add(r.waist, r.hem, false)
  add(r.hem, mirror(r.hem), true)
  add(mirror(r.hem), mirror(r.waist), false)
  add(mirror(r.waist), mirror(r.underarm), false)
  add(mirror(r.underarm), mirror(r.sleeveHem), false)
  add(mirror(r.sleeveHem), mirror(r.sleeveTop), true)
  add(mirror(r.sleeveTop), mirror(r.shoulder), false)
  add(mirror(r.shoulder), mirror(r.neck), false)
  // The back neckline: a shallow curve, open.
  const steps = 16
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps
    const t1 = (i + 1) / steps
    const at = (t) => [-92 + 184 * t, NECK - 18 * Math.sin(Math.PI * t)]
    add(at(t0), at(t1), true)
  }
  return segments
}

function inside(segments, x, y) {
  let hit = false
  for (const { a, b } of segments) {
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit
  }
  return hit
}

function closest(segments, x, y, filter = () => true) {
  let best = { d: Infinity, x, y, open: false }
  for (const s of segments) {
    if (!filter(s)) continue
    const [ax, ay] = s.a
    const [bx, by] = s.b
    const dx = bx - ax
    const dy = by - ay
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
    const px = ax + dx * t
    const py = ay + dy * t
    const d = Math.hypot(x - px, y - py)
    if (d < best.d)
      best = { d, x: px, y: py, open: s.open, shoulder: s === segments[0] || s === segments[12] }
  }
  return best
}

/**
 * Builds and drapes the shirt. Returns geometries for the outer (+z, the
 * back of the shirt, facing the camera) and the inner panel, with UVs in
 * pattern space: u = (x + 400) / 800, v = y / 760.
 */
export function drapeTee({ spacing = 8, steps = 420, iterations = 22, seed = 3 } = {}) {
  const segments = pattern()
  const x0 = -400
  const y0 = 0
  const nx = Math.ceil(800 / spacing)
  const ny = Math.ceil(760 / spacing)
  const id = (i, j) => j * (nx + 1) + i
  const node = new Array((nx + 1) * (ny + 1))
  for (let j = 0; j <= ny; j++)
    for (let i = 0; i <= nx; i++) {
      const x = x0 + i * spacing
      const y = y0 + j * spacing
      if (inside(segments, x, y)) node[id(i, j)] = { x, y, edge: false }
      else {
        const c = closest(segments, x, y)
        if (c.d < spacing * 1.5)
          node[id(i, j)] = { x: c.x, y: c.y, edge: true, open: c.open, shoulder: c.shoulder }
      }
    }
  const quads = []
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const q = [id(i, j), id(i + 1, j), id(i, j + 1), id(i + 1, j + 1)]
      if (q.every((k) => node[k]) && q.some((k) => !node[k].edge)) quads.push(q)
    }
  const used = new Set(quads.flat())

  // Particles: every front node, and back nodes except seams, which are shared.
  const front = new Map()
  const back = new Map()
  const px = []
  const inv = []
  const rest2d = []
  for (const k of used) {
    const n = node[k]
    front.set(k, px.length / 3)
    const seamDistance = closest(segments, n.x, n.y, (s) => !s.open).d
    const puff = 9 * Math.min(1, seamDistance / 70)
    px.push(n.x, n.y, puff + (noise(n.x / 40, n.y / 40, seed) - 0.5) * 3)
    inv.push(n.edge && n.shoulder ? 0 : 1)
    rest2d.push([n.x, n.y])
  }
  for (const k of used) {
    const n = node[k]
    if (n.edge && !n.open) {
      back.set(k, front.get(k))
      continue
    }
    back.set(k, px.length / 3)
    const seamDistance = closest(segments, n.x, n.y, (s) => !s.open).d
    const puff = 9 * Math.min(1, seamDistance / 70)
    px.push(n.x, n.y, -puff + (noise(n.x / 40, n.y / 40, seed + 5) - 0.5) * 3)
    inv.push(1)
    rest2d.push([n.x, n.y])
  }
  // The hanger is narrower than the shoulders, so the pinned seam sits 6 % in.
  const count = px.length / 3
  const P = new Float32Array(px)
  for (let p = 0; p < count; p++) if (inv[p] === 0) P[p * 3] *= 0.94
  const Q = new Float32Array(P)
  const W = new Float32Array(inv)

  const ca = []
  const cb = []
  const cr = []
  const ck = []
  const link = (map, a, b, k) => {
    if (!used.has(a) || !used.has(b)) return
    const pa = map.get(a)
    const pb = map.get(b)
    if (pa === pb) return
    const [ax, ay] = rest2d[pa]
    const [bx, by] = rest2d[pb]
    ca.push(pa)
    cb.push(pb)
    cr.push(Math.hypot(ax - bx, ay - by))
    ck.push(k)
  }
  for (const map of [front, back])
    for (let j = 0; j <= ny; j++)
      for (let i = 0; i <= nx; i++) {
        const k = id(i, j)
        if (!used.has(k)) continue
        if (i < nx) link(map, k, id(i + 1, j), 1)
        if (j < ny) link(map, k, id(i, j + 1), 1)
        if (i < nx && j < ny) link(map, k, id(i + 1, j + 1), 0.7)
        if (i > 0 && j < ny) link(map, k, id(i - 1, j + 1), 0.7)
        if (i + 2 <= nx) link(map, k, id(i + 2, j), 0.12)
        if (j + 2 <= ny) link(map, k, id(i, j + 2), 0.12)
      }
  const A = Int32Array.from(ca)
  const B = Int32Array.from(cb)
  const R = Float32Array.from(cr)
  const K = Float32Array.from(ck)
  const pairs = [...used]
    .filter((k) => front.get(k) !== back.get(k))
    .map((k) => [front.get(k), back.get(k)])

  const dt = 1 / 240
  const gravity = -9810 * dt * dt
  for (let step = 0; step < steps; step++) {
    for (let p = 0; p < count; p++) {
      if (W[p] === 0) continue
      const i = p * 3
      for (let a = 0; a < 3; a++) {
        const v = (P[i + a] - Q[i + a]) * 0.985
        Q[i + a] = P[i + a]
        P[i + a] += v + (a === 1 ? gravity : 0)
      }
    }
    for (let it = 0; it < iterations; it++) {
      for (let c = 0; c < A.length; c++) {
        const a = A[c] * 3
        const b = B[c] * 3
        const dx = P[b] - P[a]
        const dy = P[b + 1] - P[a + 1]
        const dz = P[b + 2] - P[a + 2]
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6
        const wa = W[A[c]]
        const wb = W[B[c]]
        const w = wa + wb
        if (w === 0) continue
        const diff = ((len - R[c]) / (len * w)) * K[c]
        P[a] += dx * diff * wa
        P[a + 1] += dy * diff * wa
        P[a + 2] += dz * diff * wa
        P[b] -= dx * diff * wb
        P[b + 1] -= dy * diff * wb
        P[b + 2] -= dz * diff * wb
      }
      // The two panels never pass through each other.
      for (const [f, b] of pairs) {
        const gap = P[f * 3 + 2] - P[b * 3 + 2]
        if (gap < 3) {
          const push = (3 - gap) / 2
          P[f * 3 + 2] += push * (W[f] ? 1 : 0)
          P[b * 3 + 2] -= push
        }
      }
    }
  }

  const build = (map, flip) => {
    const positions = new Float32Array(used.size * 3)
    const uvs = new Float32Array(used.size * 2)
    const local = new Map()
    let n = 0
    for (const k of used) {
      const p = map.get(k)
      positions.set([P[p * 3], P[p * 3 + 1], P[p * 3 + 2]], n * 3)
      uvs.set([(node[k].x - x0) / 800, (node[k].y - y0) / 760], n * 2)
      local.set(k, n++)
    }
    const index = []
    for (const [a, b, c, d] of quads) {
      const t = [local.get(a), local.get(b), local.get(c), local.get(d)]
      if (flip) index.push(t[0], t[2], t[1], t[1], t[2], t[3])
      else index.push(t[0], t[1], t[2], t[2], t[1], t[3])
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    g.setIndex(index)
    g.computeVertexNormals()
    return g
  }
  return { outer: build(front, false), inner: build(back, true) }
}
