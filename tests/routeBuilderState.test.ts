import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  addMiddleStop,
  composeRoute,
  middleStopIds,
  moveMiddleStop,
  parseMiddleRouteState,
  partitionMiddleStops,
  removeMiddleStop,
  type MiddleStopId,
} from '../src/routeBuilderState.ts'

const drivingRoutes = JSON.parse(
  readFileSync(
    new URL('../src/data/central-japan-driving-routes.json', import.meta.url),
    'utf8',
  ),
) as {
  nodes: Record<string, { name: string }>
  pairs: Record<
    string,
    {
      distanceKm: number
      durationMinutes: number
      svgPath: string
    }
  >
}

test('public family stop label is James Brown on every rendered surface', () => {
  const mapPointsSource = readFileSync(
    new URL('../src/data/central-japan-map-points.json', import.meta.url),
    'utf8',
  )
  const mapPoints = JSON.parse(mapPointsSource) as {
    locations: Array<{ id: string; title: string }>
  }
  const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const mapSvg = readFileSync(
    new URL('../public/maps/central-japan-concept-map.svg', import.meta.url),
    'utf8',
  ).replace(/<metadata>[\s\S]*?<\/metadata>/, '')
  const publicSources = [
    appSource,
    mapPointsSource,
    drivingRoutes.nodes['family-location'].name,
    mapSvg,
  ]

  assert.equal(drivingRoutes.nodes['family-location'].name, 'James Brown')
  assert.equal(
    mapPoints.locations.find(({ id }) => id === 'family-location')?.title,
    'James Brown',
  )
  assert.match(mapSvg, />JAMES BROWN</)
  publicSources.forEach((source) => {
    assert.doesNotMatch(source, /Seiro-machi|SEIRO-MACHI/)
  })
})

test('remove moves a stop into the unselected group without duplicates', () => {
  const selected = removeMiddleStop(
    ['lake-nojiri', 'shirahone', 'family-location'],
    'shirahone',
  )
  const groups = partitionMiddleStops(selected)

  assert.deepEqual(selected, ['lake-nojiri', 'family-location'])
  assert.deepEqual(groups.selected, ['lake-nojiri', 'family-location'])
  assert.deepEqual(groups.unselected, ['shirahone', 'okuhida'])
  assert.equal(new Set([...groups.selected, ...groups.unselected]).size, middleStopIds.length)
})

test('add appends to the active route and cannot duplicate a stop', () => {
  const selected = addMiddleStop(['lake-nojiri', 'family-location'], 'shirahone')
  assert.deepEqual(selected, ['lake-nojiri', 'family-location', 'shirahone'])
  assert.deepEqual(addMiddleStop(selected, 'family-location'), selected)
})

test('move updates route order and implied numbering', () => {
  const selected = moveMiddleStop(
    ['lake-nojiri', 'family-location', 'shirahone'],
    'shirahone',
    -1,
  )
  assert.deepEqual(selected, ['lake-nojiri', 'shirahone', 'family-location'])
  assert.equal(selected.indexOf('shirahone') + 1, 2)
})

test('reset representation leaves every optional stop available below the divider', () => {
  const groups = partitionMiddleStops([])
  assert.deepEqual(groups.selected, [])
  assert.deepEqual(groups.unselected, middleStopIds)
})

test('persisted state is versioned, de-duplicated, and rejects invalid values', () => {
  assert.deepEqual(
    parseMiddleRouteState(
      JSON.stringify({
        version: 1,
        stopIds: ['lake-nojiri', 'lake-nojiri', 'shirahone', 'invalid'],
        endId: 'kyoto',
      }),
    ),
    { version: 1, stopIds: ['lake-nojiri', 'shirahone'], endId: 'kyoto' },
  )
  assert.deepEqual(parseMiddleRouteState('{bad json'), {
    version: 1,
    stopIds: [],
    endId: null,
  })
})

test('route geometry and totals recompute after remove, add, and reorder', () => {
  const initialStops: MiddleStopId[] = ['lake-nojiri', 'family-location', 'shirahone']
  const initial = composeRoute(
    'hotel-groove-shinjuku',
    initialStops,
    'kyoto',
    drivingRoutes.pairs,
  )
  const removedStops = removeMiddleStop(initialStops, 'family-location')
  const removed = composeRoute(
    'hotel-groove-shinjuku',
    removedStops,
    'kyoto',
    drivingRoutes.pairs,
  )
  const restoredStops = addMiddleStop(removedStops, 'family-location')
  const reorderedStops = moveMiddleStop(restoredStops, 'family-location', -1)
  const reordered = composeRoute(
    'hotel-groove-shinjuku',
    reorderedStops,
    'kyoto',
    drivingRoutes.pairs,
  )

  assert.equal(initial.complete, true)
  assert.equal(initial.legs.length, 4)
  assert.equal(initial.legs.every((leg) => Boolean(leg.pair.svgPath)), true)
  assert.notEqual(removed.totalDistance, initial.totalDistance)
  assert.notEqual(removed.totalMinutes, initial.totalMinutes)
  assert.deepEqual(reordered.sequence, [
    'hotel-groove-shinjuku',
    'lake-nojiri',
    'family-location',
    'shirahone',
    'kyoto',
  ])
  assert.equal(reordered.legs.every((leg) => Boolean(leg.pair.svgPath)), true)
  assert.equal(
    reordered.totalDistance,
    reordered.legs.reduce((total, leg) => total + leg.pair.distanceKm, 0),
  )
  assert.equal(
    reordered.totalMinutes,
    reordered.legs.reduce((total, leg) => total + leg.pair.durationMinutes, 0),
  )
})
