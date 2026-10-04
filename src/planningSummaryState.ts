import type { DrivingEndId } from './routeBuilderState'

export function buildRouteSequence(
  startName: string,
  stopNames: string[],
  endName: string | null,
) {
  return [startName, ...stopNames, ...(endName ? [endName] : [])]
}

export function getStillToDecide({
  datesComplete,
  hotelSelected,
  endId,
  routeComplete,
}: {
  datesComplete: boolean
  hotelSelected: boolean
  endId: DrivingEndId | null
  routeComplete: boolean
}) {
  const decisions: string[] = []
  if (!datesComplete) decisions.push('Travel dates')
  if (!hotelSelected) decisions.push('Tokyo hotel')
  if (!endId) decisions.push('Final city')
  else if (!routeComplete) decisions.push('Complete route estimate')
  return decisions
}
