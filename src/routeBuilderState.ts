export const middleStopIds = [
  'lake-nojiri',
  'family-location',
  'shirahone',
  'okuhida',
] as const

export type MiddleStopId = (typeof middleStopIds)[number]
export type DrivingEndId = 'kyoto' | 'tokyo-station'

export type MiddleRouteState = {
  version: 1
  stopIds: MiddleStopId[]
  endId: DrivingEndId | null
}

type RoutePairLike = {
  distanceKm: number
  durationMinutes: number
  svgPath?: string
}

export function parseMiddleRouteState(value: string | null): MiddleRouteState {
  try {
    const parsed = JSON.parse(value ?? 'null') as {
      version?: unknown
      stopIds?: unknown
      endId?: unknown
    } | null
    const stopIds = Array.isArray(parsed?.stopIds)
      ? parsed.stopIds.filter(
          (id, index, values): id is MiddleStopId =>
            middleStopIds.includes(id as MiddleStopId) && values.indexOf(id) === index,
        )
      : []
    const endId =
      parsed?.endId === 'kyoto' || parsed?.endId === 'tokyo-station' ? parsed.endId : null
    return { version: 1, stopIds, endId }
  } catch {
    return { version: 1, stopIds: [], endId: null }
  }
}

export function addMiddleStop(
  stopIds: readonly MiddleStopId[],
  stopId: MiddleStopId,
): MiddleStopId[] {
  return stopIds.includes(stopId) ? [...stopIds] : [...stopIds, stopId]
}

export function removeMiddleStop(
  stopIds: readonly MiddleStopId[],
  stopId: MiddleStopId,
): MiddleStopId[] {
  return stopIds.filter((candidate) => candidate !== stopId)
}

export function moveMiddleStop(
  stopIds: readonly MiddleStopId[],
  stopId: MiddleStopId,
  direction: -1 | 1,
): MiddleStopId[] {
  const index = stopIds.indexOf(stopId)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= stopIds.length) return [...stopIds]
  const nextStopIds = [...stopIds]
  ;[nextStopIds[index], nextStopIds[nextIndex]] = [
    nextStopIds[nextIndex],
    nextStopIds[index],
  ]
  return nextStopIds
}

export function partitionMiddleStops(stopIds: readonly MiddleStopId[]) {
  const selected = middleStopIds.filter((stopId) => stopIds.includes(stopId))
  const unselected = middleStopIds.filter((stopId) => !stopIds.includes(stopId))
  return { selected, unselected }
}

export function composeRoute<TNodeId extends string, TPair extends RoutePairLike>(
  startNodeId: TNodeId,
  stopIds: readonly TNodeId[],
  endNodeId: TNodeId | null,
  pairs: Record<string, TPair>,
) {
  const sequence = [startNodeId, ...stopIds, ...(endNodeId ? [endNodeId] : [])]
  const legs = sequence.slice(0, -1).map((fromId, index) => {
    const toId = sequence[index + 1]
    return { fromId, toId, pair: pairs[`${fromId}__${toId}`] }
  })

  return {
    sequence,
    legs,
    complete: Boolean(endNodeId && legs.every((leg) => leg.pair)),
    totalDistance: legs.reduce((total, leg) => total + (leg.pair?.distanceKm ?? 0), 0),
    totalMinutes: legs.reduce((total, leg) => total + (leg.pair?.durationMinutes ?? 0), 0),
  }
}
