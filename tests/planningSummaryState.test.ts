import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRouteSequence, getStillToDecide } from '../src/planningSummaryState.ts'

test('route sequence includes only selected stops and the chosen endpoint', () => {
  assert.deepEqual(
    buildRouteSequence(
      'HOTEL GROOVE SHINJUKU',
      ['Lake Nojiri cabin area', 'Okuhida Onsen-go via Hirayu'],
      'Kyoto',
    ),
    [
      'HOTEL GROOVE SHINJUKU',
      'Lake Nojiri cabin area',
      'Okuhida Onsen-go via Hirayu',
      'Kyoto',
    ],
  )
})

test('an intentionally empty optional-stop list is not an unresolved decision', () => {
  assert.deepEqual(
    getStillToDecide({
      datesComplete: true,
      hotelSelected: true,
      endId: 'kyoto',
      routeComplete: true,
    }),
    [],
  )
})

test('still-to-decide includes only unset required decisions', () => {
  assert.deepEqual(
    getStillToDecide({
      datesComplete: false,
      hotelSelected: false,
      endId: null,
      routeComplete: false,
    }),
    ['Travel dates', 'Tokyo hotel', 'Final city'],
  )
})

test('a selected endpoint with missing route data reports the estimate problem', () => {
  assert.deepEqual(
    getStillToDecide({
      datesComplete: true,
      hotelSelected: true,
      endId: 'tokyo-station',
      routeComplete: false,
    }),
    ['Complete route estimate'],
  )
})
