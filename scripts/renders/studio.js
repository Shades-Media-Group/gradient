/**
 * A small photographic studio in Three.js. Every scene is lit by one large
 * softbox (the key) and an even sky, and the picture is the average of many
 * frames: each frame moves the key across the softbox, picks one direction
 * of the sky and nudges the camera by a fraction of a pixel. The average is
 * what a camera would see: soft shadows that sharpen where objects touch,
 * ambient occlusion in every crease, and clean antialiased edges.
 *
 * Units are millimetres. Y is up.
 */
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export { THREE }

/** A seeded random source, so every render is repeatable. */
export function seeded(seed = 1) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Smooth value noise in [0, 1]. */
export function noise(x, y, seed = 0) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi, seed)
  const b = hash(xi + 1, yi, seed)
  const c = hash(xi, yi + 1, seed)
  const d = hash(xi + 1, yi + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/** Fractal noise in [0, 1]. */
export function fbm(x, y, octaves = 4, seed = 0) {
  let sum = 0
  let amp = 0.5
  let freq = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq, seed + i * 31)
    norm += amp
    amp *= 0.5
    freq *= 2.03
  }
  return sum / norm
}

/** A canvas of the given size and its 2D context. */
export function canvas(width, height) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  return [c, c.getContext('2d', { willReadFrequently: true })]
}

/** Loads an image (data URL or SVG markup) and resolves when it is decoded. */
export async function image(source) {
  const img = new Image()
  img.src = source.startsWith('<')
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
    : source
  await img.decode()
  return img
}

/**
 * A tangent-space normal map from a height function h(x, y) in [0, 1],
 * sampled on a width × height grid. Strength is the slope multiplier.
 */
export function normalMap(width, height, h, strength = 2) {
  const field = new Float32Array(width * height)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) field[y * width + x] = h(x, y)
  const [c, ctx] = canvas(width, height)
  const out = ctx.createImageData(width, height)
  const at = (x, y) => field[((y + height) % height) * width + ((x + width) % width)]
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * width + x) * 4
      out.data[i] = (-dx / len) * 127.5 + 127.5
      out.data[i + 1] = (dy / len) * 127.5 + 127.5
      out.data[i + 2] = (1 / len) * 127.5 + 127.5
      out.data[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  return c
}

/** Wraps a canvas as a texture. Colour maps are sRGB; data maps stay linear. */
export function texture(source, renderer, { color = false, repeat } = {}) {
  const t = new THREE.CanvasTexture(source)
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = renderer.capabilities.getMaxAnisotropy()
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
  }
  return t
}

/** Fine paper tooth, as a tiling normal map. */
export function paperNormal(
  renderer,
  { size = 512, strength = 1.6, seed = 3, repeat = [1, 1] } = {},
) {
  const map = normalMap(
    size,
    size,
    (x, y) => 0.6 * fbm(x / 6, y / 6, 3, seed) + 0.4 * noise(x / 1.4, y / 1.4, seed + 9),
    strength,
  )
  return texture(map, renderer, { repeat })
}

/**
 * A seamless backdrop: a floor that curves up into a wall, the way a paper
 * sweep sits in a photo studio. `radius` is the curve; `depth` runs towards
 * the camera.
 */
export function sweep({ width = 4000, depth = 3000, height = 3000, radius = 600, z = -400 }) {
  const profile = []
  for (let i = 0; i <= 24; i++) profile.push([0, z + depth - (depth * i) / 24])
  for (let i = 1; i <= 32; i++) {
    const a = (i / 32) * (Math.PI / 2)
    profile.push([radius - radius * Math.cos(a), z - radius * Math.sin(a)])
  }
  for (let i = 1; i <= 24; i++) profile.push([radius + (height * i) / 24, z - radius])
  const columns = 2
  const positions = []
  const uvs = []
  profile.forEach(([y, pz], i) => {
    for (let j = 0; j < columns; j++) {
      positions.push(-width / 2 + (width * j) / (columns - 1), y, pz)
      uvs.push(j / (columns - 1), i / (profile.length - 1))
    }
  })
  const index = []
  for (let i = 0; i < profile.length - 1; i++) {
    const a = i * columns
    index.push(a, a + columns, a + 1, a + 1, a + columns, a + columns + 1)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * The studio. `eye` and `target` place the camera; `fov` is vertical, in
 * degrees (long lenses, 12 to 25, keep products undistorted).
 */
export function studio({ width, height, fov = 18, eye, target, exposure = 1, env = 0.3 }) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(width, height, false)
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = exposure
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = env

  const camera = new THREE.PerspectiveCamera(fov, width / height, 5, 40000)
  const aim = new THREE.Vector3(...target)
  camera.position.set(...eye)
  camera.lookAt(aim)

  const lights = []

  /**
   * A shadow-casting light.
   * - `kind: 'area'`: a softbox of `radius` mm at `position`, aimed at the
   *   target. Light falls off with distance, as it does in a real studio;
   *   `illuminance` is the brightness it gives at the target.
   * - `kind: 'sky'`: an even sky; each frame lights from one direction of the
   *   upper hemisphere, so together they add soft ambient occlusion.
   */
  function light({
    kind = 'area',
    position = [-500, 800, -300],
    radius = 120,
    illuminance = 3,
    intensity = 1,
    color = 0xffffff,
    bounds = 400,
    minElevation = 0.3,
  }) {
    let l
    if (kind === 'area') {
      const distance = new THREE.Vector3(...position).distanceTo(aim)
      l = new THREE.SpotLight(
        color,
        illuminance * distance * distance,
        0,
        Math.atan((bounds * 2.2) / distance),
        1,
        2,
      )
      l.shadow.camera.near = 20
      l.shadow.camera.far = distance * 3
    } else {
      l = new THREE.DirectionalLight(color, intensity)
      Object.assign(l.shadow.camera, {
        left: -bounds,
        right: bounds,
        top: bounds,
        bottom: -bounds,
        near: 1,
        far: bounds * 12,
      })
    }
    l.castShadow = true
    l.shadow.mapSize.set(4096, 4096)
    l.shadow.bias = -0.00008
    l.shadow.normalBias = 0.02
    l.shadow.radius = 1.5
    l.shadow.camera.updateProjectionMatrix()
    l.target.position.copy(aim)
    scene.add(l, l.target)
    lights.push({ l, kind, base: new THREE.Vector3(...position), radius, bounds, minElevation })
    return l
  }

  /**
   * Hides a mesh from the camera while it still casts shadows: a flag, or a
   * window frame between the light and the set.
   */
  function flag(mesh) {
    // three.js picks shadow casters by the camera's layers, so a flag stays
    // on the default layer and simply draws nothing: no colour, no depth.
    const invisible = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    mesh.traverse((o) => {
      if (o.isMesh) o.material = invisible
      o.castShadow = true
    })
    scene.add(mesh)
    return mesh
  }

  /**
   * Renders `frames` passes and returns the averaged picture as a canvas.
   * `aperture` (mm, the lens radius) and `focus` give real depth of field:
   * each pass looks at the focus point from a different point on the lens.
   */
  function shoot(frames = 128, seed = 7, { aperture = 0, focus = target } = {}) {
    const eyePoint = camera.position.clone()
    const focusPoint = new THREE.Vector3(...focus)
    const forward = new THREE.Vector3().subVectors(aim, eyePoint).normalize()
    const aimDistance = eyePoint.distanceTo(aim)
    const focusDistance = Math.max(
      1,
      new THREE.Vector3().subVectors(focusPoint, eyePoint).dot(forward),
    )
    const lensX = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
    const lensY = new THREE.Vector3().crossVectors(lensX, forward)
    const random = seeded(seed)
    const rt = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 })
    const acc = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.FloatType,
      depthBuffer: false,
    })
    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const add = new THREE.MeshBasicMaterial({
      map: rt.texture,
      toneMapped: false,
      depthTest: false,
      depthWrite: false,
    })
    add.blending = THREE.CustomBlending
    add.blendSrc = THREE.OneFactor
    add.blendDst = THREE.OneFactor
    add.color.setScalar(1 / frames)
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), add)
    const quadScene = new THREE.Scene()
    quadScene.add(quad)

    renderer.setRenderTarget(acc)
    renderer.setClearColor(0x000000, 0)
    renderer.clear()
    const offset = new THREE.Vector3()
    for (let f = 0; f < frames; f++) {
      const lr = Math.sqrt(random()) * aperture
      const la = random() * Math.PI * 2
      // Thin lens: move across the aperture, then turn so the focus plane stays put.
      const shift = new THREE.Vector3()
        .addScaledVector(lensX, Math.cos(la) * lr)
        .addScaledVector(lensY, Math.sin(la) * lr)
      camera.position.copy(eyePoint).add(shift)
      camera.lookAt(aim.clone().addScaledVector(shift, 1 - aimDistance / focusDistance))
      camera.setViewOffset(width, height, random() - 0.5, random() - 0.5, width, height)
      for (const { l, kind, base, radius, bounds, minElevation } of lights) {
        if (kind === 'sky') {
          const phi = random() * Math.PI * 2
          const cos = Math.sqrt(minElevation ** 2 + (1 - minElevation ** 2) * random())
          const sin = Math.sqrt(1 - cos * cos)
          offset.set(Math.cos(phi) * sin, cos, Math.sin(phi) * sin)
          l.position.copy(aim).addScaledVector(offset, bounds * 6)
        } else {
          // A random point on the softbox's face, which looks at the target.
          const facing = new THREE.Vector3().subVectors(aim, base).normalize()
          const side = new THREE.Vector3()
            .crossVectors(facing, new THREE.Vector3(0, 1, 0))
            .normalize()
          const up = new THREE.Vector3().crossVectors(side, facing)
          const r = Math.sqrt(random()) * radius
          const a = random() * Math.PI * 2
          l.position
            .copy(base)
            .addScaledVector(side, Math.cos(a) * r)
            .addScaledVector(up, Math.sin(a) * r)
        }
      }
      renderer.setRenderTarget(rt)
      renderer.render(scene, camera)
      renderer.setRenderTarget(acc)
      renderer.autoClear = false
      renderer.render(quadScene, quadCamera)
      renderer.autoClear = true
    }
    camera.clearViewOffset()
    camera.position.copy(eyePoint)
    camera.lookAt(aim)

    const show = new THREE.MeshBasicMaterial({
      map: acc.texture,
      depthTest: false,
      depthWrite: false,
    })
    quad.material = show
    renderer.setRenderTarget(null)
    renderer.render(quadScene, quadCamera)
    rt.dispose()
    acc.dispose()
    return renderer.domElement
  }

  return { THREE, scene, camera, renderer, light, flag, shoot }
}

/** Downscales a render (supersampled) and encodes it as WebP at each width. */
export function encode(source, widths, quality = 0.88) {
  return widths.map((w) => {
    const h = Math.round((source.height * w) / source.width)
    let current = source
    // Halve in steps so the downscale averages every pixel.
    while (current.width / 2 >= w) {
      const [c, ctx] = canvas(Math.round(current.width / 2), Math.round(current.height / 2))
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(current, 0, 0, c.width, c.height)
      current = c
    }
    const [c, ctx] = canvas(w, h)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(current, 0, 0, w, h)
    return [w, c.toDataURL('image/webp', quality)]
  })
}
