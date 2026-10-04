export const stickyNotesStorageKey = 'japan-trip-sticky-notes-v1'

export const noteSectionIds = [
  'departure',
  'travel-dates',
  'tokyo',
  'middle-route',
  'summary',
] as const

export type NoteSectionId = (typeof noteSectionIds)[number]
export type NoteColor = 'yellow' | 'blush' | 'sage' | 'blue'

export type StickyNote = {
  id: string
  text: string
  color: NoteColor
  sectionId: NoteSectionId
  xRatio: number
  yRatio: number
  width: number
  height: number
  z: number
  rotation: number
}

export type StickyNotesState = {
  version: 1
  notes: StickyNote[]
  nextZ: number
}

export type Point = { x: number; y: number }
export type Size = { width: number; height: number }

export const defaultNoteSize = { width: 240, height: 190 } as const
export const stickyNoteMargin = 20

const emptyStickyNotesState = (): StickyNotesState => ({
  version: 1,
  notes: [],
  nextZ: 1,
})

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value))

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseSectionId(value: unknown): NoteSectionId | null {
  if (value === 'fork') return 'summary'
  if (value === 'final-city') return 'middle-route'
  return noteSectionIds.includes(value as NoteSectionId) ? (value as NoteSectionId) : null
}

function parseColor(value: unknown): NoteColor {
  return ['yellow', 'blush', 'sage', 'blue'].includes(value as NoteColor)
    ? (value as NoteColor)
    : 'yellow'
}

export function rotationForNoteId(id: string) {
  let hash = 0
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return Math.round(((hash % 33) / 10 - 1.6) * 10) / 10
}

export function createStickyNote(
  id: string,
  sectionId: NoteSectionId,
  xRatio = 0.05,
  yRatio = 0.7,
  z = 1,
): StickyNote {
  return {
    id,
    text: '',
    color: 'yellow',
    sectionId,
    xRatio: clamp(xRatio, 0, 1),
    yRatio: clamp(yRatio, 0, 1),
    width: defaultNoteSize.width,
    height: defaultNoteSize.height,
    z,
    rotation: rotationForNoteId(id),
  }
}

export function parseStickyNotesState(raw: string | null): StickyNotesState {
  if (!raw) return emptyStickyNotesState()

  try {
    const parsed = JSON.parse(raw) as {
      version?: unknown
      notes?: unknown
      nextZ?: unknown
    }
    if (parsed.version !== 1 || !Array.isArray(parsed.notes)) {
      return emptyStickyNotesState()
    }

    const seenIds = new Set<string>()
    const notes = parsed.notes.flatMap((candidate) => {
      if (!candidate || typeof candidate !== 'object') return []
      const value = candidate as Record<string, unknown>
      const id = typeof value.id === 'string' ? value.id.trim() : ''
      const sectionId = parseSectionId(value.sectionId)
      if (!id || seenIds.has(id) || !sectionId) return []
      seenIds.add(id)

      return [
        {
          id,
          text: typeof value.text === 'string' ? value.text.slice(0, 5000) : '',
          color: parseColor(value.color),
          sectionId,
          xRatio: clamp(isFiniteNumber(value.xRatio) ? value.xRatio : 0.05, 0, 1),
          yRatio: clamp(isFiniteNumber(value.yRatio) ? value.yRatio : 0.7, 0, 1),
          width: clamp(
            isFiniteNumber(value.width) ? value.width : defaultNoteSize.width,
            180,
            360,
          ),
          height: clamp(
            isFiniteNumber(value.height) ? value.height : defaultNoteSize.height,
            150,
            420,
          ),
          z: Math.max(1, Math.round(isFiniteNumber(value.z) ? value.z : 1)),
          rotation: isFiniteNumber(value.rotation)
            ? clamp(value.rotation, -2, 2)
            : rotationForNoteId(id),
        },
      ]
    })

    const highestZ = notes.reduce((maximum, note) => Math.max(maximum, note.z), 0)
    return {
      version: 1,
      notes,
      nextZ: Math.max(
        highestZ + 1,
        Math.round(isFiniteNumber(parsed.nextZ) ? parsed.nextZ : 1),
      ),
    }
  } catch {
    return emptyStickyNotesState()
  }
}

export function clampNotePosition(
  point: Point,
  sectionSize: Size,
  noteSize: Size,
  margin = stickyNoteMargin,
): Point {
  const maximumX = Math.max(margin, sectionSize.width - noteSize.width - margin)
  const maximumY = Math.max(margin, sectionSize.height - noteSize.height - margin)
  return {
    x: clamp(point.x, margin, maximumX),
    y: clamp(point.y, margin, maximumY),
  }
}

export function relativeToPosition(
  note: Pick<StickyNote, 'xRatio' | 'yRatio'>,
  sectionSize: Size,
  noteSize: Size,
  margin = stickyNoteMargin,
): Point {
  const maximumX = Math.max(0, sectionSize.width - noteSize.width - margin * 2)
  const maximumY = Math.max(0, sectionSize.height - noteSize.height - margin * 2)
  return {
    x: margin + maximumX * clamp(note.xRatio, 0, 1),
    y: margin + maximumY * clamp(note.yRatio, 0, 1),
  }
}

export function anchoredNoteDocumentPosition(
  note: Pick<StickyNote, 'xRatio' | 'yRatio'>,
  sectionOrigin: Point,
  sectionSize: Size,
  noteSize: Size,
  margin = stickyNoteMargin,
): Point {
  const local = relativeToPosition(note, sectionSize, noteSize, margin)
  return {
    x: sectionOrigin.x + local.x,
    y: sectionOrigin.y + local.y,
  }
}

export function positionToRelative(
  point: Point,
  sectionSize: Size,
  noteSize: Size,
  margin = stickyNoteMargin,
) {
  const clamped = clampNotePosition(point, sectionSize, noteSize, margin)
  const travelX = Math.max(1, sectionSize.width - noteSize.width - margin * 2)
  const travelY = Math.max(1, sectionSize.height - noteSize.height - margin * 2)
  return {
    xRatio: clamp((clamped.x - margin) / travelX, 0, 1),
    yRatio: clamp((clamped.y - margin) / travelY, 0, 1),
  }
}

export function moveStickyNote(
  note: StickyNote,
  delta: Point,
  sectionSize: Size,
  noteSize: Size,
) {
  const current = relativeToPosition(note, sectionSize, noteSize)
  const relative = positionToRelative(
    { x: current.x + delta.x, y: current.y + delta.y },
    sectionSize,
    noteSize,
  )
  return { ...note, ...relative }
}

export function reanchorStickyNote(
  note: StickyNote,
  sectionId: NoteSectionId,
  point: Point,
  sectionSize: Size,
  noteSize: Size,
) {
  return {
    ...note,
    sectionId,
    ...positionToRelative(point, sectionSize, noteSize),
  }
}

export function bringStickyNoteToFront(state: StickyNotesState, noteId: string) {
  return {
    version: 1 as const,
    notes: state.notes.map((note) =>
      note.id === noteId ? { ...note, z: state.nextZ } : note,
    ),
    nextZ: state.nextZ + 1,
  }
}

export function deleteStickyNote(state: StickyNotesState, noteId: string) {
  const deleted = state.notes.find((note) => note.id === noteId) ?? null
  return {
    deleted,
    state: {
      ...state,
      notes: state.notes.filter((note) => note.id !== noteId),
    },
  }
}

export function restoreStickyNote(state: StickyNotesState, note: StickyNote) {
  if (state.notes.some((candidate) => candidate.id === note.id)) return state
  return {
    version: 1 as const,
    notes: [...state.notes, note],
    nextZ: Math.max(state.nextZ, note.z + 1),
  }
}
