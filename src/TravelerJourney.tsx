import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'motion/react'
import { scenePropModels, type ScenePoint, type ScenePropId } from './scenePropModel'
import { TravelerFigure } from './TravelerAvatar'
import {
  travelerOrder,
  travelerProfiles,
} from './travelerChoreography'
import {
  TravelerJourneyContext,
  type TravelerJourneyContextValue,
} from './travelerJourneyContext'
import {
  initialJourneyMachine,
  advanceMaximumJourneyScroll,
  highestRequestedCheckpointIndex,
  journeySegmentProgress,
  journeyCheckpoints,
  journeyIsTraveling,
  phaseCheckpoint,
  travelerJourneyReducer,
  type JourneyCheckpoint,
  type JourneyPhase,
  type JourneyScrollSegment,
} from './travelerJourneyState'

type DocumentPoint = Readonly<{ x: number; y: number }>

type JourneySegmentGeometry = JourneyScrollSegment &
  Readonly<{
    starts: readonly DocumentPoint[]
    ends: readonly DocumentPoint[]
  }>

type JourneyGeometry = Readonly<{
  segments: Record<JourneyCheckpoint, JourneySegmentGeometry>
  documentHeight: number
}>

function scenePointToDocument(scene: ScenePropId, point: ScenePoint): DocumentPoint | null {
  const svg = document.querySelector<SVGSVGElement>(`[data-scene-prop="${scene}"]`)
  if (!svg) return null
  const rect = svg.getBoundingClientRect()
  const [viewX, viewY, viewWidth, viewHeight] = scenePropModels[scene].viewBox
  return {
    x: rect.left + window.scrollX + ((point.x - viewX) / viewWidth) * rect.width,
    y: rect.top + window.scrollY + ((point.y - viewY) / viewHeight) * rect.height,
  }
}

function spreadPoint(point: DocumentPoint, index: number): DocumentPoint {
  return {
    x: point.x + (index - 1.5) * 18,
    y: point.y + (index % 2 === 0 ? -5 : 5),
  }
}

function elementDocumentBottom(element: Element) {
  const rect = element.getBoundingClientRect()
  return rect.bottom + window.scrollY
}

function stageDepartureScroll(stage: Element, minimum: number) {
  const section =
    stage.closest<HTMLElement>('[data-note-section]') ??
    stage.closest<HTMLElement>('section') ??
    stage
  return Math.max(
    minimum,
    elementDocumentBottom(section) - window.innerHeight * 0.78,
  )
}

function arrivalScroll(point: DocumentPoint, minimum: number) {
  return Math.max(minimum, point.y - window.innerHeight * 0.43)
}

function corridorDeparturePoint(
  source: DocumentPoint,
  scrollStart: number,
  travelerIndex: number,
) {
  return spreadPoint(
    {
      x: source.x,
      y: scrollStart + window.innerHeight * 0.44,
    },
    travelerIndex,
  )
}

function measureGeometry(): JourneyGeometry | null {
  const headerFigures = [
    ...document.querySelectorAll<HTMLElement>('[data-journey-origin] .avatar'),
  ]
  const datesStage = document.querySelector<HTMLElement>(
    '[data-section-stage="airplane"]',
  )
  const hotelsStage = document.querySelector<HTMLElement>(
    '[data-section-stage="beds"]',
  )
  const middleStage = document.querySelector<HTMLElement>(
    '[data-section-stage="onsen"]',
  )
  if (headerFigures.length !== 4) return null

  const headerPoints = headerFigures.map((element) => {
    const rect = element.getBoundingClientRect()
    return {
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY + rect.height * 0.84,
    }
  })

  const datesEntry = scenePointToDocument('airplane', scenePropModels.airplane.anchors.entry)
  const datesExit = scenePointToDocument('airplane', scenePropModels.airplane.anchors.exit)
  const hotelsEntry = scenePointToDocument('beds', scenePropModels.beds.anchors.entry)
  const hotelsExit = scenePointToDocument('beds', scenePropModels.beds.anchors.exit)
  const middleEntry = scenePointToDocument('onsen', scenePropModels.onsen.anchors.entry)
  const middleExit = scenePointToDocument('onsen', scenePropModels.onsen.anchors.exit)
  const finaleSlots = travelerOrder.map((traveler) => {
    const element = document.querySelector<HTMLElement>(
      `[data-finale-slot="${traveler}"]`,
    )
    if (!element) return null
    const rect = element.getBoundingClientRect()
    return {
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY + rect.height * 0.88,
    }
  })

  if (
    !datesStage ||
    !hotelsStage ||
    !middleStage ||
    !datesEntry ||
    !datesExit ||
    !hotelsEntry ||
    !hotelsExit ||
    !middleEntry ||
    !middleExit ||
    finaleSlots.some((point) => point === null)
  ) {
    return null
  }

  const documentHeight = document.documentElement.scrollHeight
  const maximumDocumentScroll = Math.max(0, documentHeight - window.innerHeight)
  const capScroll = (value: number) => Math.min(maximumDocumentScroll, value)
  const datesStart = 2
  const datesEnd = capScroll(arrivalScroll(datesEntry, datesStart + 160))
  const hotelsStart = capScroll(stageDepartureScroll(datesStage, datesEnd + 120))
  const hotelsEnd = capScroll(arrivalScroll(hotelsEntry, hotelsStart + 180))
  const middleStart = capScroll(stageDepartureScroll(hotelsStage, hotelsEnd + 120))
  const middleEnd = capScroll(arrivalScroll(middleEntry, middleStart + 180))
  const finaleStart = capScroll(stageDepartureScroll(middleStage, middleEnd + 120))
  const finaleCenter = (finaleSlots as DocumentPoint[]).reduce(
    (total, point) => total + point.y,
    0,
  ) / finaleSlots.length
  const finaleEnd = capScroll(
    Math.max(finaleStart + 180, finaleCenter - window.innerHeight * 0.48),
  )

  return {
    segments: {
      dates: {
        start: datesStart,
        end: datesEnd,
        starts: headerPoints,
        ends: travelerOrder.map((_, index) => spreadPoint(datesEntry, index)),
      },
      hotels: {
        start: hotelsStart,
        end: hotelsEnd,
        starts: travelerOrder.map((_, index) =>
          corridorDeparturePoint(datesExit, hotelsStart, index),
        ),
        ends: travelerOrder.map((_, index) => spreadPoint(hotelsEntry, index)),
      },
      middle: {
        start: middleStart,
        end: middleEnd,
        starts: travelerOrder.map((_, index) =>
          corridorDeparturePoint(hotelsExit, middleStart, index),
        ),
        ends: travelerOrder.map((_, index) => spreadPoint(middleEntry, index)),
      },
      finale: {
        start: finaleStart,
        end: finaleEnd,
        starts: travelerOrder.map((_, index) =>
          corridorDeparturePoint(middleExit, finaleStart, index),
        ),
        ends: finaleSlots as DocumentPoint[],
      },
    },
    documentHeight,
  }
}

function easeJourneyProgress(progress: number) {
  return progress * progress * (3 - 2 * progress)
}

function travelerSegmentProgress(progress: number, index: number) {
  const stagger = index * 0.018
  return Math.min(1, Math.max(0, (progress - stagger) / (1 - stagger)))
}

function transitPoint(
  segment: JourneySegmentGeometry,
  progress: number,
  index: number,
) {
  const travelerProgress = easeJourneyProgress(
    travelerSegmentProgress(progress, index),
  )
  const start = segment.starts[index]
  const end = segment.ends[index]
  const arc = Math.sin(Math.PI * travelerProgress)
  return {
    x:
      start.x +
      (end.x - start.x) * travelerProgress +
      arc * (22 + index * 5),
    y:
      start.y +
      (end.y - start.y) * travelerProgress -
      arc * (18 + index * 4),
  }
}

function TravelerTransitOverlay({
  phase,
  geometry,
  progress,
  progressing,
  reducedMotion,
}: {
  phase: JourneyPhase
  geometry: JourneyGeometry | null
  progress: number
  progressing: boolean
  reducedMotion: boolean
}) {
  if (!geometry || reducedMotion || !journeyIsTraveling(phase) || progress >= 0.995) {
    return null
  }
  const checkpoint = phaseCheckpoint(phase)
  if (!checkpoint) return null
  const segment = geometry.segments[checkpoint]

  return createPortal(
    <div
      className="traveler-transit-layer"
      style={{ height: `${geometry.documentHeight}px` }}
      data-journey-transit={checkpoint}
      data-journey-transit-progress={progress.toFixed(3)}
      aria-hidden="true"
    >
      {travelerOrder.map((traveler, index) => {
        const point = transitPoint(segment, progress, index)
        const opacity = progress > 0.93 ? Math.max(0, (0.995 - progress) / 0.065) : 1

        return (
          <div
            className={`traveler-transit__traveler ${
              progressing ? 'is-progressing' : ''
            }`}
            data-transit-traveler={traveler}
            data-transit-checkpoint={checkpoint}
            style={{
              transform: `translate3d(${point.x}px, ${point.y}px, 0)`,
              opacity,
            }}
            key={`${checkpoint}-${traveler}`}
          >
            <svg
              className="traveler-transit__figure"
              viewBox="-40 -70 80 150"
              focusable="false"
            >
              <TravelerFigure
                traveler={traveler}
                color={travelerProfiles[traveler].color}
              />
            </svg>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}

export function TravelerJourneyProvider({ children }: { children: ReactNode }) {
  const [machine, dispatch] = useReducer(
    travelerJourneyReducer,
    initialJourneyMachine,
  )
  const [geometry, setGeometry] = useState<JourneyGeometry | null>(null)
  const [maximumJourneyScroll, setMaximumJourneyScroll] = useState(0)
  const [journeyProgressing, setJourneyProgressing] = useState(false)
  const reducedMotion = Boolean(useReducedMotion())
  const replayLockRef = useRef(false)
  const geometryRef = useRef<JourneyGeometry | null>(null)
  const maximumJourneyScrollRef = useRef(0)
  const scrollFrameRef = useRef<number | null>(null)
  const settleTimerRef = useRef<number | null>(null)

  const refreshGeometry = useCallback(() => {
    const nextGeometry = measureGeometry()
    if (nextGeometry) {
      geometryRef.current = nextGeometry
      setGeometry(nextGeometry)
    }
  }, [])

  const requestFromMaximum = useCallback((maximumScroll: number) => {
    const currentGeometry = geometryRef.current
    if (!currentGeometry) return
    const index = highestRequestedCheckpointIndex(
      maximumScroll,
      currentGeometry.segments,
    )
    if (index >= 0) {
      dispatch({ type: 'request', checkpoint: journeyCheckpoints[index] })
    }
  }, [])

  const publishMaximumScroll = useCallback(() => {
    scrollFrameRef.current = null
    if (replayLockRef.current) return
    const nextMaximum = advanceMaximumJourneyScroll(
      maximumJourneyScrollRef.current,
      window.scrollY,
    )
    if (nextMaximum <= maximumJourneyScrollRef.current + 0.5) return

    maximumJourneyScrollRef.current = nextMaximum
    setMaximumJourneyScroll(nextMaximum)
    setJourneyProgressing(true)
    requestFromMaximum(nextMaximum)

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current)
    }
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null
      setJourneyProgressing(false)
    }, 150)
  }, [requestFromMaximum])

  const handleJourneyScroll = useCallback(() => {
    if (replayLockRef.current || scrollFrameRef.current !== null) return
    scrollFrameRef.current = window.requestAnimationFrame(publishMaximumScroll)
  }, [publishMaximumScroll])

  useLayoutEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- Geometry only exists after the staged DOM mounts.
    refreshGeometry()
  }, [refreshGeometry])

  useEffect(() => {
    const handleResize = () => {
      refreshGeometry()
      requestFromMaximum(maximumJourneyScrollRef.current)
    }
    window.addEventListener('scroll', handleJourneyScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleJourneyScroll)
      window.removeEventListener('resize', handleResize)
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current)
      }
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current)
      }
    }
  }, [handleJourneyScroll, refreshGeometry, requestFromMaximum])

  useEffect(() => {
    if (machine.requestedIndex <= machine.completedIndex) return
    if (reducedMotion) {
      // eslint-disable-next-line react/set-state-in-effect -- Reduced motion settles the queued external scroll request immediately.
      dispatch({ type: 'settle-requested' })
      return
    }
    if (!journeyIsTraveling(machine.phase)) {
      // eslint-disable-next-line react/set-state-in-effect -- Geometry must refresh before starting the requested cross-section transition.
      refreshGeometry()
      // eslint-disable-next-line react/set-state-in-effect -- The reducer serializes the next externally requested scroll checkpoint.
      dispatch({ type: 'start-next' })
    }
  }, [
    machine.completedIndex,
    machine.phase,
    machine.requestedIndex,
    reducedMotion,
    refreshGeometry,
  ])

  useEffect(() => {
    document.documentElement.dataset.journeyPhase = machine.phase
    return () => {
      delete document.documentElement.dataset.journeyPhase
    }
  }, [machine.phase])

  const completeCheckpoint = useCallback((checkpoint: JourneyCheckpoint) => {
    dispatch({ type: 'complete', checkpoint })
  }, [])

  const replayJourney = useCallback(() => {
    replayLockRef.current = true
    maximumJourneyScrollRef.current = 0
    setMaximumJourneyScroll(0)
    setJourneyProgressing(false)
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current)
      settleTimerRef.current = null
    }
    dispatch({ type: 'replay' })
    const target = document.querySelector<HTMLElement>('#departure')
    target?.focus({ preventScroll: true })
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    })

    let frameCount = 0
    const releaseReplayLock = () => {
      frameCount += 1
      if (window.scrollY <= 2 || frameCount > 180) {
        replayLockRef.current = false
        refreshGeometry()
        return
      }
      window.requestAnimationFrame(releaseReplayLock)
    }
    window.requestAnimationFrame(releaseReplayLock)
  }, [reducedMotion, refreshGeometry])

  const progressByCheckpoint = useMemo(
    () =>
      Object.fromEntries(
        journeyCheckpoints.map((checkpoint) => [
          checkpoint,
          geometry
            ? journeySegmentProgress(
                maximumJourneyScroll,
                geometry.segments[checkpoint],
              )
            : 0,
        ]),
      ) as Record<JourneyCheckpoint, number>,
    [geometry, maximumJourneyScroll],
  )

  useEffect(() => {
    if (
      machine.phase === 'traveling-to-finale' &&
      progressByCheckpoint.finale >= 0.995
    ) {
      // eslint-disable-next-line react/set-state-in-effect -- The finale has no prop-local handoff, so arrival completes the last checkpoint.
      dispatch({ type: 'complete', checkpoint: 'finale' })
    }
  }, [machine.phase, progressByCheckpoint.finale])

  const value = useMemo<TravelerJourneyContextValue>(
    () => ({
      phase: machine.phase,
      completedIndex: machine.completedIndex,
      generation: machine.generation,
      reducedMotion,
      progressByCheckpoint,
      journeyProgressing,
      completeCheckpoint,
      replayJourney,
    }),
    [
      completeCheckpoint,
      machine.completedIndex,
      machine.generation,
      machine.phase,
      reducedMotion,
      progressByCheckpoint,
      journeyProgressing,
      replayJourney,
    ],
  )

  return (
    <TravelerJourneyContext.Provider value={value}>
      {children}
      <TravelerTransitOverlay
        phase={machine.phase}
        geometry={geometry}
        progress={
          phaseCheckpoint(machine.phase)
            ? progressByCheckpoint[phaseCheckpoint(machine.phase)!]
            : 0
        }
        progressing={journeyProgressing}
        reducedMotion={reducedMotion}
      />
    </TravelerJourneyContext.Provider>
  )
}
