import assert from 'node:assert/strict'
import test from 'node:test'
import { pointIsInsideScene, scenePropModels } from '../src/scenePropModel.ts'
import {
  clothingLandings,
  finaleAssignments,
  finaleDanceTimeline,
  finaleViewBox,
  getSettledHeadBounds,
  resolveOccupantPoint,
  travelerOrder,
  travelerProfiles,
  travelerSceneAssignments,
} from '../src/travelerChoreography.ts'

test('traveler identity order and airplane seating remain stable', () => {
  assert.deepEqual(travelerOrder, ['jules', 'milo', 'kate', 'rob'])
  assert.deepEqual(
    travelerSceneAssignments.airplane.map(({ traveler, occupantIndex }) => ({
      traveler,
      occupantIndex,
    })),
    [
      { traveler: 'jules', occupantIndex: 0 },
      { traveler: 'milo', occupantIndex: 1 },
      { traveler: 'kate', occupantIndex: 2 },
      { traveler: 'rob', occupantIndex: 3 },
    ],
  )
})

test('beds pair Jules with Kate and Milo with Rob', () => {
  assert.deepEqual(
    travelerSceneAssignments.beds.map(({ traveler, occupantIndex }) => ({
      traveler,
      occupantIndex,
    })),
    [
      { traveler: 'jules', occupantIndex: 0 },
      { traveler: 'kate', occupantIndex: 1 },
      { traveler: 'milo', occupantIndex: 2 },
      { traveler: 'rob', occupantIndex: 3 },
    ],
  )
})

test('every destination scene assigns all four travelers to unique valid anchors', () => {
  Object.entries(travelerSceneAssignments).forEach(([scene, assignments]) => {
    assert.deepEqual(
      new Set(assignments.map(({ traveler }) => traveler)),
      new Set(travelerOrder),
    )
    assert.equal(
      new Set(assignments.map(({ occupantIndex }) => occupantIndex)).size,
      4,
    )
    assignments.forEach((assignment) => {
      const point = resolveOccupantPoint(
        scene as keyof typeof travelerSceneAssignments,
        assignment,
      )
      assert.equal(
        pointIsInsideScene(
          point,
          scenePropModels[scene as keyof typeof scenePropModels].viewBox,
        ),
        true,
      )
    })
  })
})

test('onsen clothing bundles use each shirt color and land at four dry unique points', () => {
  assert.equal(clothingLandings.length, 4)
  assert.equal(
    new Set(clothingLandings.map(({ traveler }) => traveler)).size,
    4,
  )
  assert.equal(
    new Set(clothingLandings.map(({ point }) => `${point.x},${point.y}`)).size,
    4,
  )

  clothingLandings.forEach(({ traveler, point }) => {
    assert.ok(travelerProfiles[traveler].color.startsWith('#'))
    assert.equal(pointIsInsideScene(point, scenePropModels.onsen.viewBox), true)
    assert.ok(
      point.y > scenePropModels.onsen.anchors.occlusionY ||
        point.x < 130 ||
        point.x > 600,
    )
  })
})

test('finale gives each traveler a distinct in-bounds position and dance', () => {
  assert.deepEqual(
    finaleAssignments.map(({ traveler }) => traveler),
    travelerOrder,
  )
  assert.equal(
    new Set(finaleAssignments.map(({ point }) => `${point.x},${point.y}`)).size,
    4,
  )
  assert.equal(new Set(finaleAssignments.map(({ dance }) => dance)).size, 4)
  finaleAssignments.forEach(({ point }) => {
    assert.equal(pointIsInsideScene(point, finaleViewBox), true)
  })
})

test('finale timeline includes hands-up, full spins, position swaps, and bounded regrouping', () => {
  assert.equal(finaleDanceTimeline.duration, 10)
  assert.ok(finaleDanceTimeline.phases.includes('hands-up'))
  assert.ok(finaleDanceTimeline.phases.includes('spins'))
  assert.ok(finaleDanceTimeline.phases.includes('swapped'))

  const initialPoints = Object.fromEntries(
    finaleAssignments.map(({ traveler, point }) => [traveler, point]),
  )
  const swapTargets = {
    jules: initialPoints.kate,
    milo: initialPoints.rob,
    kate: initialPoints.jules,
    rob: initialPoints.milo,
  } as const

  travelerOrder.forEach((traveler) => {
    const track = finaleDanceTimeline.tracks[traveler]
    assert.equal(track.points.length, finaleDanceTimeline.times.length)
    assert.equal(track.rotations.length, finaleDanceTimeline.times.length)
    assert.equal(track.scales.length, finaleDanceTimeline.times.length)
    assert.deepEqual(track.points[5], swapTargets[traveler])
    assert.ok(Math.max(...track.rotations.map(Math.abs)) >= 360)
    track.points.forEach((point) => {
      assert.equal(pointIsInsideScene(point, finaleViewBox), true)
      assert.ok(point.x >= 120 && point.x <= 600)
      assert.ok(point.y >= 150 && point.y <= 205)
    })
  })
})

test('all four airplane heads fit fully inside separate cabin window openings', () => {
  travelerSceneAssignments.airplane.forEach((assignment) => {
    const anchor = resolveOccupantPoint('airplane', assignment)
    const head = getSettledHeadBounds('airplane', assignment)
    assert.ok(head.minX >= anchor.x - 24)
    assert.ok(head.maxX <= anchor.x + 24)
    assert.ok(head.minY >= 126)
    assert.ok(head.maxY <= 179)
  })
})

test('all four bed heads remain fully above the duvet and inside their pillows', () => {
  travelerSceneAssignments.beds.forEach((assignment) => {
    const anchor = resolveOccupantPoint('beds', assignment)
    const head = getSettledHeadBounds('beds', assignment)
    assert.ok(head.minX >= anchor.x - 37)
    assert.ok(head.maxX <= anchor.x + 37)
    assert.ok(head.minY >= 126)
    assert.ok(head.maxY <= 180)
  })
})

test('all four onsen heads remain complete above the foreground occlusion plane', () => {
  const heads = travelerSceneAssignments.onsen.map((assignment) =>
    getSettledHeadBounds('onsen', assignment),
  )
  heads.forEach((head) => {
    assert.ok(head.maxY <= scenePropModels.onsen.anchors.occlusionY - 10)
  })
  for (let index = 1; index < heads.length; index += 1) {
    assert.ok(heads[index - 1].maxX < heads[index].minX)
  }
})

test('onsen assigns Jules and Kate to foreground heads and Milo and Rob to rear busts', () => {
  const anchors = Object.fromEntries(
    travelerSceneAssignments.onsen.map((assignment) => [
      assignment.traveler,
      resolveOccupantPoint('onsen', assignment),
    ]),
  )
  assert.ok(anchors.jules.y > anchors.milo.y)
  assert.ok(anchors.kate.y > anchors.rob.y)
  assert.ok(Math.abs(anchors.jules.y - anchors.kate.y) <= 2)
  assert.ok(Math.abs(anchors.milo.y - anchors.rob.y) <= 2)
})
