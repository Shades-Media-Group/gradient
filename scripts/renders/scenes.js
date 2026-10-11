/**
 * The product shots on gradient.shades.md, built from the real print files.
 * Each scene returns WebP data URLs at the widths the site serves.
 */
import { NECK, drapeTee } from './garment.js'
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

/** Event badges on their lanyards: a team badge in front, a guest badge behind. */
async function badges(assets) {
  const s = studio({
    width: 2400,
    height: 3000,
    fov: 13.5,
    eye: [0, 95, 1450],
    target: [4, 95, 0],
    exposure: 0.95,
    env: 0.24,
  })
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
    const map = await (async () => {
      const t = texture(
        await (async () => {
          const img = await image(faceSource)
          const [c, ctx] = canvas(img.naturalWidth, img.naturalHeight)
          ctx.drawImage(img, 0, 0)
          return c
        })(),
        renderer,
        { color: true },
      )
      t.repeat.set(1 / 90, 1 / 130)
      return t
    })()
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
  await one(assets.badgeGuest, '#1a1a1d', { x: 58, y: 118, z: -6, tilt: -0.05, lean: -0.04 })
  await one(assets.badgeTeam, '#E40523', { x: -48, y: 98, z: 18, tilt: 0.035, lean: -0.05 })

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
  return encode(s.shoot(256, 7, { aperture: 3, focus: [-48, 60, 18] }), [1200, 600])
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
 * The tee on a hanger, back to camera. The drape is simulated (garment.js);
 * the back carries the print file laid out in renders.mjs.
 */
async function tee(assets) {
  const { outer, inner } = drapeTee()
  // Pattern-space textures: 800 × 760 mm at 3 px/mm.
  const PX = 3
  const [albedo, ctx] = canvas(800 * PX, 760 * PX)
  const data = ctx.createImageData(albedo.width, albedo.height)
  for (let y = 0; y < albedo.height; y++)
    for (let x = 0; x < albedo.width; x++) {
      const k =
        31 + (noise(x / 1.1, y / 0.8, 6) - 0.5) * 7 + (fbm(x / 240, y / 240, 2, 9) - 0.5) * 5
      const i = (y * albedo.width + x) * 4
      data.data[i] = k - 2
      data.data[i + 1] = k
      data.data[i + 2] = k + 6
      data.data[i + 3] = 255
    }
  ctx.putImageData(data, 0, 0)
  const [plain, pctx] = canvas(albedo.width, albedo.height)
  pctx.putImageData(data, 0, 0)
  if (assets.teeBack) {
    const art = await image(assets.teeBack)
    // The print area: 300 × 420 mm, 70 mm below the collar.
    ctx.drawImage(art, (400 - 150) * PX, (760 - (NECK - 70)) * PX, 300 * PX, 420 * PX)
  }
  const printed = ctx.getImageData(0, 0, albedo.width, albedo.height).data
  const relief = normalMap(
    albedo.width,
    albedo.height,
    (x, y) => {
      const mmY = 760 - y / PX
      const mmX = x / PX - 400
      let v = noise(x / 1.1, y / 0.7, 3) * 0.3
      const groove = (d) => Math.exp(-((d / 0.8) ** 2))
      // Hem: two rows of stitches.
      v -= 0.5 * (groove(mmY - 20) + groove(mmY - 26))
      // Collar: a 16 mm rib band along the neckline, stitched on its lower edge.
      const neck = NECK - 18 * Math.sin(Math.PI * Math.min(1, Math.max(0, (mmX + 92) / 184)))
      if (Math.abs(mmX) < 96 && mmY > neck - 16 && mmY <= neck + 1)
        v += 0.35 + 0.28 * Math.sin(mmX * 2.4)
      if (Math.abs(mmX) < 96) v -= 0.6 * groove(mmY - (neck - 16))
      // Shoulder seams, from the collar to the shoulder point.
      const ax = Math.abs(mmX)
      if (ax > 92 && ax < 246) v -= 0.5 * groove(mmY - (NECK - ((ax - 92) / 154) * 34))
      // Sleeve hems: stitches 18 mm and 24 mm in from the cuff.
      const cuff =
        ((ax - 392) * (336 - 392) + (mmY - 576) * (480 - 576)) / Math.hypot(336 - 392, 480 - 576)
      const across =
        ((ax - 392) * (480 - 576) - (mmY - 576) * (336 - 392)) / Math.hypot(336 - 392, 480 - 576)
      if (ax > 250 && cuff > -4 && cuff < 112)
        v -= 0.5 * (groove(across + 18) + groove(across + 24))
      if (printed[(y * albedo.width + x) * 4] > 110) v += 0.45
      return v
    },
    2,
  )
  const [rough, rctx] = canvas(albedo.width, albedo.height)
  const rd = rctx.createImageData(albedo.width, albedo.height)
  for (let i = 0; i < rd.data.length; i += 4) {
    rd.data[i] = rd.data[i + 1] = rd.data[i + 2] = printed[i] > 110 ? 135 : 240
    rd.data[i + 3] = 255
  }
  rctx.putImageData(rd, 0, 0)

  const s = studio({
    width: 2400,
    height: 3000,
    fov: 24,
    eye: [-480, 430, 2150],
    target: [0, 380, 0],
    exposure: 1.02,
    env: 0.18,
  })
  const { scene, renderer } = s
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 6000),
    new THREE.MeshStandardMaterial({
      color: 0xe0dcd5,
      roughness: 0.96,
      normalMap: paperNormal(renderer, { repeat: [90, 90], strength: 0.7, seed: 21 }),
      normalScale: new THREE.Vector2(0.6, 0.6),
    }),
  )
  wall.position.set(0, 2000, -90)
  wall.receiveShadow = true
  scene.add(wall)
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xb9bcc1, metalness: 1, roughness: 0.32 })
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 3000, 48), steel)
  rail.rotation.z = Math.PI / 2
  rail.position.set(0, NECK + 96, -4)
  rail.castShadow = rail.receiveShadow = true
  const hook = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        [
          [0, NECK - 4, -2],
          [0, NECK + 46, -2],
          [0, NECK + 98, 12],
          [0, NECK + 114, -4],
          [0, NECK + 98, -20],
          [0, NECK + 84, -16],
        ].map((p) => new THREE.Vector3(...p)),
      ),
      90,
      2.4,
      16,
    ),
    steel,
  )
  rail.castShadow = hook.castShadow = true
  scene.add(rail, hook)

  const jersey = (map, roughnessMap) =>
    new THREE.MeshPhysicalMaterial({
      map,
      roughness: 1,
      roughnessMap,
      normalMap: texture(relief, renderer),
      normalScale: new THREE.Vector2(0.7, 0.7),
      sheen: 1,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color(0x5c5f68),
      side: THREE.DoubleSide,
    })
  const shirt = new THREE.Mesh(
    outer,
    jersey(texture(albedo, renderer, { color: true }), texture(rough, renderer)),
  )
  const lining = new THREE.Mesh(inner, jersey(texture(plain, renderer, { color: true }), null))
  for (const m of [shirt, lining]) {
    m.castShadow = m.receiveShadow = true
    scene.add(m)
  }

  const sun = [-2300, 1500, 700]
  s.light({
    kind: 'area',
    position: sun,
    radius: 55,
    illuminance: 4.2,
    color: 0xfff0e2,
    bounds: 620,
  })
  s.light({ kind: 'sky', intensity: 0.5, color: 0xe6ecff, bounds: 620 })
  windowFrame(s, sun, [0, 380, 0], 0.3, [2600, 2600], [170, 210], 32, 4, 5)
  return encode(s.shoot(256, 7, { aperture: 3, focus: [0, 520, 10] }), [1200, 600])
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

const SCENES = { cards, tote, badges, sticker, tee, og }

window.render = async (name, assets) => SCENES[name](assets)
