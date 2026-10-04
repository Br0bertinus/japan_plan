import assert from 'node:assert/strict'
import test from 'node:test'
import { equalLabelSets, selectTokyoMapLabels } from '../src/tokyoLabelLayout.ts'

const bounds = { x: 0, y: 0, width: 1000, height: 720 }

test('keeps the higher-priority label when rendered bounds collide', () => {
  const visible = selectTokyoMapLabels({
    bounds,
    collisionPadding: 0,
    candidates: [
      { id: 'ward-shinjuku', priority: 200, rect: { x: 100, y: 100, width: 90, height: 20 } },
      { id: 'hotel-groove', priority: 400, rect: { x: 130, y: 105, width: 120, height: 20 } },
    ],
  })

  assert.deepEqual([...visible], ['hotel-groove'])
})

test('uses stable ids to break equal-priority ties deterministically', () => {
  const visible = selectTokyoMapLabels({
    bounds,
    collisionPadding: 0,
    candidates: [
      { id: 'station-z', priority: 100, rect: { x: 200, y: 200, width: 80, height: 18 } },
      { id: 'station-a', priority: 100, rect: { x: 220, y: 200, width: 80, height: 18 } },
    ],
  })

  assert.deepEqual([...visible], ['station-a'])
})

test('rejects labels at map edges and labels that cover unrelated markers', () => {
  const visible = selectTokyoMapLabels({
    bounds,
    collisionPadding: 0,
    edgePadding: 8,
    obstaclePadding: 0,
    obstacles: [
      { id: 'hotel-a', priority: 450, rect: { x: 400, y: 300, width: 24, height: 24 } },
    ],
    candidates: [
      { id: 'edge-label', priority: 300, rect: { x: 2, y: 80, width: 80, height: 18 } },
      {
        id: 'station-label',
        ownerId: 'station-a',
        priority: 200,
        rect: { x: 390, y: 300, width: 80, height: 18 },
      },
    ],
  })

  assert.equal(visible.size, 0)
})

test('allows a label to sit beside its own marker and preserves required active labels', () => {
  const visible = selectTokyoMapLabels({
    bounds,
    collisionPadding: 0,
    obstaclePadding: 0,
    obstacles: [
      { id: 'hotel-a', priority: 450, rect: { x: 400, y: 300, width: 24, height: 24 } },
      { id: 'station-b', priority: 350, rect: { x: 440, y: 300, width: 12, height: 12 } },
    ],
    candidates: [
      {
        id: 'hotel-a-label',
        ownerId: 'hotel-a',
        priority: 500,
        required: true,
        rect: { x: 418, y: 300, width: 80, height: 18 },
      },
      {
        id: 'ward-label',
        priority: 200,
        rect: { x: 450, y: 300, width: 70, height: 18 },
      },
    ],
  })

  assert.deepEqual([...visible], ['hotel-a-label'])
})

test('higher-priority labels can supersede lower-priority marker obstacles', () => {
  const visible = selectTokyoMapLabels({
    bounds,
    collisionPadding: 0,
    obstaclePadding: 0,
    obstacles: [
      { id: 'station-a', priority: 300, rect: { x: 300, y: 220, width: 12, height: 12 } },
    ],
    candidates: [
      {
        id: 'hotel-label',
        priority: 400,
        rect: { x: 294, y: 215, width: 90, height: 20 },
      },
    ],
  })

  assert.deepEqual([...visible], ['hotel-label'])
})

test('set comparison prevents redundant layout state updates', () => {
  assert.equal(equalLabelSets(new Set(['a', 'b']), new Set(['b', 'a'])), true)
  assert.equal(equalLabelSets(new Set(['a']), new Set(['a', 'b'])), false)
  assert.equal(equalLabelSets(null, new Set()), false)
})
