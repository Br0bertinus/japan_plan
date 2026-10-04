export type MapRect = {
  x: number
  y: number
  width: number
  height: number
}

export type TokyoLabelCandidate = {
  id: string
  ownerId?: string
  priority: number
  rect: MapRect
  required?: boolean
}

export type TokyoLabelObstacle = {
  id: string
  priority: number
  rect: MapRect
}

type TokyoLabelLayoutOptions = {
  bounds: MapRect
  candidates: readonly TokyoLabelCandidate[]
  obstacles?: readonly TokyoLabelObstacle[]
  collisionPadding?: number
  edgePadding?: number
  obstaclePadding?: number
}

const expandRect = (rect: MapRect, amount: number): MapRect => ({
  x: rect.x - amount,
  y: rect.y - amount,
  width: rect.width + amount * 2,
  height: rect.height + amount * 2,
})

const rectsOverlap = (a: MapRect, b: MapRect) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y

const rectFitsBounds = (rect: MapRect, bounds: MapRect, edgePadding: number) =>
  rect.x >= bounds.x + edgePadding &&
  rect.y >= bounds.y + edgePadding &&
  rect.x + rect.width <= bounds.x + bounds.width - edgePadding &&
  rect.y + rect.height <= bounds.y + bounds.height - edgePadding

export const selectTokyoMapLabels = ({
  bounds,
  candidates,
  obstacles = [],
  collisionPadding = 4,
  edgePadding = 8,
  obstaclePadding = 2,
}: TokyoLabelLayoutOptions) => {
  const accepted = new Set<string>()
  const occupied: MapRect[] = []
  const sortedCandidates = [...candidates].sort(
    (a, b) => Number(Boolean(b.required)) - Number(Boolean(a.required)) ||
      b.priority - a.priority ||
      a.id.localeCompare(b.id),
  )

  sortedCandidates.forEach((candidate) => {
    const paddedRect = expandRect(candidate.rect, collisionPadding)
    if (!rectFitsBounds(paddedRect, bounds, edgePadding)) return

    const overlapsObstacle = obstacles.some(
      (obstacle) =>
        obstacle.id !== candidate.ownerId &&
        obstacle.priority >= candidate.priority &&
        rectsOverlap(paddedRect, expandRect(obstacle.rect, obstaclePadding)),
    )
    const overlapsAcceptedLabel = occupied.some((rect) => rectsOverlap(paddedRect, rect))

    if (!candidate.required && (overlapsObstacle || overlapsAcceptedLabel)) return

    accepted.add(candidate.id)
    occupied.push(paddedRect)
  })

  return accepted
}

export const equalLabelSets = (
  first: ReadonlySet<string> | null,
  second: ReadonlySet<string>,
) => {
  if (!first || first.size !== second.size) return false
  return [...first].every((value) => second.has(value))
}
