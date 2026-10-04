export const journeyCheckpoints = ['dates', 'hotels', 'middle', 'finale'] as const

export type JourneyCheckpoint = (typeof journeyCheckpoints)[number]
export type JourneyPhase =
  | 'header'
  | 'traveling-to-dates'
  | 'dates-settled'
  | 'traveling-to-hotels'
  | 'hotels-settled'
  | 'traveling-to-middle'
  | 'middle-settled'
  | 'traveling-to-finale'
  | 'dancing'

export type JourneyMachine = Readonly<{
  phase: JourneyPhase
  requestedIndex: number
  completedIndex: number
  generation: number
}>

export type JourneyScrollSegment = Readonly<{
  start: number
  end: number
}>

export type JourneyAction =
  | Readonly<{ type: 'request'; checkpoint: JourneyCheckpoint }>
  | Readonly<{ type: 'start-next' }>
  | Readonly<{ type: 'complete'; checkpoint: JourneyCheckpoint }>
  | Readonly<{ type: 'settle-requested' }>
  | Readonly<{ type: 'replay' }>

const travelingPhases = [
  'traveling-to-dates',
  'traveling-to-hotels',
  'traveling-to-middle',
  'traveling-to-finale',
] as const satisfies readonly JourneyPhase[]

const settledPhases = [
  'dates-settled',
  'hotels-settled',
  'middle-settled',
  'dancing',
] as const satisfies readonly JourneyPhase[]

export const initialJourneyMachine: JourneyMachine = {
  phase: 'header',
  requestedIndex: -1,
  completedIndex: -1,
  generation: 0,
}

export function checkpointIndex(checkpoint: JourneyCheckpoint) {
  return journeyCheckpoints.indexOf(checkpoint)
}

export function travelingPhase(checkpoint: JourneyCheckpoint) {
  return travelingPhases[checkpointIndex(checkpoint)]
}

export function settledPhase(checkpoint: JourneyCheckpoint) {
  return settledPhases[checkpointIndex(checkpoint)]
}

export function journeyIsTraveling(phase: JourneyPhase) {
  return travelingPhases.includes(phase as (typeof travelingPhases)[number])
}

export function phaseCheckpoint(phase: JourneyPhase): JourneyCheckpoint | null {
  const travelingIndex = travelingPhases.indexOf(
    phase as (typeof travelingPhases)[number],
  )
  if (travelingIndex >= 0) return journeyCheckpoints[travelingIndex]
  const settledIndex = settledPhases.indexOf(
    phase as (typeof settledPhases)[number],
  )
  return settledIndex >= 0 ? journeyCheckpoints[settledIndex] : null
}

export function travelerJourneyReducer(
  state: JourneyMachine,
  action: JourneyAction,
): JourneyMachine {
  if (action.type === 'request') {
    const requestedIndex = checkpointIndex(action.checkpoint)
    if (requestedIndex <= state.requestedIndex) return state
    return { ...state, requestedIndex }
  }

  if (action.type === 'start-next') {
    if (
      journeyIsTraveling(state.phase) ||
      state.completedIndex >= state.requestedIndex ||
      state.completedIndex >= journeyCheckpoints.length - 1
    ) {
      return state
    }

    const nextIndex = state.completedIndex + 1
    return { ...state, phase: travelingPhases[nextIndex] }
  }

  if (action.type === 'complete') {
    const index = checkpointIndex(action.checkpoint)
    if (state.phase !== travelingPhases[index] || index !== state.completedIndex + 1) {
      return state
    }
    return {
      ...state,
      completedIndex: index,
      phase: settledPhases[index],
    }
  }

  if (action.type === 'settle-requested') {
    if (state.requestedIndex <= state.completedIndex) return state
    return {
      ...state,
      completedIndex: state.requestedIndex,
      phase: settledPhases[state.requestedIndex],
    }
  }

  if (action.type === 'replay') {
    return {
      ...initialJourneyMachine,
      generation: state.generation + 1,
    }
  }

  return state
}

export function checkpointWasCompleted(
  completedIndex: number,
  checkpoint: JourneyCheckpoint,
) {
  return completedIndex >= checkpointIndex(checkpoint)
}

export function isTravelingTo(
  phase: JourneyPhase,
  checkpoint: JourneyCheckpoint,
) {
  return phase === travelingPhase(checkpoint)
}

export function advanceMaximumJourneyScroll(current: number, candidate: number) {
  return Math.max(current, candidate)
}

export function journeySegmentProgress(
  maximumScroll: number,
  segment: JourneyScrollSegment,
) {
  if (maximumScroll <= segment.start) return 0
  if (maximumScroll >= segment.end) return 1
  return (maximumScroll - segment.start) / Math.max(1, segment.end - segment.start)
}

export function highestRequestedCheckpointIndex(
  maximumScroll: number,
  segments: Record<JourneyCheckpoint, JourneyScrollSegment>,
) {
  let requestedIndex = -1
  journeyCheckpoints.forEach((checkpoint, index) => {
    if (journeySegmentProgress(maximumScroll, segments[checkpoint]) > 0) {
      requestedIndex = index
    }
  })
  return requestedIndex
}
