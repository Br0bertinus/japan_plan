import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { formatDistanceMiles, kilometersToMiles } from '../src/distance.ts'

test('converts source kilometers to miles without false precision', () => {
  assert.ok(Math.abs(kilometersToMiles(1.609344) - 1) < 0.000001)
  assert.equal(formatDistanceMiles(8.8), '5.5 mi')
  assert.equal(formatDistanceMiles(139), '86 mi')
  assert.equal(formatDistanceMiles(0), '0 mi')
})

test('active public interface sources contain no visible kilometer labels', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const dates = readFileSync(new URL('../src/TravelDatesScene.tsx', import.meta.url), 'utf8')
  const activeMap = readFileSync(
    new URL('../public/maps/central-japan-concept-map.svg', import.meta.url),
    'utf8',
  )
  const publicText = `${app}\n${dates}\n${activeMap}`

  assert.doesNotMatch(publicText, /(?:\d|\s)(?:km|kilometers?)\b/i)
})
