import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceMaximumJourneyScroll,
  highestRequestedCheckpointIndex,
  initialJourneyMachine,
  journeySegmentProgress,
  travelerJourneyReducer,
} from '../src/travelerJourneyState.ts'

test('journey transitions advance once in order and never reverse on repeated requests', () => {
  let state = travelerJourneyReducer(initialJourneyMachine, {
    type: 'request',
    checkpoint: 'dates',
  })
  state = travelerJourneyReducer(state, { type: 'start-next' })
  assert.equal(state.phase, 'traveling-to-dates')

  const duplicateStart = travelerJourneyReducer(state, { type: 'start-next' })
  assert.equal(duplicateStart, state)

  state = travelerJourneyReducer(state, { type: 'complete', checkpoint: 'dates' })
  assert.equal(state.phase, 'dates-settled')
  assert.equal(state.completedIndex, 0)

  const upwardScrollRequest = travelerJourneyReducer(state, {
    type: 'request',
    checkpoint: 'dates',
  })
  assert.equal(upwardScrollRequest, state)
})

test('rapid bottom request queues each checkpoint without parallel transitions', () => {
  let state = travelerJourneyReducer(initialJourneyMachine, {
    type: 'request',
    checkpoint: 'finale',
  })

  const phases = []
  for (const checkpoint of ['dates', 'hotels', 'middle', 'finale'] as const) {
    state = travelerJourneyReducer(state, { type: 'start-next' })
    phases.push(state.phase)
    state = travelerJourneyReducer(state, { type: 'complete', checkpoint })
  }

  assert.deepEqual(phases, [
    'traveling-to-dates',
    'traveling-to-hotels',
    'traveling-to-middle',
    'traveling-to-finale',
  ])
  assert.equal(state.phase, 'dancing')
  assert.equal(state.completedIndex, 3)
})

test('completion callbacks are idempotent and reject out-of-order checkpoints', () => {
  let state = travelerJourneyReducer(initialJourneyMachine, {
    type: 'request',
    checkpoint: 'middle',
  })
  state = travelerJourneyReducer(state, { type: 'start-next' })

  const outOfOrder = travelerJourneyReducer(state, {
    type: 'complete',
    checkpoint: 'middle',
  })
  assert.equal(outOfOrder, state)

  state = travelerJourneyReducer(state, { type: 'complete', checkpoint: 'dates' })
  const duplicate = travelerJourneyReducer(state, {
    type: 'complete',
    checkpoint: 'dates',
  })
  assert.equal(duplicate, state)
})

test('replay resets only journey progress and increments the animation generation', () => {
  let state = travelerJourneyReducer(initialJourneyMachine, {
    type: 'request',
    checkpoint: 'finale',
  })
  state = travelerJourneyReducer(state, { type: 'settle-requested' })
  assert.equal(state.phase, 'dancing')

  const replayed = travelerJourneyReducer(state, { type: 'replay' })
  assert.deepEqual(replayed, {
    phase: 'header',
    requestedIndex: -1,
    completedIndex: -1,
    generation: 1,
  })
})

test('reduced-motion settlement advances directly to the requested checkpoint', () => {
  let state = travelerJourneyReducer(initialJourneyMachine, {
    type: 'request',
    checkpoint: 'middle',
  })
  state = travelerJourneyReducer(state, { type: 'settle-requested' })
  assert.equal(state.phase, 'middle-settled')
  assert.equal(state.completedIndex, 2)
})

test('maximum journey scroll never reverses with upward or revisited scrolling', () => {
  let maximum = advanceMaximumJourneyScroll(0, 240)
  assert.equal(maximum, 240)
  maximum = advanceMaximumJourneyScroll(maximum, 80)
  assert.equal(maximum, 240)
  maximum = advanceMaximumJourneyScroll(maximum, 240)
  assert.equal(maximum, 240)
  maximum = advanceMaximumJourneyScroll(maximum, 460)
  assert.equal(maximum, 460)
})

test('segment progress is continuous, clamped, and requests only newly reached checkpoints', () => {
  const segments = {
    dates: { start: 10, end: 110 },
    hotels: { start: 210, end: 310 },
    middle: { start: 410, end: 510 },
    finale: { start: 610, end: 710 },
  } as const

  assert.equal(journeySegmentProgress(0, segments.dates), 0)
  assert.equal(journeySegmentProgress(60, segments.dates), 0.5)
  assert.equal(journeySegmentProgress(160, segments.dates), 1)
  assert.equal(highestRequestedCheckpointIndex(205, segments), 0)
  assert.equal(highestRequestedCheckpointIndex(455, segments), 2)
  assert.equal(highestRequestedCheckpointIndex(900, segments), 3)
})
