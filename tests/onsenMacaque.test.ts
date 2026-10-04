import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { pointIsInsideScene, scenePropModels } from '../src/scenePropModel.ts'
import { getSettledHeadBounds, travelerSceneAssignments } from '../src/travelerChoreography.ts'

const source = readFileSync(new URL('../src/SceneProps.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')
const onsenSource = source.slice(source.indexOf('export function OnsenSceneProp'))

const macaquePoint = { x: 371, y: 218 }
const macaqueScale = 0.55
// Half-width/height of the macaque fur-halo path's local bounding box.
const macaqueHeadBounds = {
  minX: macaquePoint.x - 29,
  maxX: macaquePoint.x + 30,
  minY: macaquePoint.y - 35,
  maxY: macaquePoint.y + 31,
}

test('onsen macaque head sits outside the traveler anchor arrays', () => {
  scenePropModels.onsen.anchors.occupants.forEach((occupant) => {
    assert.notDeepEqual(occupant, macaquePoint)
  })

  assert.equal(scenePropModels.onsen.anchors.occupants.length, 4)
  assert.ok(pointIsInsideScene(macaquePoint, scenePropModels.onsen.viewBox))
  assert.ok(macaquePoint.x > scenePropModels.onsen.anchors.occupants[1].x)
  assert.ok(macaquePoint.x < scenePropModels.onsen.anchors.occupants[2].x)
})

test('onsen travelers sit farther back while preserving their stagger', () => {
  assert.deepEqual(
    scenePropModels.onsen.anchors.occupants.map(({ y }) => y),
    [203, 182, 203, 182],
  )
  assert.ok(
    scenePropModels.onsen.anchors.occupants.every(({ y }) => y < macaquePoint.y),
  )
})

test('onsen macaque head remains smaller than every traveler head', () => {
  const macaqueWidth = (macaqueHeadBounds.maxX - macaqueHeadBounds.minX) * macaqueScale
  const macaqueHeight = (macaqueHeadBounds.maxY - macaqueHeadBounds.minY) * macaqueScale

  travelerSceneAssignments.onsen.forEach((assignment) => {
    const bounds = getSettledHeadBounds('onsen', assignment)
    assert.ok(macaqueWidth < bounds.maxX - bounds.minX)
    assert.ok(macaqueHeight < bounds.maxY - bounds.minY)
  })

  assert.match(onsenSource, /transform="scale\(\.55\)"/)
})

test('onsen macaque renders unmasked in front of the traveler heads', () => {
  const headsFrontIndex = onsenSource.lastIndexOf(
    'data-scene-layer="traveler-heads-front"',
  )
  const rimFrontIndex = onsenSource.lastIndexOf('data-scene-layer="rim-front"')
  const macaqueLayerIndex = onsenSource.indexOf(
    'data-scene-layer="macaque-foreground"',
  )
  const macaqueHeadIndex = onsenSource.indexOf(
    'data-onsen-resident="macaque-head-and-shoulders"',
  )

  assert.ok(macaqueLayerIndex > rimFrontIndex)
  assert.ok(macaqueHeadIndex > macaqueLayerIndex)
  assert.ok(macaqueLayerIndex > headsFrontIndex)

  const macaqueLayer = onsenSource.slice(
    macaqueLayerIndex,
    onsenSource.indexOf('</ScenePropSvg>', macaqueLayerIndex),
  )
  assert.match(macaqueLayer, /data-onsen-resident="macaque-head-and-shoulders"/)
  assert.doesNotMatch(macaqueLayer, /clipPath=/)
})

test('onsen macaque uses one connected head-and-shoulders silhouette', () => {
  const macaqueLayerIndex = onsenSource.indexOf(
    'data-scene-layer="macaque-foreground"',
  )
  const macaqueLayer = onsenSource.slice(
    macaqueLayerIndex,
    onsenSource.indexOf('</ScenePropSvg>', macaqueLayerIndex),
  )

  assert.doesNotMatch(onsenSource, /data-scene-layer="macaque-body"/)
  assert.match(macaqueLayer, /scene-prop__macaque-body/)
  assert.match(macaqueLayer, /M-20 38C-20 27 -12 20 0 19/)
  assert.match(macaqueLayer, /scene-prop__macaque-fur/)
  assert.ok(
    macaqueLayer.indexOf('scene-prop__macaque-body') <
      macaqueLayer.indexOf('scene-prop__macaque-fur'),
  )
})

test('onsen steam passes beside rather than across the macaque face', () => {
  assert.match(onsenSource, /M407 148C388 130 416 116/)
  assert.doesNotMatch(onsenSource, /M365 148C346 130 374 116/)
})

test('onsen macaque swims slowly with a synchronized subtle ripple', () => {
  assert.ok(onsenSource.match(/className="scene-prop__macaque-swim"/g)?.length === 1)
  assert.match(onsenSource, /scene-prop__macaque-ripple/)
  assert.match(styles, /\.scene-prop__macaque-swim\s*\{\s*animation: macaque-swim 16s/)
  assert.match(styles, /@keyframes macaque-swim/)
})

test('onsen macaque markup is decorative only, with no new traveler state wiring', () => {
  assert.match(
    onsenSource,
    /data-scene-layer="macaque-foreground"[^]*?aria-hidden="true"/,
  )
  assert.match(onsenSource, /data-onsen-resident="macaque-head-and-shoulders"/)
  assert.doesNotMatch(
    onsenSource,
    /data-onsen-resident="macaque-head-and-shoulders"[^]*?tabIndex=/,
  )
})
