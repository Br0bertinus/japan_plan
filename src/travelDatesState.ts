export const stayRangeStorageKey = 'japan-trip-japan-stay-v1'

const earliestDate = '2027-05-01'
const latestDate = '2027-06-30'

export type StayRange = {
  version: 1
  checkIn: string | null
  checkOut: string | null
}

export const createEmptyStayRange = (): StayRange => ({
  version: 1,
  checkIn: null,
  checkOut: null,
})

function isAllowedDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value >= earliestDate &&
    value <= latestDate
  )
}

export function readStoredStayRange(): StayRange {
  if (typeof window === 'undefined') return createEmptyStayRange()

  try {
    const parsed = JSON.parse(window.localStorage.getItem(stayRangeStorageKey) ?? 'null') as {
      version?: unknown
      checkIn?: unknown
      checkOut?: unknown
    } | null
    if (!parsed || parsed.version !== 1) return createEmptyStayRange()

    const checkIn = isAllowedDate(parsed.checkIn) ? parsed.checkIn : null
    const checkOut = isAllowedDate(parsed.checkOut) ? parsed.checkOut : null
    if (checkIn && checkOut && checkOut <= checkIn) return createEmptyStayRange()

    return { version: 1, checkIn, checkOut }
  } catch {
    return createEmptyStayRange()
  }
}

export function formatStayRange(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T12:00:00Z`)
  const end = new Date(`${checkOut}T12:00:00Z`)
  const sameMonth = checkIn.slice(0, 7) === checkOut.slice(0, 7)
  const startText = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(start)
  const endText = new Intl.DateTimeFormat('en-US', {
    month: sameMonth ? undefined : 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(end)
  return `${startText}–${endText}`
}

export function countNights(checkIn: string, checkOut: string) {
  const start = Date.parse(`${checkIn}T00:00:00Z`)
  const end = Date.parse(`${checkOut}T00:00:00Z`)
  return Math.round((end - start) / 86_400_000)
}
