export type ScenePropId = 'airplane' | 'beds' | 'onsen'

export type ScenePoint = Readonly<{
  x: number
  y: number
}>

export type ScenePropAnchors = Readonly<{
  approach: ScenePoint
  entry: ScenePoint
  occupants: readonly [ScenePoint, ScenePoint, ScenePoint, ScenePoint]
  occlusionY: number
  exit: ScenePoint
}>

export type ScenePropModel = Readonly<{
  viewBox: readonly [number, number, number, number]
  anchors: ScenePropAnchors
  layers: readonly string[]
}>

const sharedViewBox = [0, 0, 720, 360] as const

export const scenePropModels = {
  airplane: {
    viewBox: sharedViewBox,
    anchors: {
      approach: { x: 58, y: 292 },
      entry: { x: 526, y: 212 },
      occupants: [
        { x: 340, y: 164 },
        { x: 390, y: 164 },
        { x: 440, y: 164 },
        { x: 490, y: 164 },
      ],
      occlusionY: 205,
      exit: { x: 676, y: 212 },
    },
    layers: [
      'motion-accents',
      'rear-wing-tail',
      'fuselage',
      'cabin',
      'traveler-plane',
      'foreground-wing',
      'entry-door',
    ],
  },
  beds: {
    viewBox: sharedViewBox,
    anchors: {
      approach: { x: 54, y: 312 },
      entry: { x: 142, y: 278 },
      occupants: [
        { x: 154, y: 178 },
        { x: 274, y: 178 },
        { x: 446, y: 178 },
        { x: 566, y: 178 },
      ],
      occlusionY: 224,
      exit: { x: 670, y: 304 },
    },
    layers: [
      'room-ground',
      'bed-frames',
      'mattresses',
      'pillows',
      'traveler-plane',
      'duvets',
      'foreground',
      'traveler-heads-front',
    ],
  },
  onsen: {
    viewBox: sharedViewBox,
    anchors: {
      approach: { x: 54, y: 304 },
      entry: { x: 132, y: 242 },
      occupants: [
        { x: 208, y: 215 },
        { x: 318, y: 194 },
        { x: 427, y: 215 },
        { x: 532, y: 194 },
      ],
      occlusionY: 236,
      exit: { x: 668, y: 286 },
    },
    layers: [
      'environment-back',
      'rim-back',
      'water-back-steam',
      'traveler-plane',
      'water-front',
      'rim-front',
      'traveler-heads-front',
    ],
  },
} as const satisfies Record<ScenePropId, ScenePropModel>

export function pointIsInsideScene(
  point: ScenePoint,
  viewBox: readonly [number, number, number, number],
) {
  const [x, y, width, height] = viewBox
  return (
    point.x >= x &&
    point.x <= x + width &&
    point.y >= y &&
    point.y <= y + height
  )
}
