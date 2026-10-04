import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import {
  anchoredNoteDocumentPosition,
  bringStickyNoteToFront,
  createStickyNote,
  deleteStickyNote,
  moveStickyNote,
  noteSectionIds,
  parseStickyNotesState,
  positionToRelative,
  reanchorStickyNote,
  restoreStickyNote,
  stickyNotesStorageKey,
  type NoteColor,
  type NoteSectionId,
  type StickyNote,
  type StickyNotesState,
} from './stickyNotesState'

const sectionLabels: Record<NoteSectionId, string> = {
  departure: 'Header',
  'travel-dates': 'Travel dates',
  tokyo: 'Tokyo hotel',
  'middle-route': 'Middle route',
  summary: 'Summary',
}

const noteColors: Array<{ id: NoteColor; label: string }> = [
  { id: 'yellow', label: 'Yellow' },
  { id: 'blush', label: 'Blush' },
  { id: 'sage', label: 'Sage' },
  { id: 'blue', label: 'Blue' },
]

type DragState = {
  noteId: string
  pointerId: number
  offsetX: number
  offsetY: number
  left: number
  top: number
  width: number
  height: number
}

type SectionGeometry = {
  element: HTMLElement
  rect: DOMRect
  documentOrigin: {
    x: number
    y: number
  }
}

function readState() {
  if (typeof window === 'undefined') return parseStickyNotesState(null)
  return parseStickyNotesState(window.localStorage.getItem(stickyNotesStorageKey))
}

function createNoteId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getSectionElement(sectionId: NoteSectionId) {
  const element = document.getElementById(sectionId)
  return element?.hasAttribute('data-note-section') ? element : null
}

function noteSize(note: StickyNote, section: HTMLElement) {
  return {
    width: Math.min(note.width, Math.max(180, section.clientWidth - 16)),
    height: Math.min(
      window.innerWidth <= 600 ? Math.max(note.height, 224) : note.height,
      Math.max(150, section.clientHeight - 16),
    ),
  }
}

function dominantSection(): NoteSectionId {
  const viewportHeight = window.innerHeight
  const best = noteSectionIds.reduce<{ id: NoteSectionId; score: number } | null>((current, id) => {
    const element = getSectionElement(id)
    if (!element) return current
    const rect = element.getBoundingClientRect()
    const visible = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0))
    const centerDistance = Math.abs((rect.top + rect.bottom) / 2 - viewportHeight / 2)
    const score = visible * 10 - centerDistance
    return !current || score > current.score ? { id, score } : current
  }, null)

  return best?.id ?? 'departure'
}

function sectionAt(clientY: number) {
  const sections = noteSectionIds.flatMap((id) => {
    const element = getSectionElement(id)
    return element ? [{ id, element, rect: element.getBoundingClientRect() }] : []
  })
  const direct = sections.find(({ rect }) => clientY >= rect.top && clientY <= rect.bottom)
  if (direct) return direct
  return sections.reduce<(typeof sections)[number] | null>((closest, section) => {
    const distance = Math.min(
      Math.abs(clientY - section.rect.top),
      Math.abs(clientY - section.rect.bottom),
    )
    if (!closest) return section
    const closestDistance = Math.min(
      Math.abs(clientY - closest.rect.top),
      Math.abs(clientY - closest.rect.bottom),
    )
    return distance < closestDistance ? section : closest
  }, null)
}

function sectionGeometry(sectionId: NoteSectionId): SectionGeometry | null {
  const element = getSectionElement(sectionId)
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return {
    element,
    rect,
    documentOrigin: {
      x: window.scrollX + rect.left,
      y: window.scrollY + rect.top,
    },
  }
}

export function StickyNotes() {
  const [state, setState] = useState<StickyNotesState>(readState)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [deletedNote, setDeletedNote] = useState<StickyNote | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [, setLayoutVersion] = useState(0)
  const textareaRefs = useRef(new Map<string, HTMLTextAreaElement>())
  const handleRefs = useRef(new Map<string, HTMLButtonElement>())
  const launcherRef = useRef<HTMLButtonElement>(null)
  const skipRaiseOnFocus = useRef<string | null>(null)
  const undoTimer = useRef<number | null>(null)

  useEffect(() => {
    window.localStorage.setItem(stickyNotesStorageKey, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    const onResize = () => setLayoutVersion((value) => value + 1)
    window.addEventListener('resize', onResize)
    const observer = new ResizeObserver(onResize)
    observer.observe(document.body)
    noteSectionIds.forEach((sectionId) => {
      const section = getSectionElement(sectionId)
      if (section) observer.observe(section)
    })
    return () => {
      window.removeEventListener('resize', onResize)
      observer.disconnect()
    }
  }, [])

  useEffect(
    () => () => {
      if (undoTimer.current) window.clearTimeout(undoTimer.current)
    },
    [],
  )

  const updateNote = (noteId: string, update: Partial<StickyNote>) => {
    setState((current) => ({
      ...current,
      notes: current.notes.map((note) => (note.id === noteId ? { ...note, ...update } : note)),
    }))
  }

  const raiseNote = (noteId: string) => {
    setState((current) => bringStickyNoteToFront(current, noteId))
  }

  const addNote = () => {
    const sectionId = dominantSection()
    const section = getSectionElement(sectionId)
    if (!section) return
    const id = createNoteId()
    const base = createStickyNote(id, sectionId, 0.04, 0.72, state.nextZ)
    const size = noteSize(base, section)
    const rect = section.getBoundingClientRect()
    const sectionNoteCount = state.notes.filter((note) => note.sectionId === sectionId).length
    const cascadeOffset = (sectionNoteCount % 5) * 28
    const desired = {
      x: Math.max(
        18,
        Math.min(section.clientWidth - size.width - 18, 28 + cascadeOffset),
      ),
      y: Math.min(
        section.clientHeight - size.height - 18,
        Math.max(
          18,
          window.innerHeight - size.height - 104 - rect.top + cascadeOffset,
        ),
      ),
    }
    const relative = positionToRelative(desired, {
      width: section.clientWidth,
      height: section.clientHeight,
    }, size)
    const note = { ...base, ...relative }
    setState((current) => ({
      version: 1,
      notes: [...current.notes, note],
      nextZ: current.nextZ + 1,
    }))
    setAnnouncement(`Note added to ${sectionLabels[sectionId]}.`)
    window.requestAnimationFrame(() => textareaRefs.current.get(id)?.focus())
  }

  const removeNote = (noteId: string) => {
    const noteIndex = state.notes.findIndex((candidate) => candidate.id === noteId)
    const note = state.notes[noteIndex]
    if (!note) return
    const remainingNotes = state.notes.filter((candidate) => candidate.id !== noteId)
    const focusNote =
      remainingNotes[Math.min(noteIndex, Math.max(0, remainingNotes.length - 1))] ?? null
    setState((current) => deleteStickyNote(current, noteId).state)
    setDeletedNote(note)
    if (undoTimer.current) window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setDeletedNote(null), 6000)
    setAnnouncement('Note deleted. Undo is available.')
    window.requestAnimationFrame(() => {
      if (focusNote) textareaRefs.current.get(focusNote.id)?.focus()
      else launcherRef.current?.focus()
    })
  }

  const undoDelete = () => {
    if (!deletedNote) return
    const note = deletedNote
    setState((current) => restoreStickyNote(current, note))
    setDeletedNote(null)
    if (undoTimer.current) window.clearTimeout(undoTimer.current)
    setAnnouncement(`Note restored to ${sectionLabels[note.sectionId]}.`)
    skipRaiseOnFocus.current = note.id
    window.requestAnimationFrame(() => {
      const textarea = textareaRefs.current.get(note.id)
      if (textarea) textarea.focus()
      else skipRaiseOnFocus.current = null
    })
  }

  const moveToSection = (noteId: string, direction: -1 | 1) => {
    const note = state.notes.find((candidate) => candidate.id === noteId)
    if (!note) return
    const currentIndex = noteSectionIds.indexOf(note.sectionId)
    const nextId = noteSectionIds[currentIndex + direction]
    if (!nextId) return
    updateNote(noteId, { sectionId: nextId, yRatio: direction > 0 ? 0.08 : 0.82 })
    setAnnouncement(`Note moved to ${sectionLabels[nextId]}.`)
    window.requestAnimationFrame(() => handleRefs.current.get(noteId)?.focus())
  }

  const moveWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    note: StickyNote,
  ) => {
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault()
      moveToSection(note.id, event.key === 'ArrowUp' ? -1 : 1)
      return
    }
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const section = getSectionElement(note.sectionId)
    if (!section) return
    const step = event.shiftKey ? 32 : 8
    const delta = {
      x: event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
      y: event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0,
    }
    const moved = moveStickyNote(
      note,
      delta,
      { width: section.clientWidth, height: section.clientHeight },
      noteSize(note, section),
    )
    updateNote(note.id, { xRatio: moved.xRatio, yRatio: moved.yRatio })
    setAnnouncement(`Note moved ${event.key.replace('Arrow', '').toLowerCase()}.`)
  }

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, note: StickyNote) => {
    const noteElement = event.currentTarget.closest<HTMLElement>('.sticky-note')
    if (!noteElement) return
    const rect = noteElement.getBoundingClientRect()
    event.currentTarget.setPointerCapture(event.pointerId)
    raiseNote(note.id)
    setDrag({
      noteId: note.id,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      left: window.scrollX + rect.left,
      top: window.scrollY + rect.top,
      width: rect.width,
      height: rect.height,
    })
    setAnnouncement('Moving note. Drag to another section or use the arrow keys.')
  }

  const continueDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.pointerId !== event.pointerId) return
    const left = Math.max(
      window.scrollX + 8,
      Math.min(
        window.scrollX + window.innerWidth - drag.width - 8,
        window.scrollX + event.clientX - drag.offsetX,
      ),
    )
    const top = Math.max(
      window.scrollY + 8,
      Math.min(
        window.scrollY + window.innerHeight - drag.height - 8,
        window.scrollY + event.clientY - drag.offsetY,
      ),
    )
    if (event.clientY < 54) window.scrollBy({ top: -18, behavior: 'auto' })
    if (event.clientY > window.innerHeight - 54) window.scrollBy({ top: 18, behavior: 'auto' })
    setDrag({ ...drag, left, top })
  }

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.pointerId !== event.pointerId) return
    const destination = sectionAt(event.clientY)
    const note = state.notes.find((candidate) => candidate.id === drag.noteId)
    if (!destination || !note) {
      setDrag(null)
      return
    }
    const size = { width: drag.width, height: drag.height }
    const moved = reanchorStickyNote(
      note,
      destination.id,
      {
        x: drag.left - (window.scrollX + destination.rect.left),
        y: drag.top - (window.scrollY + destination.rect.top),
      },
      { width: destination.element.clientWidth, height: destination.element.clientHeight },
      size,
    )
    updateNote(note.id, {
      sectionId: moved.sectionId,
      xRatio: moved.xRatio,
      yRatio: moved.yRatio,
    })
    setAnnouncement(`Note placed in ${sectionLabels[destination.id]}.`)
    setDrag(null)
    window.requestAnimationFrame(() => handleRefs.current.get(note.id)?.focus())
  }

  const renderNote = (note: StickyNote) => {
    const geometry = sectionGeometry(note.sectionId)
    if (!geometry) return null
    const size = noteSize(note, geometry.element)
    const position = anchoredNoteDocumentPosition(
      note,
      geometry.documentOrigin,
      { width: geometry.element.clientWidth, height: geometry.element.clientHeight },
      size,
    )
    const activeDrag = drag?.noteId === note.id ? drag : null
    const style = {
      left: activeDrag ? activeDrag.left : position.x,
      top: activeDrag ? activeDrag.top : position.y,
      width: activeDrag ? activeDrag.width : size.width,
      height: activeDrag ? activeDrag.height : size.height,
      zIndex: activeDrag ? undefined : note.z,
      '--note-rotation': activeDrag ? '0deg' : `${note.rotation}deg`,
    } as CSSProperties
    const sectionIndex = noteSectionIds.indexOf(note.sectionId)

    return (
      <article
        className={`sticky-note sticky-note--${note.color}${activeDrag ? ' is-dragging' : ''}`}
        data-sticky-note-id={note.id}
        key={note.id}
        style={style}
        onFocusCapture={() => {
          if (skipRaiseOnFocus.current === note.id) {
            skipRaiseOnFocus.current = null
            return
          }
          raiseNote(note.id)
        }}
      >
        <div className="sticky-note__toolbar">
          <button
            className="sticky-note__drag"
            type="button"
            aria-label={`Move note in ${sectionLabels[note.sectionId]}. Use arrow keys; Shift plus arrow moves farther; Alt plus up or down changes section.`}
            title="Drag note or use arrow keys"
            ref={(element) => {
              if (element) handleRefs.current.set(note.id, element)
              else handleRefs.current.delete(note.id)
            }}
            onKeyDown={(event) => moveWithKeyboard(event, note)}
            onPointerDown={(event) => startDrag(event, note)}
            onPointerMove={continueDrag}
            onPointerUp={finishDrag}
            onPointerCancel={() => {
              setDrag(null)
            }}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="8" cy="7" r="1.2" />
              <circle cx="16" cy="7" r="1.2" />
              <circle cx="8" cy="12" r="1.2" />
              <circle cx="16" cy="12" r="1.2" />
              <circle cx="8" cy="17" r="1.2" />
              <circle cx="16" cy="17" r="1.2" />
            </svg>
          </button>
          <span>{sectionLabels[note.sectionId]}</span>
          <div className="sticky-note__actions">
            <button
              className="sticky-note__delete"
              type="button"
              aria-label="Move note to previous section"
              title="Previous section"
              disabled={sectionIndex === 0}
              onClick={() => moveToSection(note.id, -1)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m7 14 5-5 5 5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Move note to next section"
              title="Next section"
              disabled={sectionIndex === noteSectionIds.length - 1}
              onClick={() => moveToSection(note.id, 1)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m7 10 5 5 5-5" />
              </svg>
            </button>
            <label>
              <span className="sr-only">Note color</span>
              <select
                aria-label="Note color"
                value={note.color}
                onChange={(event) =>
                  updateNote(note.id, { color: event.target.value as NoteColor })
                }
              >
                {noteColors.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              aria-label="Delete note"
              title="Delete note"
              onClick={() => removeNote(note.id)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M7 7h10M9 7V5h6v2m-7 0 1 12h6l1-12M10 10v6m4-6v6" />
              </svg>
            </button>
          </div>
        </div>
        <textarea
          aria-label={`Local note for ${sectionLabels[note.sectionId]}`}
          placeholder="Type a note..."
          maxLength={5000}
          value={note.text}
          ref={(element) => {
            if (element) textareaRefs.current.set(note.id, element)
            else textareaRefs.current.delete(note.id)
          }}
          onChange={(event) => updateNote(note.id, { text: event.target.value })}
        />
      </article>
    )
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="sticky-notes-layer" aria-label="Local planning notes">
        {state.notes.map((note) => renderNote(note))}
      </div>
      <button
        className="sticky-note-launcher"
        type="button"
        ref={launcherRef}
        aria-label="Add a local note. Notes are saved only in this browser."
        title="Add local note - saved only in this browser"
        onClick={addNote}
      >
        <svg aria-hidden="true" viewBox="0 0 32 32">
          <path d="M7 4.5h14.5L27 10v17.5H7z" />
          <path d="M21.5 4.5V10H27M11 14h12M11 18h12M11 22h7" />
          <path d="M23.5 21.5v7M20 25h7" />
        </svg>
      </button>

      {deletedNote && (
        <div className="sticky-note-undo" role="status">
          <span>Note deleted</span>
          <button type="button" onClick={undoDelete}>
            Undo
          </button>
        </div>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </>,
    document.body,
  )
}
