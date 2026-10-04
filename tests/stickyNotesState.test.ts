import assert from 'node:assert/strict'
import test from 'node:test'
import {
  anchoredNoteDocumentPosition,
  bringStickyNoteToFront,
  clampNotePosition,
  createStickyNote,
  deleteStickyNote,
  moveStickyNote,
  parseStickyNotesState,
  positionToRelative,
  reanchorStickyNote,
  relativeToPosition,
  restoreStickyNote,
} from '../src/stickyNotesState.ts'

const sectionSize = { width: 1000, height: 800 }
const noteSize = { width: 240, height: 190 }

test('creates multiple independent notes with deterministic appearance', () => {
  const first = createStickyNote('note-a', 'departure')
  const second = createStickyNote('note-b', 'tokyo', 0.4, 0.3, 2)

  assert.notEqual(first.id, second.id)
  assert.equal(first.sectionId, 'departure')
  assert.equal(second.sectionId, 'tokyo')
  assert.equal(createStickyNote('note-a', 'summary').rotation, first.rotation)
})

test('parses versioned state defensively and migrates obsolete section anchors', () => {
  const parsed = parseStickyNotesState(
    JSON.stringify({
      version: 1,
      notes: [
        {
          id: 'saved-note',
          text: 'draft',
          color: 'sage',
          sectionId: 'fork',
          xRatio: 4,
          yRatio: -2,
          width: 999,
          height: 20,
          z: 5,
        },
        { id: 'saved-note', sectionId: 'tokyo' },
        { id: '', sectionId: 'tokyo' },
      ],
      nextZ: 2,
    }),
  )

  assert.equal(parsed.notes.length, 1)
  assert.equal(parsed.notes[0].sectionId, 'summary')
  assert.equal(parsed.notes[0].xRatio, 1)
  assert.equal(parsed.notes[0].yRatio, 0)
  assert.equal(parsed.notes[0].width, 360)
  assert.equal(parsed.notes[0].height, 150)
  assert.equal(parsed.nextZ, 6)
  assert.deepEqual(parseStickyNotesState('{bad json'), {
    version: 1,
    notes: [],
    nextZ: 1,
  })
})

test('position conversion stays within desktop and narrow mobile bounds', () => {
  const desktop = clampNotePosition({ x: 1200, y: -40 }, sectionSize, noteSize)
  assert.deepEqual(desktop, { x: 740, y: 20 })

  const mobileSection = { width: 320, height: 620 }
  const mobileNote = { width: 280, height: 190 }
  const mobile = clampNotePosition({ x: 999, y: 999 }, mobileSection, mobileNote)
  assert.deepEqual(mobile, { x: 20, y: 410 })

  const relative = positionToRelative(mobile, mobileSection, mobileNote)
  assert.deepEqual(relativeToPosition(relative, mobileSection, mobileNote), mobile)
})

test('keyboard movement clamps and shift-sized movement uses the same helper', () => {
  const note = createStickyNote('move-note', 'travel-dates', 0.5, 0.5)
  const smallMove = moveStickyNote(note, { x: 8, y: 0 }, sectionSize, noteSize)
  const largeMove = moveStickyNote(note, { x: 32, y: 0 }, sectionSize, noteSize)

  assert.ok(largeMove.xRatio > smallMove.xRatio)
  assert.equal(moveStickyNote(note, { x: -9999, y: -9999 }, sectionSize, noteSize).xRatio, 0)
  assert.equal(moveStickyNote(note, { x: 9999, y: 9999 }, sectionSize, noteSize).yRatio, 1)
})

test('re-anchoring preserves the drop point within the destination section', () => {
  const note = createStickyNote('anchor-note', 'tokyo')
  const moved = reanchorStickyNote(
    note,
    'middle-route',
    { x: 420, y: 260 },
    sectionSize,
    noteSize,
  )
  assert.equal(moved.sectionId, 'middle-route')
  const restored = relativeToPosition(moved, sectionSize, noteSize)
  assert.ok(Math.abs(restored.x - 420) < 0.001)
  assert.ok(Math.abs(restored.y - 260) < 0.001)
})

test('global overlay position combines the section document origin with the stored anchor', () => {
  const note = createStickyNote('overlay-note', 'tokyo', 0.5, 0.25)
  const local = relativeToPosition(note, sectionSize, noteSize)
  const documentPosition = anchoredNoteDocumentPosition(
    note,
    { x: 140, y: 2200 },
    sectionSize,
    noteSize,
  )

  assert.deepEqual(documentPosition, {
    x: 140 + local.x,
    y: 2200 + local.y,
  })
})

test('delete supports persistence and undo with the original note state', () => {
  const note = createStickyNote('undo-note', 'summary')
  const state = { version: 1 as const, notes: [note], nextZ: 3 }
  const removed = deleteStickyNote(state, note.id)

  assert.equal(removed.state.notes.length, 0)
  assert.equal(removed.deleted?.id, note.id)
  assert.equal(parseStickyNotesState(JSON.stringify(removed.state)).notes.length, 0)

  const restored = restoreStickyNote(removed.state, removed.deleted!)
  assert.equal(restored.notes.length, 1)
  assert.deepEqual(restored.notes[0], note)
  assert.equal(restored.nextZ, 3)
})

test('first, middle, and last notes can each be deleted and restored without losing siblings', () => {
  const notes = [
    createStickyNote('first-note', 'departure', 0.1, 0.1, 1),
    createStickyNote('middle-note', 'tokyo', 0.4, 0.4, 2),
    createStickyNote('last-note', 'summary', 0.7, 0.7, 3),
  ]

  for (const noteId of ['first-note', 'middle-note', 'last-note']) {
    const original = { version: 1 as const, notes, nextZ: 4 }
    const removed = deleteStickyNote(original, noteId)
    assert.equal(removed.state.notes.length, 2)
    assert.equal(removed.state.notes.some((note) => note.id === noteId), false)
    assert.deepEqual(
      removed.state.notes.map((note) => note.id),
      notes.filter((note) => note.id !== noteId).map((note) => note.id),
    )

    const restored = restoreStickyNote(removed.state, removed.deleted!)
    assert.equal(restored.notes.length, 3)
    assert.deepEqual(restored.notes.at(-1), removed.deleted)

    const deletedAgain = deleteStickyNote(restored, noteId)
    assert.equal(deletedAgain.state.notes.length, 2)
    assert.equal(deletedAgain.deleted?.id, noteId)
  }
})

test('stale undo data cannot duplicate an existing note', () => {
  const note = createStickyNote('stale-note', 'tokyo')
  const state = { version: 1 as const, notes: [note], nextZ: 4 }
  assert.deepEqual(restoreStickyNote(state, note), state)
})

test('focus stacking raises only the active note', () => {
  const first = createStickyNote('first', 'departure', 0, 0, 1)
  const second = createStickyNote('second', 'departure', 0.5, 0.5, 2)
  const raised = bringStickyNoteToFront(
    { version: 1, notes: [first, second], nextZ: 5 },
    first.id,
  )

  assert.equal(raised.notes.find((note) => note.id === first.id)?.z, 5)
  assert.equal(raised.notes.find((note) => note.id === second.id)?.z, 2)
  assert.equal(raised.nextZ, 6)
})
