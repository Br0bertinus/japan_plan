import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  pointIsInsideScene,
  scenePropModels,
  type ScenePropId,
} from '../src/scenePropModel.ts'

const sceneIds = Object.keys(scenePropModels) as ScenePropId[]

test('all scene props share one stable stage coordinate system', () => {
  sceneIds.forEach((sceneId) => {
    assert.deepEqual(scenePropModels[sceneId].viewBox, [0, 0, 720, 360])
  })
})

test('each prop exposes approach, entry, exit, four occupant anchors, and an occlusion plane', () => {
  sceneIds.forEach((sceneId) => {
    const model = scenePropModels[sceneId]
    const points = [
      model.anchors.approach,
      model.anchors.entry,
      model.anchors.exit,
      ...model.anchors.occupants,
    ]

    assert.equal(model.anchors.occupants.length, 4)
    assert.equal(new Set(model.anchors.occupants.map(({ x, y }) => `${x},${y}`)).size, 4)
    points.forEach((point) => assert.equal(pointIsInsideScene(point, model.viewBox), true))
    assert.ok(model.anchors.occlusionY > model.viewBox[1])
    assert.ok(model.anchors.occlusionY < model.viewBox[1] + model.viewBox[3])
  })
})

test('layer names are unique and preserve a dedicated traveler plane', () => {
  sceneIds.forEach((sceneId) => {
    const layers = scenePropModels[sceneId].layers
    assert.equal(new Set(layers).size, layers.length)
    assert.ok(layers.includes('traveler-plane'))
    assert.ok(layers.indexOf('traveler-plane') > 0)
    assert.ok(layers.indexOf('traveler-plane') < layers.length - 1)
  })
})

test('onsen traveler plane remains between the back water and foreground water', () => {
  assert.deepEqual(scenePropModels.onsen.layers.slice(2, 5), [
    'water-back-steam',
    'traveler-plane',
    'water-front',
  ])
})

test('bed and onsen head layers are final, unmasked foreground layers', () => {
  assert.equal(scenePropModels.beds.layers.at(-1), 'traveler-heads-front')
  assert.equal(scenePropModels.onsen.layers.at(-1), 'traveler-heads-front')

  const source = readFileSync(
    new URL('../src/SceneProps.tsx', import.meta.url),
    'utf8',
  )
  const bedSource = source.slice(
    source.indexOf('export function BedsSceneProp'),
    source.indexOf('export function OnsenSceneProp'),
  )
  const onsenSource = source.slice(source.indexOf('export function OnsenSceneProp'))

  assert.ok(
    bedSource.lastIndexOf('data-scene-layer="traveler-heads-front"') >
      bedSource.lastIndexOf('data-scene-layer="duvets"'),
  )
  assert.ok(
    onsenSource.lastIndexOf('data-scene-layer="traveler-heads-front"') >
      onsenSource.lastIndexOf('data-scene-layer="rim-front"'),
  )
  assert.doesNotMatch(
    bedSource.match(/data-scene-layer="traveler-heads-front"[\s\S]*?<\/g>/)?.[0] ?? '',
    /clipPath=/,
  )
  assert.doesNotMatch(
    onsenSource.match(/data-scene-layer="traveler-heads-front"[\s\S]*?<\/g>/)?.[0] ?? '',
    /clipPath=/,
  )
})

test('all four onsen occupant anchors sit within the visible pool above the foreground rim', () => {
  scenePropModels.onsen.anchors.occupants.forEach(({ x, y }) => {
    const normalizedPoolPosition =
      ((x - 360) / 245) ** 2 + ((y - 225) / 75) ** 2
    assert.ok(normalizedPoolPosition <= 1)
    assert.ok(y < scenePropModels.onsen.anchors.occlusionY)
  })
})
