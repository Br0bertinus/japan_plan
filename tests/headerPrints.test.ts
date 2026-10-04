import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import {
  headerPrintRotationMs,
  headerPrints,
  nextHeaderPrintIndex,
} from '../src/headerPrints.ts'

test('header print rotation includes Fish, Cherry, Temple, and Fuji once each', () => {
  assert.deepEqual(
    headerPrints.map(({ id }) => id),
    ['fish', 'cherry', 'temple', 'fuji'],
  )
  assert.equal(new Set(headerPrints.map(({ src }) => src)).size, 4)
  assert.ok(headerPrintRotationMs >= 5000)
})

test('header print assets exist and use the shared paper-print filenames', () => {
  headerPrints.forEach(({ src }) => {
    assert.match(src, /^\/art\/header-[a-z]+-paper\.png$/)
    assert.equal(
      existsSync(new URL(`../public${src}`, import.meta.url)),
      true,
    )
  })
})

test('header print rotation advances deterministically and wraps to Fish', () => {
  assert.equal(nextHeaderPrintIndex(0), 1)
  assert.equal(nextHeaderPrintIndex(2), 3)
  assert.equal(nextHeaderPrintIndex(3), 0)
})

test('header print UI exposes only the accessible pause and resume control', () => {
  const appSource = readFileSync(
    new URL('../src/App.tsx', import.meta.url),
    'utf8',
  )
  assert.match(appSource, /Pause header prints/)
  assert.match(appSource, /Resume header prints/)
  assert.match(appSource, /aria-pressed=\{paused\}/)
  assert.doesNotMatch(appSource, /Choose opening print/)
  assert.doesNotMatch(appSource, /opening__print-controls/)
})

test('cherry and temple receive restrained per-print optical enlargement', () => {
  const cssSource = readFileSync(
    new URL('../src/App.css', import.meta.url),
    'utf8',
  )
  assert.match(
    cssSource,
    /\.opening__print-image--cherry\s*\{[^}]*scale\(1\.22\)/s,
  )
  assert.match(
    cssSource,
    /\.opening__print-image--temple\s*\{[^}]*scale\(1\.2\)/s,
  )
})
