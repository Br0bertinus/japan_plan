import { useEffect, useMemo, useState } from 'react'
import {
  countNights,
  createEmptyStayRange,
  formatStayRange,
  readStoredStayRange,
  stayRangeStorageKey,
  type StayRange,
} from './travelDatesState'
import { TravelerSceneStage } from './TravelerScenes'

const supersededTravelDatesStorageKey = 'japan-trip-travel-dates-v1'

const calendarMonths = [
  { monthIndex: 4, label: 'May' },
  { monthIndex: 5, label: 'June' },
] as const

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

type SelectionStep = 'check-in' | 'check-out' | 'complete'

const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

function initialSelectionStep(range: StayRange): SelectionStep {
  if (!range.checkIn) return 'check-in'
  if (!range.checkOut) return 'check-out'
  return 'complete'
}

function formatFullDate(date: string) {
  return fullDateFormatter.format(new Date(`${date}T12:00:00Z`))
}

function formatShortDate(date: string) {
  return shortDateFormatter.format(new Date(`${date}T12:00:00Z`))
}

function getCalendarDates(monthIndex: number) {
  const firstDay = new Date(Date.UTC(2027, monthIndex, 1))
  const lastDay = new Date(Date.UTC(2027, monthIndex + 1, 0)).getUTCDate()
  const cells: Array<string | null> = Array(firstDay.getUTCDay()).fill(null)

  for (let day = 1; day <= lastDay; day += 1) {
    cells.push(`2027-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function StayCalendar({
  monthIndex,
  monthLabel,
  range,
  selectionStep,
  onSelectDate,
}: {
  monthIndex: number
  monthLabel: string
  range: StayRange
  selectionStep: SelectionStep
  onSelectDate: (date: string) => void
}) {
  const cells = useMemo(() => getCalendarDates(monthIndex), [monthIndex])
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  )
  const requestedDate =
    selectionStep === 'check-in'
      ? 'hotel check-in'
      : selectionStep === 'check-out'
        ? 'hotel check-out'
        : null

  return (
    <table className="date-calendar stay-calendar">
      <caption>
        <strong>{monthLabel}</strong>
        <span>2027</span>
      </caption>
      <thead>
        <tr>
          {weekdayLabels.map((weekday) => (
            <th scope="col" key={weekday}>
              {weekday}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, weekIndex) => (
          <tr key={`${monthLabel}-${weekIndex}`}>
            {week.map((date, dayIndex) => {
              if (!date) {
                return <td className="date-calendar__blank" key={`blank-${dayIndex}`} />
              }

              const isCheckIn = range.checkIn === date
              const isCheckOut = range.checkOut === date
              const isStayNight =
                Boolean(range.checkIn && range.checkOut) &&
                date >= range.checkIn! &&
                date < range.checkOut!
              const isInsideRange =
                Boolean(range.checkIn && range.checkOut) &&
                date > range.checkIn! &&
                date < range.checkOut!
              const stateDescription = isCheckIn
                ? 'Selected hotel check-in.'
                : isCheckOut
                  ? 'Selected hotel check-out; this date is not counted as a hotel night.'
                  : isStayNight
                    ? 'Selected hotel night.'
                    : ''

              return (
                <td
                  key={date}
                  className={[
                    isCheckIn ? 'is-check-in' : '',
                    isCheckOut ? 'is-check-out' : '',
                    isStayNight ? 'is-stay-night' : '',
                    isInsideRange ? 'is-inside-range' : '',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    disabled={selectionStep === 'complete'}
                    onClick={() => onSelectDate(date)}
                    aria-label={`${formatFullDate(date)}. ${stateDescription} ${
                      requestedDate ? `Select as ${requestedDate}.` : 'Use Edit dates to change the range.'
                    }`}
                  >
                    <span className="date-calendar__day">{Number(date.slice(-2))}</span>
                    {(isCheckIn || isCheckOut) && (
                      <span className="date-calendar__range-label" aria-hidden="true">
                        {isCheckIn ? 'IN' : 'OUT'}
                      </span>
                    )}
                  </button>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function TravelDatesScene() {
  const [range, setRange] = useState<StayRange>(readStoredStayRange)
  const [selectionStep, setSelectionStep] = useState<SelectionStep>(() =>
    initialSelectionStep(readStoredStayRange()),
  )
  const [error, setError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    window.localStorage.removeItem(supersededTravelDatesStorageKey)
    window.localStorage.setItem(stayRangeStorageKey, JSON.stringify(range))
    window.dispatchEvent(new CustomEvent<StayRange>('japan-stay-change', { detail: range }))
  }, [range])

  function selectDate(date: string) {
    if (selectionStep === 'complete') return

    if (selectionStep === 'check-in') {
      setRange({ version: 1, checkIn: date, checkOut: null })
      setSelectionStep('check-out')
      setError(null)
      setAnnouncement(
        `Hotel check-in set to ${formatFullDate(date)}. Next calendar click sets hotel check-out.`,
      )
      return
    }

    if (!range.checkIn) {
      setSelectionStep('check-in')
      setError('Choose a hotel check-in date first.')
      setAnnouncement('Date not set. Choose a hotel check-in date first.')
      return
    }

    if (date <= range.checkIn) {
      const message = `Check-out must be after ${formatShortDate(range.checkIn)}. Choose a later date.`
      setError(message)
      setAnnouncement(`Date not set. ${message}`)
      return
    }

    const nextRange = { version: 1 as const, checkIn: range.checkIn, checkOut: date }
    const nights = countNights(nextRange.checkIn, date)
    setRange(nextRange)
    setSelectionStep('complete')
    setError(null)
    setAnnouncement(
      `Japan hotel stay set to ${formatStayRange(nextRange.checkIn, date)}, ${nights} nights.`,
    )
  }

  function editRange() {
    setSelectionStep('check-in')
    setError(null)
    setAnnouncement('Editing the Japan stay range. Next calendar click sets hotel check-in.')
  }

  function resetRange() {
    setRange(createEmptyStayRange())
    setSelectionStep('check-in')
    setError(null)
    setAnnouncement('Japan stay range reset. Next calendar click sets hotel check-in.')
  }

  const nights =
    range.checkIn && range.checkOut ? countNights(range.checkIn, range.checkOut) : null
  const prompt =
    selectionStep === 'check-in'
      ? 'Choose check-in'
      : selectionStep === 'check-out'
        ? 'Choose check-out'
        : 'Dates selected'

  return (
    <section
      className="travel-dates scene"
      id="travel-dates"
      data-decision="travel-dates"
      data-note-section
      aria-labelledby="travel-dates-title"
    >
      <div className="travel-dates__inner">
        <header className="scene-heading scene-heading--staged">
          <span className="station-stamp">1 · TRAVEL DATES</span>
          <div className="scene-heading__copy">
            <h2 id="travel-dates-title">When should we be in Japan?</h2>
            <p>Choose Japan hotel check-in and check-out.</p>
          </div>
          <TravelerSceneStage scene="airplane" />
        </header>

        <section className="stay-range-controls" aria-labelledby="stay-range-status-title">
          <div>
            <h3 id="stay-range-status-title">{prompt}</h3>
            <p>
              {selectionStep === 'check-in' && 'Arrival in Japan.'}
              {selectionStep === 'check-out' &&
                `Check-in: ${formatShortDate(range.checkIn!)}.`}
              {selectionStep === 'complete' &&
                `${nights} ${nights === 1 ? 'hotel night' : 'hotel nights'}.`}
            </p>
          </div>
          <dl>
            <div>
              <dt>Check-in</dt>
              <dd>{range.checkIn ? formatShortDate(range.checkIn) : 'Not selected'}</dd>
            </div>
            <div>
              <dt>Check-out</dt>
              <dd>{range.checkOut ? formatShortDate(range.checkOut) : 'Not selected'}</dd>
            </div>
          </dl>
          <div className="stay-range-actions">
            <button type="button" onClick={editRange} disabled={!range.checkIn}>
              Edit dates
            </button>
            <button type="button" onClick={resetRange} disabled={!range.checkIn && !range.checkOut}>
              Reset
            </button>
          </div>
        </section>

        {error && (
          <p className="stay-range-error" role="alert">
            {error}
          </p>
        )}

        <div className="calendar-instructions">
          <div className="stay-range-key" aria-label="Selected range key">
            <span><i>IN</i>First hotel night</span>
            <span><i>OUT</i>Departure date · not a hotel night</span>
          </div>
        </div>

        <div className="date-calendars">
          {calendarMonths.map((month) => (
            <StayCalendar
              key={month.label}
              monthIndex={month.monthIndex}
              monthLabel={month.label}
              range={range}
              selectionStep={selectionStep}
              onSelectDate={selectDate}
            />
          ))}
        </div>

        <output className={`stay-range-result ${range.checkIn && range.checkOut ? 'is-selected' : ''}`} aria-live="polite">
          <strong>Japan hotel stay</strong>
          {range.checkIn && range.checkOut && nights !== null ? (
            <>
              <span>
                {formatStayRange(range.checkIn, range.checkOut)} · {nights}{' '}
                {nights === 1 ? 'night' : 'nights'}
              </span>
            </>
          ) : (
            <span>Not selected</span>
          )}
        </output>

        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </div>
    </section>
  )
}
