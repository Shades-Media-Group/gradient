/**
 * The product shots on gradient.shades.md, built from the real print files.
 * Each scene returns WebP data URLs at the widths the site serves.
 */
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {
  THREE,
  canvas,
  encode,
  fbm,
  image,
  noise,
  normalMap,
  paperNormal,
  seeded,
  studio,
  texture,
} from './studio.js'

const PAPER_FLOOR = 0xcfcbc4

function floorPlane(renderer, color = PAPER_FLOOR) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8000, 8000),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.94,
      normalMap: paperNormal(renderer, { repeat: [420, 420], strength: 0.9 }),
      normalScale: new THREE.Vector2(0.5, 0.5),
    }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  return floor
}

async function printTexture(source, renderer) {
  const img = await image(source)
  const [c, ctx] = canvas(img.naturalWidth, img.naturalHeight)
  ctx.drawImage(img, 0, 0)
  return texture(c, renderer, { color: true })
}

/** Seven cards in a loose stack, red side up, and one card turned to its back. */
async function cardSet(assets, renderer) {
  const tooth = paperNormal(renderer, { repeat: [3, 2], strength: 1.4, seed: 11 })
  const paper = (map, roughness = 0.84) =>
    new THREE.MeshStandardMaterial({
      map,
      roughness,
      normalMap: tooth,
      normalScale: new THREE.Vector2(0.22, 0.22),
    })
  const front = paper(await printTexture(assets.cardFront, renderer), 0.8)
  const back = paper(await printTexture(assets.cardBack, renderer))
  const core = new THREE.MeshStandardMaterial({ color: 0xf1eee7, roughness: 0.9 })
  // Card stock is never dead flat: a 0.4 mm bow along the long side catches the light.
  const geometry = new THREE.BoxGeometry(85, 0.45, 55, 48, 1, 32)
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i++)
    pos.setY(i, pos.getY(i) + 0.4 * (1 - (pos.getX(i) / 42.5) ** 2))
  geometry.computeVertexNormals()
  // The loose card also twists a little, so one corner lifts off the table.
  const twisted = geometry.clone()
  const tp = twisted.attributes.position
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i) / 42.5
    const z = tp.getZ(i) / 27.5
    tp.setY(i, tp.getY(i) + 0.55 * Math.max(0, x * z) ** 2 * 2)
  }
  twisted.computeVertexNormals()
  const card = (top, bottom, shape = geometry) => {
    const m = new THREE.Mesh(shape, [core, core, top, bottom, core, core])
    m.castShadow = m.receiveShadow = true
    return m
  }

  const random = seeded(4)
  const stack = new THREE.Group()
  for (let i = 0; i < 7; i++) {
    const c = card(front, back)
    c.position.set((random() - 0.5) * 0.6, 0.23 + i * 0.46, (random() - 0.5) * 0.6)
    c.rotation.y = (random() - 0.5) * 0.014
    stack.add(c)
  }
  const single = card(back, front, twisted)
  single.position.y = 0.23
  return { stack, single }
}

/** Business cards: a short stack face up on red, one card turned to its back. */
async function cards(assets) {
  const s = studio({
    width: 3200,
    height: 1800,
    fov: 13,
    eye: [30, 300, 420],
    target: [0, 0, 0],
    exposure: 1.08,
    env: 0.16,
  })
  const { scene, renderer } = s
  scene.add(floorPlane(renderer, 0x2a2d33))

  const { stack, single } = await cardSet(assets, renderer)
  stack.position.set(-50, 0, -4)
  stack.rotation.y = 0.16
  single.position.x = 46
  single.position.z = 10
  single.rotation.y = -0.1
  scene.add(stack, single)

  const sun = [-900, 420, -420]
  s.light({
    kind: 'area',
    position: sun,
    radius: 45,
    illuminance: 4.6,
    color: 0xffe4c4,
    bounds: 200,
  })
  s.light({ kind: 'sky', intensity: 0.35, color: 0xe6ecff, bounds: 200 })
  windowFrame(s, sun, [0, 0, 0], 0.35, [2000, 2000], [120, 150], 26, 4, 5)
  return encode(s.shoot(256, 7, { aperture: 2.2, focus: [46, 0, 10] }), [1600, 800])
}

/** Plain-weave cotton canvas as a tiling normal map: 32 threads per tile. */
function weaveNormal(renderer, repeat) {
  const size = 1024
  const threads = 32
  const p = size / threads
  const thick = (i, salt) => 0.75 + 0.5 * noise(i * 7.3, salt, 5)
  const map = normalMap(
    size,
    size,
    (x, y) => {
      const i = Math.floor(x / p)
      const j = Math.floor(y / p)
      const fx = (x % p) / p
      const fy = (y % p) / p
      const warp = (i + j) % 2 === 0
      const across = Math.sin(Math.PI * (warp ? fx : fy)) ** 0.7
      const along = 0.55 + 0.45 * Math.sin(Math.PI * (warp ? fy : fx))
      return across * along * thick(warp ? i : j, warp ? 1 : 2)
    },
    3.2,
  )
  return texture(map, renderer, { repeat })
}

/** A ribbon of `width` mm along a curve; `twist(t)` turns its face from the curve's side (0) to +Z (1). */
function ribbon(points, width, twist, segments = 160, period = 22.4) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    false,
    'centripetal',
  )
  const positions = []
  const uvs = []
  const index = []
  const length = curve.getLength()
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    const flat = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 0, 1)).normalize()
    const across = flat.lerp(new THREE.Vector3(0, 0, 1), twist(t)).normalize()
    across.addScaledVector(tangent, -across.dot(tangent)).normalize()
    for (const side of [-0.5, 0.5]) {
      const v = point.clone().addScaledVector(across, side * width)
      positions.push(v.x, v.y, v.z)
      uvs.push(side + 0.5, (t * length) / period)
    }
    if (i < segments) {
      const a = i * 2
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  return geometry
}

/** A window frame: 2 × 3 panes, used as a flag so hard light falls through it in bars. */
function windowFrame(
  s,
  lightAt,
  aim,
  along = 0.38,
  size = [1500, 1700],
  pane = [280, 330],
  bar = 46,
  cols = 2,
  rows = 3,
) {
  const [w, h] = size
  const shape = new THREE.Shape()
  shape.moveTo(-w / 2, -h / 2)
  shape.lineTo(w / 2, -h / 2)
  shape.lineTo(w / 2, h / 2)
  shape.lineTo(-w / 2, h / 2)
  shape.lineTo(-w / 2, -h / 2)
  const gridW = cols * pane[0] + (cols - 1) * bar
  const gridH = rows * pane[1] + (rows - 1) * bar
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++) {
      const x = -gridW / 2 + c * (pane[0] + bar)
      const y = -gridH / 2 + r * (pane[1] + bar)
      const hole = new THREE.Path()
      hole.moveTo(x, y)
      hole.lineTo(x, y + pane[1])
      hole.lineTo(x + pane[0], y + pane[1])
      hole.lineTo(x + pane[0], y)
      hole.lineTo(x, y)
      shape.holes.push(hole)
    }
  const frame = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
  )
  const from = new THREE.Vector3(...aim)
  const to = new THREE.Vector3(...lightAt)
  frame.position.copy(from.clone().lerp(to, along))
  frame.lookAt(to)
  return s.flag(frame)
}

/**
 * The tote, hanging empty from an oak peg against a Shades Red wall, in late
 * sun through a window: 380 × 420 mm natural canvas, a 40 mm hem, two
 * straps, and the one-colour mark screen printed 300 mm wide so it runs off
 * the bottom and the right-hand edge.
 */
async function tote(assets) {
  const W = 380
  const H = 420
  const s = studio({
    width: 2400,
    height: 3000,
    fov: 21,
    eye: [-640, 430, 1680],
    target: [20, 300, 0],
    exposure: 0.95,
    env: 0.16,
  })
  const { scene, renderer } = s

  // Painted plaster wall.
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 6000),
    new THREE.MeshStandardMaterial({
      color: 0xc8061f,
      roughness: 0.93,
      normalMap: paperNormal(renderer, { repeat: [90, 90], strength: 0.7, seed: 21 }),
      normalScale: new THREE.Vector2(0.6, 0.6),
    }),
  )
  wall.position.set(0, 2000, -1)
  wall.receiveShadow = true
  scene.add(wall)

  // The printed face: canvas colour, slubs and flecks, the hem stitching and the mark.
  const PX = 4
  const [albedo, ctx] = canvas(W * PX, H * PX)
  const [rough, rctx] = canvas(W * PX, H * PX)
  const pixels = ctx.createImageData(albedo.width, albedo.height)
  for (let y = 0; y < albedo.height; y++) {
    for (let x = 0; x < albedo.width; x++) {
      const warp = fbm(x / 7, y / 90, 3, 4) - 0.5
      const weft = fbm(x / 90, y / 7, 3, 5) - 0.5
      const cloud = fbm(x / 260, y / 260, 3, 8) - 0.5
      const k = 1 + (warp + weft) * 0.045 + cloud * 0.06
      const i = (y * albedo.width + x) * 4
      pixels.data[i] = 232 * k
      pixels.data[i + 1] = 223 * k
      pixels.data[i + 2] = 204 * k
      pixels.data[i + 3] = 255
    }
  }
  ctx.putImageData(pixels, 0, 0)
  const random = seeded(12)
  ctx.fillStyle = 'rgba(92, 70, 48, 0.35)'
  for (let n = 0; n < 2600; n++) {
    ctx.beginPath()
    ctx.ellipse(
      random() * albedo.width,
      random() * albedo.height,
      0.4 + random() * 1.4,
      0.3 + random() * 0.5,
      random() * Math.PI,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  // Hem: a fold line and two rows of stitches.
  ctx.fillStyle = 'rgba(120, 100, 70, 0.22)'
  ctx.fillRect(0, 40 * PX, albedo.width, 1.2 * PX)
  ctx.strokeStyle = 'rgba(150, 128, 96, 0.75)'
  ctx.lineWidth = 0.45 * PX
  ctx.setLineDash([2.6 * PX, 1.1 * PX])
  for (const y of [4, 36]) {
    ctx.beginPath()
    ctx.moveTo(0, y * PX)
    ctx.lineTo(albedo.width, y * PX)
    ctx.stroke()
  }
  ctx.setLineDash([])
  // The mark, as ink pressed into the weave: slightly broken where threads dip.
  const markSize = 300 * PX
  const [ink, ictx] = canvas(markSize, markSize)
  ictx.drawImage(
    await image(assets.markMono.replace(/currentColor/g, '#141414')),
    0,
    0,
    markSize,
    markSize,
  )
  const inkData = ictx.getImageData(0, 0, markSize, markSize)
  for (let y = 0; y < markSize; y++) {
    for (let x = 0; x < markSize; x++) {
      const i = (y * markSize + x) * 4 + 3
      inkData.data[i] *= 0.86 + 0.14 * noise(x / 1.6, y / 1.6, 31)
    }
  }
  ictx.putImageData(inkData, 0, 0)
  const markX = 150 * PX
  const markY = 220 * PX
  ctx.drawImage(ink, markX, markY)
  rctx.fillStyle = 'rgb(236, 236, 236)'
  rctx.fillRect(0, 0, rough.width, rough.height)
  rctx.globalCompositeOperation = 'source-over'
  rctx.filter = 'brightness(0) invert(0.55)'
  rctx.drawImage(ink, markX, markY)

  const weave = weaveNormal(renderer, [W / 22.4, H / 22.4])
  const canvasCloth = (map) =>
    new THREE.MeshPhysicalMaterial({
      map,
      roughness: 1,
      roughnessMap: map === undefined ? null : texture(rough, renderer),
      normalMap: weave,
      normalScale: new THREE.Vector2(0.55, 0.55),
      sheen: 0.35,
      sheenRoughness: 0.75,
      sheenColor: new THREE.Color(0xfff6e8),
      side: THREE.DoubleSide,
    })
  const face = canvasCloth(texture(albedo, renderer, { color: true }))

  // The body: a pillow that hangs from two points, sags between them and wrinkles.
  const body = new THREE.PlaneGeometry(W, H, 190, 210)
  body.translate(0, H / 2, 0)
  const pos = body.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const d = Math.min(x + W / 2, W / 2 - x, y, H - y)
    const top = y / H
    const pull = Math.exp(-(((Math.abs(x) - 95) / 34) ** 2))
    const middle = Math.exp(-((x / 80) ** 2))
    let z = 1.6 + 9 * (1 - Math.exp(-d / 45))
    z += 5 * pull * top ** 3
    z -= 7 * middle * Math.max(0, (top - 0.72) / 0.28) ** 2
    z += (fbm(x / 70, y / 70, 3, 2) - 0.5) * 6 * Math.min(1, d / 30)
    z += Math.max(0, y - (H - 40)) > 0 ? 1.1 : 0
    const sag = Math.abs(x) < 95 ? 13 * (1 - (x / 95) ** 2) : 9 * ((Math.abs(x) - 95) / 95) ** 1.4
    const bottom = Math.max(0, 1 - y / 26)
    z += 3.5 * bottom * Math.abs(x / (W / 2)) ** 3
    const dy = -sag * top ** 2 - bottom * (1.5 + 2.5 * noise(x / 60, 2, 17))
    const wobble =
      (noise(y / 38, x > 0 ? 3 : 7, 9) - 0.5) *
      2.4 *
      Math.max(0, 1 - Math.min(x + W / 2, W / 2 - x) / 18)
    pos.setXYZ(i, x + wobble, y + dy, z)
  }
  body.computeVertexNormals()
  const front = new THREE.Mesh(body, face)
  front.castShadow = front.receiveShadow = true
  const backPanel = new THREE.Mesh(
    body.clone().scale(1, 1, 0.08),
    canvasCloth(texture(albedo, renderer, { color: true })),
  )
  backPanel.position.z = 0.2
  backPanel.receiveShadow = true
  const hanging = new THREE.Group()
  hanging.add(front, backPanel)
  hanging.position.z = 22
  scene.add(hanging)

  // The peg.
  const [grain, gctx] = canvas(256, 1024)
  const gd = gctx.createImageData(256, 1024)
  for (let y = 0; y < 1024; y++)
    for (let x = 0; x < 256; x++) {
      const g = fbm(x / 40, y / 3, 3, 14)
      const i = (y * 256 + x) * 4
      gd.data[i] = 176 + g * 40
      gd.data[i + 1] = 132 + g * 32
      gd.data[i + 2] = 86 + g * 24
      gd.data[i + 3] = 255
    }
  gctx.putImageData(gd, 0, 0)
  const pegY = H + 300
  const peg = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 64, 64),
    new THREE.MeshPhysicalMaterial({
      map: texture(grain, renderer, { color: true }),
      roughness: 0.5,
      clearcoat: 0.3,
      clearcoatRoughness: 0.5,
    }),
  )
  peg.rotation.x = Math.PI / 2
  peg.position.set(0, pegY, 31)
  peg.castShadow = peg.receiveShadow = true
  scene.add(peg)

  // Straps: cotton webbing with a stitch row 2.5 mm in from each edge.
  const [web, wctx] = canvas(250, 224)
  wctx.fillStyle = '#e3d8c1'
  wctx.fillRect(0, 0, 250, 224)
  const edge = wctx.createLinearGradient(0, 0, 250, 0)
  edge.addColorStop(0, 'rgba(90,70,40,0.22)')
  edge.addColorStop(0.06, 'rgba(90,70,40,0)')
  edge.addColorStop(0.94, 'rgba(90,70,40,0)')
  edge.addColorStop(1, 'rgba(90,70,40,0.22)')
  wctx.fillStyle = edge
  wctx.fillRect(0, 0, 250, 224)
  wctx.strokeStyle = 'rgba(150,128,96,0.8)'
  wctx.lineWidth = 4
  wctx.setLineDash([26, 11])
  for (const x of [25, 225]) {
    wctx.beginPath()
    wctx.moveTo(x, 0)
    wctx.lineTo(x, 224)
    wctx.stroke()
  }
  const strapCloth = canvasCloth(texture(web, renderer, { color: true, repeat: [1, 1] }))
  strapCloth.normalMap = weaveNormal(renderer, [25 / 22.4, 1])
  strapCloth.roughnessMap = null
  strapCloth.roughness = 0.94
  // From inside the hem up over the peg, turning flat onto it.
  const strap = (z0, zTop) => {
    const pts = [
      [-95, H - 30, z0],
      [-88, H + 30, z0 + 4],
      [-55, H + 160, (z0 + zTop) / 2],
      [-20, pegY - 2, zTop],
      [0, pegY + 10.5, zTop],
      [20, pegY - 2, zTop],
      [55, H + 160, (z0 + zTop) / 2],
      [88, H + 30, z0 + 4],
      [95, H - 30, z0],
    ]
    const twist = (t) => Math.exp(-(((t - 0.5) / 0.16) ** 2))
    const m = new THREE.Mesh(ribbon(pts, 25, twist), strapCloth)
    m.castShadow = m.receiveShadow = true
    return m
  }
  scene.add(strap(21.4, 15), strap(25.2, 42))

  const sun = [-2300, 1500, 700]
  s.light({
    kind: 'area',
    position: sun,
    radius: 55,
    illuminance: 4.2,
    color: 0xffe4c4,
    bounds: 560,
  })
  s.light({ kind: 'sky', intensity: 0.55, color: 0xe6ecff, bounds: 560 })
  windowFrame(s, sun, [40, 300, 0], 0.3, [2400, 2400], [150, 180], 30, 4, 5)
  return encode(s.shoot(256, 7, { aperture: 5, focus: [140, 160, 14] }), [1200, 600])
}

/** A badge outline: 90 × 130 mm, 3 mm corners, a 15 × 3.5 mm lanyard slot. */
function badgeShape() {
  const r = 3
  const shape = new THREE.Shape()
  shape.moveTo(r, 0)
  shape.lineTo(90 - r, 0)
  shape.quadraticCurveTo(90, 0, 90, r)
  shape.lineTo(90, 130 - r)
  shape.quadraticCurveTo(90, 130, 90 - r, 130)
  shape.lineTo(r, 130)
  shape.quadraticCurveTo(0, 130, 0, 130 - r)
  shape.lineTo(0, r)
  shape.quadraticCurveTo(0, 0, r, 0)
  const slot = new THREE.Path()
  const [x0, x1, y0, y1] = [37.5, 52.5, 130 - 9.5, 130 - 6]
  const h = (y1 - y0) / 2
  slot.moveTo(x0 + h, y0)
  slot.lineTo(x1 - h, y0)
  slot.absarc(x1 - h, y0 + h, h, -Math.PI / 2, Math.PI / 2, false)
  slot.lineTo(x0 + h, y1)
  slot.absarc(x0 + h, y0 + h, h, Math.PI / 2, (Math.PI * 3) / 2, false)
  shape.holes.push(slot)
  return shape
}

/** Woven lanyard tape, 15 mm, with the wordmark repeating every 60 mm. */
async function lanyardTape(renderer, color, wordmark) {
  const [c, ctx] = canvas(150, 600)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 150, 600)
  for (let y = 0; y < 600; y += 2) {
    ctx.fillStyle = `rgba(0,0,0,${0.05 + 0.05 * noise(0, y / 3, 2)})`
    ctx.fillRect(0, y, 150, 1)
  }
  const mark = await image(wordmark)
  ctx.save()
  ctx.translate(75, 300)
  ctx.rotate(Math.PI / 2)
  ctx.globalAlpha = 0.92
  ctx.drawImage(mark, -150, -27, 300, 54)
  ctx.restore()
  return texture(c, renderer, { color: true, repeat: [1, 1] })
}

/**
 * Badges hanging on their lanyards against a paper wall, lit by late sun through a window.
 * Each item: the face, the tape colour, and where it hangs.
 */
async function hangBadges(assets, items, camera, focus) {
  const s = studio({ exposure: 0.95, env: 0.24, ...camera })
  const { scene, renderer } = s
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshStandardMaterial({
      color: 0xdedad3,
      roughness: 0.96,
      normalMap: paperNormal(renderer, { repeat: [80, 80], strength: 0.7, seed: 21 }),
      normalScale: new THREE.Vector2(0.6, 0.6),
    }),
  )
  wall.position.z = -60
  wall.receiveShadow = true
  scene.add(wall)

  const geometry = new THREE.ExtrudeGeometry(badgeShape(), {
    depth: 0.7,
    bevelEnabled: false,
    curveSegments: 24,
  })
  geometry.translate(-45, -130, -0.35)
  const core = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.85 })
  const metal = new THREE.MeshPhysicalMaterial({ color: 0xc9cbcf, metalness: 1, roughness: 0.28 })
  const tooth = paperNormal(renderer, { repeat: [5, 7], strength: 1.2, seed: 5 })

  const one = async (faceSource, tapeColor, { x, y, z, tilt, lean }) => {
    const img = await image(faceSource)
    const [c, ctx] = canvas(img.naturalWidth, img.naturalHeight)
    ctx.drawImage(img, 0, 0)
    const map = texture(c, renderer, { color: true })
    map.repeat.set(1 / 90, 1 / 130)
    const face = new THREE.MeshPhysicalMaterial({
      map,
      roughness: 0.62,
      clearcoat: 0.25,
      clearcoatRoughness: 0.55,
      normalMap: tooth,
      normalScale: new THREE.Vector2(0.15, 0.15),
    })
    const group = new THREE.Group()
    const card = new THREE.Mesh(geometry, [face, core])
    card.castShadow = card.receiveShadow = true
    group.add(card)

    // Split ring through the slot, and the crimp the tape is sewn into.
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6.5, 0.85, 24, 96), metal)
    ring.rotation.y = Math.PI / 2
    ring.position.set(0, -6.5, 0)
    ring.castShadow = true
    const crimp = new THREE.Mesh(new RoundedBoxGeometry(16, 9, 3.2, 4, 1.2), metal)
    crimp.position.set(0, 4.5, 0)
    crimp.castShadow = true
    group.add(ring, crimp)

    const tape = new THREE.Mesh(
      ribbon(
        [
          [0, 8, 0],
          [0, 60, -2],
          [-4, 160, -10],
          [-14, 320, -26],
        ],
        15,
        () => 0,
        120,
        60,
      ),
      new THREE.MeshPhysicalMaterial({
        map: await lanyardTape(renderer, tapeColor, assets.wordmark),
        roughness: 0.6,
        sheen: 0.25,
        sheenRoughness: 0.5,
        sheenColor: new THREE.Color(0xffffff),
        side: THREE.DoubleSide,
      }),
    )
    tape.castShadow = true
    group.add(tape)

    group.position.set(x, y, z)
    group.rotation.set(lean, 0, tilt)
    scene.add(group)
  }
  for (const [faceSource, tape, place] of items) await one(faceSource, tape, place)

  const sun = [-1400, 900, 900]
  s.light({
    kind: 'area',
    position: sun,
    radius: 50,
    illuminance: 4.2,
    color: 0xffe4c4,
    bounds: 280,
  })
  s.light({ kind: 'sky', intensity: 0.5, color: 0xe6ecff, bounds: 280 })
  windowFrame(s, sun, [0, 60, 0], 0.32, [2200, 2200], [110, 140], 24, 4, 5)
  return s.shoot(256, 7, { aperture: 3, focus })
}

/** Event badges on their lanyards: a team badge in front, a guest badge behind. */
async function badges(assets) {
  const shot = await hangBadges(
    assets,
    [
      [assets.badgeGuest, '#1a1a1d', { x: 58, y: 118, z: -6, tilt: -0.05, lean: -0.04 }],
      [assets.badgeTeam, '#E40523', { x: -48, y: 98, z: 18, tilt: 0.035, lean: -0.05 }],
    ],
    { width: 2400, height: 3000, fov: 13.5, eye: [0, 95, 1450], target: [4, 95, 0] },
    [-48, 60, 18],
  )
  return encode(shot, [1200, 600])
}

/** The conference roles side by side: speaker, attendee, crew. */
async function roles(assets) {
  const shot = await hangBadges(
    assets,
    [
      [assets.badgeAttendee, '#6364FF', { x: 14, y: 124, z: -34, tilt: 0.025, lean: -0.03 }],
      [assets.badgeCrew, '#E40523', { x: 104, y: 104, z: 6, tilt: -0.045, lean: -0.05 }],
      [assets.badgeSpeaker, '#1a1a1d', { x: -92, y: 96, z: 30, tilt: 0.05, lean: -0.06 }],
    ],
    { width: 3000, height: 2400, fov: 12, eye: [-260, 150, 1480], target: [6, 86, 0] },
    [-92, 60, 30],
  )
  return encode(shot, [1600, 800])
}

/** Lays a mesh built in the XY plane flat on the floor, top edge away from the camera. */
function layFlat(mesh) {
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

/**
 * The Spectra sticker: the character die cut with a 3 mm white border on
 * gloss vinyl, one corner peeling up off the table.
 */
/** A black notebook with the Spectra sticker on its cover, one corner peeling. */
async function stickeredNotebook(assets, renderer) {
  const PX = 20
  const art = await image(assets.spectra)
  const artW = 52 * PX
  const artH = artW * (art.naturalHeight / art.naturalWidth)
  const pad = 4 * PX
  const [c, ctx] = canvas(Math.round(artW + pad * 2), Math.round(artH + pad * 2))
  // The border: the art's silhouette grown by 3 mm.
  const [sil, sctx] = canvas(c.width, c.height)
  sctx.drawImage(art, pad, pad, artW, artH)
  sctx.globalCompositeOperation = 'source-in'
  sctx.fillStyle = '#fbfbf9'
  sctx.fillRect(0, 0, c.width, c.height)
  for (const r of [1, 2, 3])
    for (let a = 0; a < 64; a++)
      ctx.drawImage(
        sil,
        Math.cos((a / 64) * Math.PI * 2) * r * PX,
        Math.sin((a / 64) * Math.PI * 2) * r * PX,
      )
  ctx.drawImage(art, pad, pad, artW, artH)

  const wMM = c.width / PX
  const hMM = c.height / PX
  const geometry = new THREE.PlaneGeometry(wMM, hMM, 200, Math.round((200 * hMM) / wMM))
  const pos = geometry.attributes.position
  // Peel: everything past the line through the lower right curls round a 7 mm roller.
  const dir = new THREE.Vector2(0.72, -0.69).normalize()
  const origin = new THREE.Vector2(wMM * 0.24, -hMM * 0.24)
  const R = 7
  for (let i = 0; i < pos.count; i++) {
    const p = new THREE.Vector2(pos.getX(i), pos.getY(i))
    const s = p.clone().sub(origin).dot(dir)
    let z = 0.12
    if (s > 0) {
      const a = Math.min(s / R, 2.1)
      const along = R * Math.sin(a) + Math.max(0, s - R * 2.1) * Math.cos(2.1)
      z += R * (1 - Math.cos(a)) + Math.max(0, s - R * 2.1) * Math.sin(2.1)
      p.addScaledVector(dir, along - s)
    }
    pos.setXYZ(i, p.x, p.y, z)
  }
  geometry.computeVertexNormals()

  // A black notebook: soft-touch cover and an elastic band.
  const leather = normalMap(512, 512, (x, y) => fbm(x / 5, y / 5, 4, 41), 1.2)
  const cover = new THREE.Mesh(
    new RoundedBoxGeometry(150, 12, 210, 6, 3),
    new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      roughness: 0.62,
      normalMap: texture(leather, renderer, { repeat: [3, 4] }),
      normalScale: new THREE.Vector2(0.4, 0.4),
    }),
  )
  cover.position.set(-5, 6, 0)
  cover.rotation.y = 0.14
  cover.castShadow = cover.receiveShadow = true
  const band = new THREE.Mesh(
    new RoundedBoxGeometry(7, 12.8, 211, 3, 1.2),
    new THREE.MeshPhysicalMaterial({ color: 0x0e0e10, roughness: 0.45, sheen: 0.4 }),
  )
  band.position.set(55, 0.4, 0)
  band.castShadow = band.receiveShadow = true
  cover.add(band)
  const group = new THREE.Group()
  group.add(cover)
  const map = texture(c, renderer, { color: true })
  const vinyl = new THREE.MeshPhysicalMaterial({
    map,
    alphaTest: 0.5,
    roughness: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.07,
    side: THREE.FrontSide,
  })
  const liner = new THREE.MeshStandardMaterial({
    color: 0xe8e6e0,
    alphaMap: map,
    alphaTest: 0.5,
    roughness: 0.6,
    side: THREE.BackSide,
  })
  // The alpha map reads the green channel; use the art's own alpha instead.
  const [alpha, actx] = canvas(c.width, c.height)
  actx.fillStyle = '#000'
  actx.fillRect(0, 0, c.width, c.height)
  actx.drawImage(c, 0, 0)
  actx.globalCompositeOperation = 'source-in'
  const mask = ctx.getImageData(0, 0, c.width, c.height)
  const ad = actx.createImageData(c.width, c.height)
  for (let i = 0; i < mask.data.length; i += 4)
    ad.data[i] = ad.data[i + 1] = ad.data[i + 2] = mask.data[i + 3]
  for (let i = 3; i < ad.data.length; i += 4) ad.data[i] = 255
  actx.globalCompositeOperation = 'source-over'
  actx.putImageData(ad, 0, 0)
  liner.alphaMap = texture(alpha, renderer)
  const top = layFlat(new THREE.Mesh(geometry, vinyl))
  const under = layFlat(new THREE.Mesh(geometry, liner))
  for (const m of [top, under]) {
    m.castShadow = m.receiveShadow = true
    m.rotation.z = 0.32
    m.scale.setScalar(1.25)
    m.position.set(-18, 12.15, 6)
    group.add(m)
  }
  return group
}

async function sticker(assets) {
  const s = studio({
    width: 2400,
    height: 3000,
    fov: 25,
    eye: [30, 430, 190],
    target: [-8, 12, 4],
    exposure: 1.12,
    env: 0.45,
  })
  const { scene, renderer } = s
  scene.add(floorPlane(renderer, 0xd3cfc8))
  scene.add(await stickeredNotebook(assets, renderer))

  const sun = [-800, 520, -380]
  s.light({
    kind: 'area',
    position: sun,
    radius: 45,
    illuminance: 4.3,
    color: 0xffe4c4,
    bounds: 180,
  })
  s.light({ kind: 'sky', intensity: 0.45, color: 0xe6ecff, bounds: 180 })
  windowFrame(s, sun, [0, 10, 0], 0.34, [1800, 1800], [110, 140], 24, 4, 5)
  return encode(s.shoot(256, 7, { aperture: 2.4, focus: [-18, 12, 6] }), [1200, 600])
}

/**
 * The tee, from a real photograph (Md Salman, Unsplash licence): two blank
 * black tees on wire hangers. The print goes on as a mockup's smart object
 * would: warped by the folds, lit by the photo's own light, and broken by the
 * cotton's grain, so it sits in the fabric instead of on the screen.
 */
async function tee(assets) {
  const photo = await image(assets.teePhoto)
  // Crop: the left tee centred, the right one cut by the edge; 4:5, worked at
  // 2400 × 3000 so the halftone resolves, then shown at 1200 and 600.
  const crop = { x: 520, y: 0, w: 960, h: 1200 }
  const W = 2400
  const H = 3000
  const k = W / crop.w
  const [out, ctx] = canvas(W, H)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(photo, crop.x, crop.y, crop.w, crop.h, 0, 0, W, H)
  const base = ctx.getImageData(0, 0, W, H)
  const lum = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++)
    lum[i] =
      (base.data[i * 4] * 0.2126 + base.data[i * 4 + 1] * 0.7152 + base.data[i * 4 + 2] * 0.0722) /
      255
  const blur = (src, r) => {
    // Two box passes per axis: close enough to a Gaussian for light and folds.
    let a = src
    for (let pass = 0; pass < 2; pass++) {
      const h = new Float32Array(W * H)
      for (let y = 0; y < H; y++) {
        let acc = 0
        for (let x = -r; x <= r; x++) acc += a[y * W + Math.min(W - 1, Math.max(0, x))]
        for (let x = 0; x < W; x++) {
          h[y * W + x] = acc / (2 * r + 1)
          acc += a[y * W + Math.min(W - 1, x + r + 1)] - a[y * W + Math.max(0, x - r)]
        }
      }
      const v = new Float32Array(W * H)
      for (let x = 0; x < W; x++) {
        let acc = 0
        for (let y = -r; y <= r; y++) acc += h[Math.min(H - 1, Math.max(0, y)) * W + x]
        for (let y = 0; y < H; y++) {
          v[y * W + x] = acc / (2 * r + 1)
          acc += h[Math.min(H - 1, y + r + 1) * W + x] - h[Math.max(0, y - r) * W + x]
        }
      }
      a = v
    }
    return a
  }
  const light = blur(lum, 36)
  const folds = blur(lum, 12)
  // The cotton's grain, without the photo's JPEG blocks: a light blur first.
  const weave = blur(lum, 2)

  // The print area on the left tee's chest, in crop pixels.
  const print = await image(assets.teeBack)
  const pw = 250 * k
  const ph = (pw * 420) / 300
  const px = (1002 - crop.x) * k - pw / 2
  const py = (406 - crop.y) * k
  const [art, actx] = canvas(Math.round(pw), Math.round(ph))
  actx.drawImage(print, 0, 0, art.width, art.height)
  const ink = actx.getImageData(0, 0, art.width, art.height)
  // The fabric's average light under the print, so shading is relative to it.
  let sum = 0
  let n = 0
  for (let y = Math.round(py); y < py + ph; y += 4)
    for (let x = Math.round(px); x < px + pw; x += 4) {
      sum += light[y * W + x]
      n++
    }
  const mean = sum / n
  const shift = 16 * k
  // Bilinear, so a warped dot stays a dot.
  const sample = (x, y) => {
    const fx = Math.min(art.width - 1.001, Math.max(0, x))
    const fy = Math.min(art.height - 1.001, Math.max(0, y))
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = fx - x0
    const ty = fy - y0
    const at = (xx, yy) => (yy * art.width + xx) * 4
    const out = [0, 0, 0, 0]
    for (const [xx, yy, w] of [
      [x0, y0, (1 - tx) * (1 - ty)],
      [x0 + 1, y0, tx * (1 - ty)],
      [x0, y0 + 1, (1 - tx) * ty],
      [x0 + 1, y0 + 1, tx * ty],
    ])
      for (let c = 0; c < 4; c++) out[c] += ink.data[at(xx, yy) + c] * w
    return out
  }
  for (let y = Math.max(1, Math.floor(py)); y < Math.min(H - 1, py + ph); y++)
    for (let x = Math.max(1, Math.floor(px)); x < Math.min(W - 1, px + pw); x++) {
      const i = y * W + x
      // Folds bend the print along their slope.
      const gx = folds[i + 1] - folds[i - 1]
      const gy = folds[i + W] - folds[i - W]
      const s = sample(x - px + gx * shift, y - py + gy * shift)
      const alpha = (s[3] / 255) * 0.94
      if (alpha <= 0) continue
      // Lit by the photo: brighter on the folds' crests, darker in their valleys.
      const shade = Math.min(1.2, Math.max(0.72, light[i] / mean))
      const grain = 0.94 + 0.12 * Math.min(1, Math.max(0, (weave[i] - folds[i]) * 6 + 0.5))
      const o = i * 4
      for (let c = 0; c < 3; c++) {
        const printed = s[c] * shade * grain
        base.data[o + c] = base.data[o + c] * (1 - alpha) + Math.min(255, printed) * alpha
      }
    }
  ctx.putImageData(base, 0, 0)
  return encode(out, [1200, 600])
}

/** The link preview (1200 × 630): the card stack on the right, room on the left for the name. */
async function og(assets) {
  const s = studio({
    width: 2400,
    height: 1260,
    fov: 13,
    eye: [-70, 300, 400],
    target: [-62, 0, 14],
    exposure: 1.06,
    env: 0.16,
  })
  const { scene, renderer } = s
  scene.add(floorPlane(renderer, 0x2a2d33))
  const { stack, single } = await cardSet(assets, renderer)
  stack.position.set(-20, 0, -18)
  stack.rotation.y = 0.22
  single.position.set(36, 0.23, 44)
  single.rotation.y = -0.16
  scene.add(stack, single)
  const sun = [-900, 420, -420]
  s.light({
    kind: 'area',
    position: sun,
    radius: 45,
    illuminance: 4.6,
    color: 0xfff1e6,
    bounds: 240,
  })
  s.light({ kind: 'sky', intensity: 0.35, color: 0xe6ecff, bounds: 240 })
  windowFrame(s, sun, [0, 0, 0], 0.35, [2000, 2000], [120, 150], 26, 4, 5)
  return encode(s.shoot(256, 7, { aperture: 2, focus: [10, 1, 20] }), [1200])
}

const SCENES = { cards, tote, badges, roles, sticker, tee, og }

window.render = async (name, assets) => SCENES[name](assets)
