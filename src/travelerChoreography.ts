import { scenePropModels, type ScenePoint, type ScenePropId } from './scenePropModel.ts'
import type { TravelerKey } from './TravelerAvatar'

export const travelerOrder = ['jules', 'milo', 'kate', 'rob'] as const satisfies readonly TravelerKey[]

export type TravelerProfile = Readonly<{
  id: TravelerKey
  name: string
  color: string
  skinColor: string
}>

export const travelerProfiles = {
  jules: {
    id: 'jules',
    name: 'Jules',
    color: '#7b6ca8',
    skinColor: '#dda47f',
  },
  milo: {
    id: 'milo',
    name: 'Milo',
    color: '#182a2e',
    skinColor: '#dca17e',
  },
  kate: {
    id: 'kate',
    name: 'Kate',
    color: '#66864b',
    skinColor: '#e9ac89',
  },
  rob: {
    id: 'rob',
    name: 'Rob',
    color: '#397da0',
    skinColor: '#e3a47f',
  },
} as const satisfies Record<TravelerKey, TravelerProfile>

export type TravelerSceneState = 'start' | 'settled'
export type FinaleDance = 'side-step' | 'arm-swing' | 'bounce' | 'turn'

export type SceneTravelerAssignment = Readonly<{
  traveler: TravelerKey
  occupantIndex: 0 | 1 | 2 | 3
  delay: number
  facing: 1 | -1
  finalRotation: number
}>

export type ClothingLanding = Readonly<{
  traveler: TravelerKey
  point: ScenePoint
  rotation: number
}>

export type FinaleAssignment = Readonly<{
  traveler: TravelerKey
  point: ScenePoint
  facing: 1 | -1
  dance: FinaleDance
}>

export type FinaleDanceTrack = Readonly<{
  points: readonly ScenePoint[]
  rotations: readonly number[]
  scales: readonly number[]
}>

export const travelerSceneAssignments = {
  airplane: [
    { traveler: 'jules', occupantIndex: 0, delay: 0, facing: 1, finalRotation: -2 },
    { traveler: 'milo', occupantIndex: 1, delay: 0.16, facing: 1, finalRotation: 1 },
    { traveler: 'kate', occupantIndex: 2, delay: 0.32, facing: 1, finalRotation: -1 },
    { traveler: 'rob', occupantIndex: 3, delay: 0.48, facing: 1, finalRotation: 2 },
  ],
  beds: [
    { traveler: 'jules', occupantIndex: 0, delay: 0, facing: 1, finalRotation: -6 },
    { traveler: 'kate', occupantIndex: 1, delay: 0.15, facing: -1, finalRotation: 6 },
    { traveler: 'milo', occupantIndex: 2, delay: 0.3, facing: 1, finalRotation: -5 },
    { traveler: 'rob', occupantIndex: 3, delay: 0.45, facing: -1, finalRotation: 5 },
  ],
  onsen: [
    { traveler: 'jules', occupantIndex: 0, delay: 0, facing: 1, finalRotation: -2 },
    { traveler: 'milo', occupantIndex: 1, delay: 0.16, facing: 1, finalRotation: 1 },
    { traveler: 'kate', occupantIndex: 2, delay: 0.32, facing: -1, finalRotation: -1 },
    { traveler: 'rob', occupantIndex: 3, delay: 0.48, facing: -1, finalRotation: 2 },
  ],
} as const satisfies Record<ScenePropId, readonly SceneTravelerAssignment[]>

export const sceneTimelines = {
  airplane: {
    duration: 1.12,
    settleOffset: 0.76,
    runnerScale: 0.34,
    occupantScale: 0.46,
  },
  beds: {
    duration: 1.16,
    settleOffset: 0.82,
    runnerScale: 0.34,
    occupantScale: 0.48,
  },
  onsen: {
    duration: 1.08,
    settleOffset: 0.72,
    runnerScale: 0.34,
    occupantScale: 0.42,
  },
} as const satisfies Record<
  ScenePropId,
  Readonly<{
    duration: number
    settleOffset: number
    runnerScale: number
    occupantScale: number
  }>
>

export const clothingLandings = [
  { traveler: 'jules', point: { x: 92, y: 238 }, rotation: -12 },
  { traveler: 'milo', point: { x: 176, y: 307 }, rotation: 8 },
  { traveler: 'kate', point: { x: 548, y: 310 }, rotation: -7 },
  { traveler: 'rob', point: { x: 642, y: 238 }, rotation: 13 },
] as const satisfies readonly ClothingLanding[]

export const travelerHeadBounds = {
  jules: { minX: -18, maxX: 28, minY: -36, maxY: 1 },
  milo: { minX: -19, maxX: 19, minY: -36, maxY: 3 },
  kate: { minX: -19, maxX: 20, minY: -37, maxY: 5 },
  rob: { minX: -18, maxX: 19, minY: -36, maxY: 5 },
} as const satisfies Record<
  TravelerKey,
  Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>
>

export const travelerSettledPoseModel = {
  bodyScale: 0.72,
  headScales: {
    airplane: 1,
    beds: 1.25,
    onsen: 1.25,
  },
  offsets: {
    airplane: {
      jules: { x: -5, y: 0 },
      milo: { x: 0, y: 0 },
      kate: { x: -1, y: 0 },
      rob: { x: 0, y: 0 },
    },
    beds: {
      jules: { x: -4, y: -5 },
      milo: { x: 0, y: -5 },
      kate: { x: -1, y: -5 },
      rob: { x: 0, y: -5 },
    },
    onsen: {
      jules: { x: -4, y: 0 },
      milo: { x: 0, y: 0 },
      kate: { x: -1, y: 0 },
      rob: { x: 0, y: 0 },
    },
  },
} as const satisfies Readonly<{
  bodyScale: number
  headScales: Record<ScenePropId, number>
  offsets: Record<ScenePropId, Record<TravelerKey, ScenePoint>>
}>

export const finaleViewBox = [0, 0, 720, 250] as const

export const finaleAssignments = [
  { traveler: 'jules', point: { x: 168, y: 184 }, facing: 1, dance: 'side-step' },
  { traveler: 'milo', point: { x: 296, y: 184 }, facing: 1, dance: 'arm-swing' },
  { traveler: 'kate', point: { x: 424, y: 184 }, facing: -1, dance: 'bounce' },
  { traveler: 'rob', point: { x: 552, y: 184 }, facing: -1, dance: 'turn' },
] as const satisfies readonly FinaleAssignment[]

export const finaleDanceTimeline = {
  duration: 10,
  times: [0, 0.14, 0.28, 0.38, 0.52, 0.7, 0.84, 1],
  phases: ['groove', 'groove', 'hands-up', 'spins', 'cross', 'swapped', 'regroup', 'groove'],
  tracks: {
    jules: {
      points: [
        { x: 168, y: 184 },
        { x: 148, y: 176 },
        { x: 178, y: 170 },
        { x: 188, y: 178 },
        { x: 250, y: 180 },
        { x: 424, y: 184 },
        { x: 228, y: 174 },
        { x: 168, y: 184 },
      ],
      rotations: [0, -5, 0, 0, 360, 366, 360, 360],
      scales: [1, 0.94, 1.03, 1, 0.96, 1, 1.03, 1],
    },
    milo: {
      points: [
        { x: 296, y: 184 },
        { x: 314, y: 178 },
        { x: 286, y: 170 },
        { x: 278, y: 180 },
        { x: 368, y: 176 },
        { x: 552, y: 184 },
        { x: 340, y: 180 },
        { x: 296, y: 184 },
      ],
      rotations: [0, 4, 0, 0, -360, -354, -360, -360],
      scales: [1, 0.97, 1.04, 1, 0.94, 1, 0.98, 1],
    },
    kate: {
      points: [
        { x: 424, y: 184 },
        { x: 404, y: 176 },
        { x: 436, y: 170 },
        { x: 446, y: 178 },
        { x: 350, y: 180 },
        { x: 168, y: 184 },
        { x: 380, y: 174 },
        { x: 424, y: 184 },
      ],
      rotations: [0, -4, 0, 0, 360, 354, 360, 360],
      scales: [1, 0.95, 1.04, 1, 0.95, 1, 1.02, 1],
    },
    rob: {
      points: [
        { x: 552, y: 184 },
        { x: 570, y: 178 },
        { x: 542, y: 170 },
        { x: 532, y: 180 },
        { x: 468, y: 176 },
        { x: 296, y: 184 },
        { x: 492, y: 180 },
        { x: 552, y: 184 },
      ],
      rotations: [0, 5, 0, 0, -360, -366, -360, -360],
      scales: [1, 0.96, 1.03, 1, 0.93, 1, 0.98, 1],
    },
  },
} as const satisfies Readonly<{
  duration: number
  times: readonly number[]
  phases: readonly string[]
  tracks: Record<TravelerKey, FinaleDanceTrack>
}>

export function getTravelerSceneState(
  active: boolean,
  reducedMotion: boolean,
): TravelerSceneState {
  return active || reducedMotion ? 'settled' : 'start'
}

export function resolveOccupantPoint(
  scene: ScenePropId,
  assignment: SceneTravelerAssignment,
) {
  return scenePropModels[scene].anchors.occupants[assignment.occupantIndex]
}

export function getSettledHeadBounds(
  scene: ScenePropId,
  assignment: SceneTravelerAssignment,
) {
  const point = resolveOccupantPoint(scene, assignment)
  const offset = travelerSettledPoseModel.offsets[scene][assignment.traveler]
  const head = travelerHeadBounds[assignment.traveler]
  const scale = travelerSettledPoseModel.headScales[scene]
  const translatedX =
    point.x + offset.x
  const translatedY = point.y + offset.y
  const scaledX = [
    head.minX * scale * assignment.facing,
    head.maxX * scale * assignment.facing,
  ]

  return {
    minX: translatedX + Math.min(...scaledX),
    maxX: translatedX + Math.max(...scaledX),
    minY: translatedY + head.minY * scale,
    maxY: translatedY + head.maxY * scale,
  }
}
