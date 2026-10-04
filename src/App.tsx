import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import './App.css'
import { TravelerAvatar } from './TravelerAvatar'
import { TravelDatesScene } from './TravelDatesScene'
import { TravelerFinale, TravelerSceneStage } from './TravelerScenes'
import { TravelerJourneyProvider } from './TravelerJourney'
import { useTravelerJourney } from './travelerJourneyContext'
import { travelerOrder, travelerProfiles } from './travelerChoreography'
import {
  headerPrintRotationMs,
  headerPrints,
  nextHeaderPrintIndex,
} from './headerPrints'
import centralJapanDrivingRoutes from './data/central-japan-driving-routes.json'
import centralJapanMapPoints from './data/central-japan-map-points.json'
import { formatDistanceMiles } from './distance'
import { buildRouteSequence, getStillToDecide } from './planningSummaryState'
import { StickyNotes } from './StickyNotes'
import {
  equalLabelSets,
  selectTokyoMapLabels,
  type MapRect,
  type TokyoLabelCandidate,
  type TokyoLabelObstacle,
} from './tokyoLabelLayout'
import {
  countNights,
  formatStayRange,
  readStoredStayRange,
  type StayRange,
} from './travelDatesState'
import {
  addMiddleStop,
  composeRoute,
  moveMiddleStop,
  parseMiddleRouteState,
  partitionMiddleStops,
  removeMiddleStop,
  type DrivingEndId,
  type MiddleRouteState,
  type MiddleStopId,
} from './routeBuilderState'
import {
  tokyoContextPaths,
  tokyoRailRoutes,
  tokyoRailStations,
  tokyoStayHotels,
  tokyoStayStations,
  tokyoWardMapViews,
  tokyoWards,
} from './data/tokyoWardMap'

const stops = [
  { id: 'travel-dates', short: 'Dates', label: 'Travel dates' },
  { id: 'tokyo', short: 'Hotel', label: 'Tokyo hotel' },
  { id: 'middle-route', short: 'Middle', label: 'Middle-of-trip route' },
  { id: 'final-city', short: 'Final', label: 'Final city' },
]

const planningAgendaItems = [
  {
    id: 'travel-dates',
    title: 'Travel dates',
    note: 'Choose Japan hotel stay dates',
  },
  {
    id: 'tokyo',
    title: 'Tokyo hotel',
    note: 'Choose experience and hotel',
  },
  {
    id: 'middle-route',
    title: 'Middle-of-trip route',
    note: 'Choose and order stops',
  },
  {
    id: 'final-city',
    title: 'Final city',
    note: 'Kyoto or Tokyo',
  },
] as const

const travelers = travelerOrder.map((traveler) => ({
  name: travelerProfiles[traveler].name,
  traveler,
  color: travelerProfiles[traveler].color,
}))

const tokyoWardLabelOffsets: Record<string, { x: number; y: number }> = {
  '13101': { x: -62, y: -25 },
  '13102': { x: 64, y: 26 },
  '13103': { x: 30, y: 35 },
  '13104': { x: -72, y: -10 },
  '13106': { x: 62, y: -23 },
  '13108': { x: 76, y: 22 },
  '13109': { x: 18, y: 43 },
  '13110': { x: -70, y: 27 },
  '13113': { x: -76, y: 15 },
  '13116': { x: -28, y: -31 },
}

type TokyoRailRouteId = (typeof tokyoRailRoutes)[number]['id']
const tokyoMapZoomLevels = [
  { label: 100 },
  { label: 140 },
  { label: 180 },
  { label: 220 },
] as const
const tokyoMapDefaultZoomIndex = 0
type TokyoStayHotelId = (typeof tokyoStayHotels)[number]['id']

const tokyoStayPaths = [
  {
    id: 'central',
    code: 'A',
    title: 'Central / iconic Tokyo splurge',
    short: 'Central & iconic',
    thesis:
      'Three distinct central bases: quiet West Shinjuku, Kabukicho entertainment access, or Toranomon.',
    hotelIds: ['park-hyatt-tokyo', 'hotel-groove-shinjuku', 'hotel-toranomon-hills'],
    criteria: [
      ['Atmosphere', 'Quiet high-rise, entertainment district, or Toranomon'],
      ['Transit', 'JR, Metro, Toei, and Seibu access varies by hotel'],
      ['Evenings', 'Kabukicho is busiest; West Shinjuku is quieter'],
      ['Local wandering', 'Each hotel has a meaningfully different immediate area'],
      ['Hotel role', 'Three splurge options with different settings'],
    ],
  },
  {
    id: 'retreat',
    code: 'B',
    title: 'Lower-key neighborhood retreat',
    short: 'Neighborhood retreat',
    thesis:
      'Two lower-key bases: park-side Tomigaya near central Shibuya, or residential Daita near Shimokitazawa.',
    hotelIds: ['trunk-hotel-yoyogi-park', 'yuen-bettei-daita'],
    criteria: [
      ['Atmosphere', 'Park-side Tomigaya or more residential Daita'],
      ['Transit', 'Closer Shibuya context or west-side private-rail access'],
      ['Evenings', 'Local-feeling in both; Daita is the quieter choice'],
      ['Local wandering', 'Yoyogi Park and Tomigaya or Daita and Shimokitazawa'],
      ['Hotel role', 'Two distinct versions of a lower-key Tokyo stay'],
    ],
  },
] as const

type TokyoStayPathId = (typeof tokyoStayPaths)[number]['id']

type CuratedHotelImage = {
  src: string
  alt: string
  credit?: string
}

type TokyoHotelPlanningProfile = {
  mapRead: string
  stationRead: string
  pros: readonly string[]
  tradeoffs: readonly string[]
  officialWebsiteUrl: string
  image?: CuratedHotelImage
}

const tokyoHotelPlanningNotes: Record<
  TokyoStayHotelId,
  TokyoHotelPlanningProfile
> = {
  'park-hyatt-tokyo': {
    mapRead: 'West Shinjuku, west of the station core and inside Shinjuku Ward.',
    stationRead: 'Tochomae on the Toei Oedo Line, with Shinjuku as the major interchange context.',
    pros: [
      'Top luxury option in this group.',
      'Points option for us.',
      'Strong destination-hotel splurge experience.',
    ],
    tradeoffs: [
      'West Shinjuku feels more business-focused.',
      'Less immediate nightlife and less convenient station access than HOTEL GROOVE.',
    ],
    officialWebsiteUrl: 'https://www.hyatt.com/park-hyatt/en-US/tyoph-park-hyatt-tokyo',
  },
  'hotel-groove-shinjuku': {
    mapRead: 'Kabukicho in Shinjuku Ward, northeast of the main Shinjuku Station complex.',
    stationRead:
      'Seibu-Shinjuku is the closest published access point; Shinjuku provides JR, Metro, Odakyu, and Keio context.',
    pros: [
      'Best transit-plus-nightlife location in this group.',
      'Puts us in the middle of Shinjuku activity.',
    ],
    tradeoffs: [
      'Kabukicho is busy and high-energy, not a quiet retreat.',
      'May feel less like the trip’s top luxury splurge than Park Hyatt.',
    ],
    officialWebsiteUrl: 'https://www.hotelgroove.jp/en/',
  },
  'hotel-toranomon-hills': {
    mapRead: 'Toranomon in Minato Ward, south of the Imperial Palace and east of Roppongi.',
    stationRead: 'Direct connection to Toranomon Hills Station on the Tokyo Metro Hibiya Line.',
    pros: [
      'Points option for us.',
      'Better transit-line access and immediate surroundings than Park Hyatt for this trip.',
      'Central position works well for moving around Tokyo.',
    ],
    tradeoffs: [
      'A step down from Park Hyatt in the top-luxury, destination-hotel experience Kate is comparing.',
    ],
    officialWebsiteUrl:
      'https://www.hyatt.com/unbound-collection/en-US/tyoub-hotel-toranomon-hills',
  },
  'yuen-bettei-daita': {
    mapRead: 'Daita in Setagaya Ward, near Shimokitazawa.',
    stationRead:
      'Setagaya-Daita is on the Odakyu Line; Shimokitazawa adds Odakyu and Keio Inokashira access.',
    pros: [
      'Strongest neighborhood-retreat experience in the group.',
      'Daita and Shimokitazawa support local evenings and a slower home-base feel.',
      'The hot-spring-inn experience makes the stay part of the trip.',
    ],
    tradeoffs: [
      'Farther from central and east Tokyo sights; cross-city travel takes more planning.',
      'Less convenient when the priority is maximizing major sightseeing connections.',
    ],
    officialWebsiteUrl: 'https://www.uds-hotels.com/en/yuenbettei/daita/',
  },
  'trunk-hotel-yoyogi-park': {
    mapRead: 'Tomigaya in Shibuya Ward, across Inokashira Street from Yoyogi Park.',
    stationRead:
      'Yoyogi-Koen provides Tokyo Metro Chiyoda Line context; Shibuya is the broader interchange reference to the southeast.',
    pros: [
      'Lower-key Tomigaya and Yoyogi Park setting while remaining near Shibuya.',
      'Balances neighborhood atmosphere, park access, and reasonable central-city access.',
    ],
    tradeoffs: [
      'Not as transit-convenient as the major central interchange options.',
      'Less “Tokyo at your doorstep” than HOTEL GROOVE or Toranomon Hills.',
    ],
    officialWebsiteUrl: 'https://yoyogipark.trunk-hotel.com/en',
  },
}

const tokyoStayStorageKey = 'japan-trip-tokyo-stay'

const tokyoStationLabelOffsets: Record<
  string,
  { x: number; y: number; anchor: 'start' | 'middle' | 'end' }
> = {
  shinjuku: { x: -15, y: 18, anchor: 'end' },
  shibuya: { x: -15, y: 19, anchor: 'end' },
  ikebukuro: { x: -12, y: -14, anchor: 'end' },
  ueno: { x: 12, y: -12, anchor: 'start' },
  asakusa: { x: 12, y: 17, anchor: 'start' },
  akihabara: { x: 12, y: 17, anchor: 'start' },
  'tokyo-otemachi': { x: 15, y: -13, anchor: 'start' },
  ginza: { x: 17, y: 18, anchor: 'start' },
  roppongi: { x: -14, y: -14, anchor: 'end' },
  shinagawa: { x: 12, y: 20, anchor: 'start' },
}

const tokyoStayStationLabelOffsets: Record<
  string,
  { x: number; y: number; anchor: 'start' | 'middle' | 'end' }
> = {
  tochomae: { x: -12, y: -12, anchor: 'end' },
  'seibu-shinjuku': { x: 13, y: 18, anchor: 'start' },
  'toranomon-hills': { x: 13, y: -12, anchor: 'start' },
  'setagaya-daita': { x: -12, y: 17, anchor: 'end' },
  shimokitazawa: { x: 13, y: -12, anchor: 'start' },
  'yoyogi-koen': { x: -13, y: -12, anchor: 'end' },
}

const tokyoHotelLabelOffsets: Record<
  TokyoStayHotelId,
  { x: number; y: number; anchor: 'start' | 'end' }
> = {
  'park-hyatt-tokyo': { x: -16, y: 24, anchor: 'end' },
  'hotel-groove-shinjuku': { x: 16, y: -19, anchor: 'start' },
  'hotel-toranomon-hills': { x: 16, y: 24, anchor: 'start' },
  'yuen-bettei-daita': { x: -16, y: 27, anchor: 'end' },
  'trunk-hotel-yoyogi-park': { x: 16, y: -18, anchor: 'start' },
}

const tokyoHotelMapLabels: Record<TokyoStayHotelId, string> = {
  'park-hyatt-tokyo': 'PARK HYATT',
  'hotel-groove-shinjuku': 'HOTEL GROOVE',
  'hotel-toranomon-hills': 'TORANOMON HILLS',
  'yuen-bettei-daita': 'YUEN DAITA',
  'trunk-hotel-yoyogi-park': 'TRUNK YOYOGI PARK',
}

function readStoredTokyoStay(): TokyoStayHotelId | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(tokyoStayStorageKey)
  return tokyoStayHotels.some((hotel) => hotel.id === stored)
    ? (stored as TokyoStayHotelId)
    : null
}

const centralJapanMapAsset = '/maps/central-japan-concept-map.svg'
type DrivingNodeId = keyof typeof centralJapanDrivingRoutes.nodes
type DrivingNode =
  (typeof centralJapanDrivingRoutes.nodes)[keyof typeof centralJapanDrivingRoutes.nodes]
type DrivingPair =
  (typeof centralJapanDrivingRoutes.pairs)[keyof typeof centralJapanDrivingRoutes.pairs]

const middleRouteStorageKey = 'japan-trip-middle-route-v1'
const drivingPairs = centralJapanDrivingRoutes.pairs as Record<string, DrivingPair>
const drivingNodes = centralJapanDrivingRoutes.nodes as Record<string, DrivingNode>
const middleStopLocations = Object.fromEntries(
  centralJapanMapPoints.locations.map((location) => [location.id, location]),
) as Record<MiddleStopId, (typeof centralJapanMapPoints.locations)[number]>

function readStoredMiddleRoute(): MiddleRouteState {
  if (typeof window === 'undefined') return { version: 1, stopIds: [], endId: null }
  return parseMiddleRouteState(window.localStorage.getItem(middleRouteStorageKey))
}

function formatDrivingDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours > 0 ? `${hours} hr ${remainder ? `${remainder} min` : ''}`.trim() : `${minutes} min`
}

function RouteRail({
  activeSection,
  progress,
}: {
  activeSection: string
  progress: number
}) {
  return (
    <aside className="route-rail" aria-label="Planning decisions">
      <a className="route-rail__brand" href="#departure" aria-label="Back to the beginning">
        <span>JPN</span>
        <b>2027</b>
      </a>
      <div className="route-rail__track" aria-hidden="true">
        <span style={{ transform: `scaleY(${progress})` }} />
      </div>
      <nav>
        {stops.map((stop) => (
          <a
            key={stop.id}
            href={`#${stop.id}`}
            className={activeSection === stop.id ? 'is-active' : ''}
            aria-current={activeSection === stop.id ? 'location' : undefined}
          >
            <i />
            <span>{stop.short}</span>
            <em>{stop.label}</em>
          </a>
        ))}
      </nav>
      <span className="route-rail__status">{Math.round(progress * 100)}%</span>
    </aside>
  )
}

function OpeningScene() {
  const { phase } = useTravelerJourney()
  const travelersAtHeader = phase === 'header'

  return (
    <section
      className="opening scene"
      id="departure"
      tabIndex={-1}
      data-decision="travel-dates"
      data-note-section
      data-mode="walk"
      aria-labelledby="opening-title"
    >
      <OpeningPrintRotator />
      <div className="opening__mobile-brand" aria-hidden="true">
        <span>JPN</span>
        <b>2027</b>
      </div>
      <div className="opening__content">
        <h1 id="opening-title">
          JAPAN
          <span>October 4 Team Meeting</span>
        </h1>
        <div
          className={`traveler-lineup ${travelersAtHeader ? 'is-present' : 'has-departed'}`}
          data-journey-origin
          aria-label="Travelers"
          aria-hidden={!travelersAtHeader}
        >
          {travelers.map((traveler) => (
            <TravelerAvatar key={traveler.name} {...traveler} compact showName />
          ))}
        </div>
      </div>
      <div className="opening__guide">
        <aside className="opening__agenda" aria-labelledby="opening-agenda-title">
          <header>
            <h2 id="opening-agenda-title">AGENDA</h2>
            <p>Four decisions for this call.</p>
          </header>
          <nav aria-label="Four planning decisions">
            <ol>
              {planningAgendaItems.map((item, index) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>
                    <span>{index + 1}</span>
                    <strong>{item.title}</strong>
                    <small>{item.note}</small>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>
      <a className="scroll-cue" href="#travel-dates">
        <span>Next: Travel dates</span>
        <i aria-hidden="true" />
      </a>
    </section>
  )
}

function OpeningPrintRotator() {
  const reducedMotion = Boolean(useReducedMotion())
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const activePrint = headerPrints[activeIndex]
  const automaticallyRotating = !reducedMotion && !paused && pageVisible

  useEffect(() => {
    const handleVisibilityChange = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (!automaticallyRotating) return
    const timer = window.setTimeout(() => {
      setActiveIndex((currentIndex) => nextHeaderPrintIndex(currentIndex))
    }, headerPrintRotationMs)
    return () => window.clearTimeout(timer)
  }, [activeIndex, automaticallyRotating])

  return (
    <figure
      className="opening__print"
      data-active-print={activePrint.id}
      data-print-rotation={automaticallyRotating ? 'playing' : 'paused'}
    >
      <div
        className="opening__print-art"
        role="img"
        aria-label={activePrint.description}
      >
        {headerPrints.map((print, index) => (
          <img
            className={`opening__print-image opening__print-image--${print.id}${
              index === activeIndex ? ' is-active' : ''
            }`}
            src={print.src}
            alt=""
            width="1455"
            height="812"
            aria-hidden="true"
            decoding="async"
            fetchPriority={index === 0 ? 'high' : 'auto'}
            key={print.id}
          />
        ))}
      </div>
      {!reducedMotion && (
        <button
          className="opening__print-toggle"
          type="button"
          aria-label={paused ? 'Resume header prints' : 'Pause header prints'}
          aria-pressed={paused}
          title={paused ? 'Resume header prints' : 'Pause header prints'}
          onClick={() => setPaused((current) => !current)}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            {paused ? (
              <path d="M4.25 2.4 13 8l-8.75 5.6z" />
            ) : (
              <>
                <rect x="3.25" y="2.5" width="3.4" height="11" />
                <rect x="9.35" y="2.5" width="3.4" height="11" />
              </>
            )}
          </svg>
        </button>
      )}
    </figure>
  )
}

function TokyoMap({
  activePathId,
  activeHotelId,
  onHotelSelect,
}: {
  activePathId: TokyoStayPathId
  activeHotelId: TokyoStayHotelId | null
  onHotelSelect: (hotelId: TokyoStayHotelId) => void
}) {
  const focusWards = tokyoWards.filter((ward) => ward.focus)
  const viewportRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const reduceMotion = useReducedMotion()
  const [activeRouteId, setActiveRouteId] = useState<TokyoRailRouteId | null>(null)
  const [zoomIndex, setZoomIndex] = useState(tokyoMapDefaultZoomIndex)
  const [visibleMapLabelIds, setVisibleMapLabelIds] = useState<ReadonlySet<string> | null>(null)
  const baseRoutes = tokyoRailRoutes.filter((route) => route.category === 'base')
  const priorityRoutes = baseRoutes.filter((route) => route.priority)
  const contextRoutes = baseRoutes.filter((route) => !route.priority)
  const hotelAccessRoutes = tokyoRailRoutes.filter((route) => route.category === 'hotel-access')
  const activeRoute = tokyoRailRoutes.find((route) => route.id === activeRouteId)
  const activePath = tokyoStayPaths.find((path) => path.id === activePathId) ?? tokyoStayPaths[0]
  const activeHotel = tokyoStayHotels.find((hotel) => hotel.id === activeHotelId)
  const focusedHotels = activeHotel
    ? [activeHotel]
    : tokyoStayHotels.filter((hotel) => hotel.pathId === activePathId)
  const focusedWardCodes = new Set<string>(focusedHotels.map((hotel) => hotel.wardCode))
  const focusedRouteIds = new Set<string>(focusedHotels.flatMap((hotel) => [...hotel.routeIds]))
  const focusedStationIds = new Set<string>(
    focusedHotels.flatMap((hotel) => [...hotel.stationIds]),
  )
  const zoom = tokyoMapZoomLevels[zoomIndex]
  const activeView = tokyoWardMapViews.overview
  const labelState = (id: string) =>
    visibleMapLabelIds === null || visibleMapLabelIds.has(id) ? 'visible' : 'hidden'

  const updateZoom = (nextIndex: number, recenter = false) => {
    const boundedIndex = Math.max(0, Math.min(tokyoMapZoomLevels.length - 1, nextIndex))
    if (boundedIndex === zoomIndex) return

    const viewport = viewportRef.current
    const horizontalCenter =
      viewport && viewport.scrollWidth > 0
        ? (viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth
        : 0.5
    const verticalCenter =
      viewport && viewport.scrollHeight > 0
        ? (viewport.scrollTop + viewport.clientHeight / 2) / viewport.scrollHeight
        : 0.5

    setZoomIndex(boundedIndex)

    if (!viewport) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetX = recenter ? 0.5 : horizontalCenter
        const targetY = recenter ? 0.5 : verticalCenter
        viewport.scrollTo({
          left: Math.max(0, targetX * viewport.scrollWidth - viewport.clientWidth / 2),
          top: Math.max(0, targetY * viewport.scrollHeight - viewport.clientHeight / 2),
          behavior: reduceMotion ? 'auto' : 'smooth',
        })
      })
    })
  }

  useEffect(() => {
    const centerMap = () => {
      const viewport = viewportRef.current
      if (!viewport || window.innerWidth > 780) return
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2
    }

    centerMap()
    window.addEventListener('resize', centerMap)
    return () => window.removeEventListener('resize', centerMap)
  }, [])

  useEffect(() => {
    if (!activeHotel) return
    const viewport = viewportRef.current
    if (!viewport) return

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        viewport.scrollTo({
          left: Math.max(
            0,
            ((activeHotel.x - activeView.x) / activeView.width) * viewport.scrollWidth -
              viewport.clientWidth / 2,
          ),
          top: Math.max(
            0,
            ((activeHotel.y - activeView.y) / activeView.height) * viewport.scrollHeight -
              viewport.clientHeight / 2,
          ),
          behavior: reduceMotion ? 'auto' : 'smooth',
        })
      })
    })
  }, [activeHotel, activeView, zoomIndex, reduceMotion])

  useLayoutEffect(() => {
    const svg = svgRef.current
    const viewport = viewportRef.current
    if (!svg || !viewport) return

    const measureLabels = () => {
      const viewBox = svg.viewBox.baseVal
      const screenMatrix = svg.getScreenCTM()
      if (!screenMatrix) return
      const inverseScreenMatrix = screenMatrix.inverse()
      const measuredRect = (element: SVGGraphicsElement): MapRect => {
        const screenRect = element.getBoundingClientRect()
        const topLeft = new DOMPoint(screenRect.left, screenRect.top).matrixTransform(
          inverseScreenMatrix,
        )
        const bottomRight = new DOMPoint(screenRect.right, screenRect.bottom).matrixTransform(
          inverseScreenMatrix,
        )
        return {
          x: Math.min(topLeft.x, bottomRight.x),
          y: Math.min(topLeft.y, bottomRight.y),
          width: Math.abs(bottomRight.x - topLeft.x),
          height: Math.abs(bottomRight.y - topLeft.y),
        }
      }
      const bounds: MapRect = {
        x: viewBox.x,
        y: viewBox.y,
        width: viewBox.width,
        height: viewBox.height,
      }
      const candidates: TokyoLabelCandidate[] = Array.from(
        svg.querySelectorAll<SVGGraphicsElement>('[data-map-label-id]'),
      )
        .map((element) => {
          return {
            id: element.dataset.mapLabelId ?? '',
            ownerId: element.dataset.mapLabelOwner,
            priority: Number(element.dataset.mapLabelPriority ?? 0),
            required: element.dataset.mapLabelRequired === 'true',
            rect: measuredRect(element),
          }
        })
        .filter((candidate) => candidate.id && candidate.rect.width > 0 && candidate.rect.height > 0)
      const obstacles: TokyoLabelObstacle[] = Array.from(
        svg.querySelectorAll<SVGGraphicsElement>('[data-map-obstacle-id]'),
      )
        .map((element) => {
          return {
            id: element.dataset.mapObstacleId ?? '',
            priority: Number(element.dataset.mapObstaclePriority ?? 0),
            rect: measuredRect(element),
          }
        })
        .filter((obstacle) => obstacle.id && obstacle.rect.width > 0 && obstacle.rect.height > 0)
      const narrow = viewport.clientWidth < 720
      const nextVisibleIds = selectTokyoMapLabels({
        bounds,
        candidates,
        obstacles,
        collisionPadding: narrow ? 8 : 4,
        edgePadding: narrow ? 14 : 9,
        obstaclePadding: narrow ? 5 : 3,
      })

      setVisibleMapLabelIds((current) =>
        equalLabelSets(current, nextVisibleIds) ? current : nextVisibleIds,
      )
    }

    measureLabels()
    const observer = new ResizeObserver(measureLabels)
    observer.observe(viewport)
    void document.fonts?.ready.then(measureLabels)
    return () => observer.disconnect()
  }, [activeHotelId, activePathId, activeRouteId, zoomIndex])

  return (
    <figure className="tokyo-map">
      <div className="map-zoom-bar">
        <span>Map scale</span>
        <div className="map-zoom-controls" role="group" aria-label="Tokyo map zoom">
          <button
            type="button"
            aria-label="Zoom map out"
            onClick={() => updateZoom(zoomIndex - 1)}
            disabled={zoomIndex === 0}
          >
            −
          </button>
          <output aria-live="polite" aria-label="Current map zoom">
            {zoom.label}%
          </output>
          <button
            type="button"
            aria-label="Zoom map in"
            onClick={() => updateZoom(zoomIndex + 1)}
            disabled={zoomIndex === tokyoMapZoomLevels.length - 1}
          >
            +
          </button>
          <button
            type="button"
            className="map-zoom-controls__reset"
            onClick={() => updateZoom(tokyoMapDefaultZoomIndex, true)}
            disabled={zoomIndex === tokyoMapDefaultZoomIndex}
          >
            Reset
          </button>
        </div>
      </div>
      <div
        className={`tokyo-map__viewport tokyo-map__viewport--zoom-${zoomIndex}`}
        ref={viewportRef}
      >
        <svg
          ref={svgRef}
          viewBox={`${activeView.x} ${activeView.y} ${activeView.width} ${activeView.height}`}
          role="img"
          aria-labelledby="tokyo-map-title tokyo-map-description"
        >
          <title id="tokyo-map-title">Official boundaries of Tokyo's 23 special wards</title>
          <desc id="tokyo-map-description">
            Map of Tokyo's 23 special wards, Metro, Toei, Yamanote and selected hotel-access rail
            lines, selected stations, and five hotel locations.
          </desc>
          <rect width="1000" height="720" className="ward-map-water" />
          <g className="ward-map-context" aria-hidden="true">
              {tokyoContextPaths.map((path, index) => (
                <path key={index} d={path} />
              ))}
          </g>
          <g className="ward-map-boundaries">
            {tokyoWards.map((ward) => (
              <g
                key={ward.code}
                className={`ward-shape ward-shape--${ward.group} ${
                  ward.focus ? 'is-focus' : ''
                } ${focusedWardCodes.has(ward.code) ? 'is-stay-focus' : 'is-stay-dimmed'}`}
              >
                <title>
                  {ward.name} Ward{ward.planning ? ` · ${ward.planning}` : ''}
                </title>
                {ward.paths.map((path, index) => (
                  <path key={index} d={path} />
                ))}
              </g>
            ))}
          </g>
          <g className="stay-catchments" aria-hidden="true">
            {focusedHotels.map((hotel) => (
              <circle
                key={hotel.id}
                className={`stay-catchment stay-catchment--${hotel.pathId}`}
                cx={hotel.x}
                cy={hotel.y}
                r={hotel.catchmentRadius}
              />
            ))}
          </g>
          <g className="rail-network" aria-hidden="true">
            {tokyoRailRoutes.map((route) => {
              const isActive = activeRouteId === route.id
              const isDecisionRelated = activeRouteId === null && focusedRouteIds.has(route.id)
              const isDimmed =
                activeRouteId !== null ? !isActive : !focusedRouteIds.has(route.id)
              const stateClass = `${route.priority ? 'is-priority' : 'is-context'} ${
                route.category === 'hotel-access' ? 'is-hotel-access' : ''
              } ${isActive ? 'is-active' : ''} ${
                isDecisionRelated ? 'is-decision-related' : ''
              } ${isDimmed ? 'is-dimmed' : ''}`
              return (
                <g key={route.id} className={`rail-route ${stateClass}`}>
                  {route.paths.map((path, index) => (
                    <path key={`casing-${index}`} className="rail-route__casing" d={path} />
                  ))}
                  {route.paths.map((path, index) => (
                    <path
                      key={index}
                      className="rail-route__line"
                      d={path}
                      stroke={route.color}
                    />
                  ))}
                </g>
              )
            })}
          </g>
          <g className="ward-map-boundary-overlay" aria-hidden="true">
            {tokyoWards.flatMap((ward) =>
              ward.paths.map((path, index) => <path key={`${ward.code}-${index}`} d={path} />),
            )}
          </g>
          <g className="rail-stations" aria-hidden="true">
            {tokyoRailStations.map((station) => {
              const offset = tokyoStationLabelOffsets[station.id] ?? {
                x: 10,
                y: -10,
                anchor: 'start' as const,
              }
              const isOnActive =
                activeRouteId !== null && station.routes.some((routeId) => routeId === activeRouteId)
              const isDecisionStation = focusedStationIds.has(station.id)
              const isDimmed =
                activeRouteId !== null ? !isOnActive : !isDecisionStation
              return (
                <g
                  key={station.id}
                  className={`rail-station ${station.primary ? 'is-primary' : ''} ${
                    isOnActive ? 'is-on-active' : ''
                  } ${isDecisionStation ? 'is-decision-station' : ''} ${
                    isDimmed ? 'is-dimmed' : ''
                  }`}
                  transform={`translate(${station.x} ${station.y})`}
                  data-map-label-state={labelState(`rail-station:${station.id}`)}
                >
                  <circle
                    className="rail-station__ring"
                    r="6"
                    data-map-obstacle-id={`rail-station:${station.id}`}
                    data-map-obstacle-priority={
                      isOnActive ? 340 : isDecisionStation ? 325 : station.primary ? 145 : 120
                    }
                  />
                  <circle className="rail-station__core" r="2.2" />
                  <text
                    className="map-label map-label--station"
                    x={offset.x}
                    y={offset.y}
                    textAnchor={offset.anchor}
                    data-map-label-id={`rail-station:${station.id}`}
                    data-map-label-owner={`rail-station:${station.id}`}
                    data-map-label-priority={
                      isOnActive ? 290 : isDecisionStation ? 275 : station.primary ? 125 : 100
                    }
                    data-map-label-state={labelState(`rail-station:${station.id}`)}
                  >
                    {station.name.toUpperCase()}
                  </text>
                </g>
              )
            })}
          </g>
          <g className="stay-stations" aria-hidden="true">
            {tokyoStayStations.map((station) => {
              const offset = tokyoStayStationLabelOffsets[station.id] ?? {
                x: 10,
                y: -10,
                anchor: 'start' as const,
              }
              const isRelevant = station.hotelIds.some((hotelId) =>
                focusedHotels.some((hotel) => hotel.id === hotelId),
              )

              return (
                <g
                  key={station.id}
                  className={`stay-station ${isRelevant ? 'is-relevant' : 'is-dimmed'}`}
                  transform={`translate(${station.x} ${station.y})`}
                  data-map-label-state={labelState(`stay-station:${station.id}`)}
                >
                  <circle
                    r="5.2"
                    data-map-obstacle-id={`stay-station:${station.id}`}
                    data-map-obstacle-priority={isRelevant ? 350 : 125}
                  />
                  <path d="M-7 0H7M0-7V7" />
                  <text
                    className="map-label map-label--station map-label--access"
                    x={offset.x}
                    y={offset.y}
                    textAnchor={offset.anchor}
                    data-map-label-id={`stay-station:${station.id}`}
                    data-map-label-owner={`stay-station:${station.id}`}
                    data-map-label-priority={isRelevant ? 320 : 110}
                    data-map-label-state={labelState(`stay-station:${station.id}`)}
                  >
                    {station.name.toUpperCase()}
                  </text>
                </g>
              )
            })}
          </g>
          <g className="hotel-pins">
            {tokyoStayHotels.map((hotel) => {
              const offset = tokyoHotelLabelOffsets[hotel.id]
              const isActive = activeHotelId === hotel.id
              const isInPath = hotel.pathId === activePathId

              return (
                <g
                  key={hotel.id}
                  className={`hotel-pin hotel-pin--${hotel.pathId} ${
                    isActive ? 'is-active' : ''
                  } ${isInPath ? 'is-in-path' : 'is-dimmed'}`}
                  transform={`translate(${hotel.x} ${hotel.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${hotel.name} in ${hotel.area}`}
                  data-map-label-state={labelState(`hotel:${hotel.id}`)}
                  onClick={() => onHotelSelect(hotel.id)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    onHotelSelect(hotel.id)
                  }}
                >
                  <title>
                    {hotel.name} · {hotel.area}
                  </title>
                  <circle
                    className="hotel-pin__focus"
                    r="17"
                    data-map-obstacle-id={isInPath ? `hotel:${hotel.id}` : undefined}
                    data-map-obstacle-priority={isActive ? 550 : 390}
                  />
                  <circle className="hotel-pin__disc" r="11" />
                  <text className="hotel-pin__code" y="3.5">
                    {hotel.mapCode}
                  </text>
                  <text
                    className="hotel-pin__label map-label map-label--hotel"
                    x={offset.x}
                    y={offset.y}
                    textAnchor={offset.anchor}
                    data-map-label-id={`hotel:${hotel.id}`}
                    data-map-label-owner={`hotel:${hotel.id}`}
                    data-map-label-priority={isActive ? 500 : 400}
                    data-map-label-required={isActive ? 'true' : undefined}
                    data-map-label-state={labelState(`hotel:${hotel.id}`)}
                  >
                    {tokyoHotelMapLabels[hotel.id]}
                  </text>
                </g>
              )
            })}
          </g>
          <g className="ward-map-labels" aria-hidden="true">
            {focusWards.map((ward) => {
              const offset = tokyoWardLabelOffsets[ward.code] ?? { x: 0, y: 0 }
              return (
                <g
                  key={ward.code}
                  className={`ward-label ward-label--${ward.code} ${
                    focusedWardCodes.has(ward.code) ? 'is-stay-focus' : 'is-stay-dimmed'
                  }`}
                  transform={`translate(${ward.labelX} ${ward.labelY})`}
                  data-map-label-state={labelState(`ward:${ward.code}`)}
                >
                  <line x1="0" y1="0" x2={offset.x} y2={offset.y} />
                  <circle
                    r="4"
                    data-map-obstacle-id={`ward:${ward.code}`}
                    data-map-obstacle-priority={focusedWardCodes.has(ward.code) ? 230 : 205}
                  />
                  <text
                    className="map-label map-label--area"
                    x={offset.x}
                    y={offset.y - 6}
                    data-map-label-id={`ward:${ward.code}`}
                    data-map-label-owner={`ward:${ward.code}`}
                    data-map-label-priority={focusedWardCodes.has(ward.code) ? 220 : 190}
                    data-map-label-state={labelState(`ward:${ward.code}`)}
                  >
                    {ward.name.toUpperCase()}
                  </text>
                </g>
              )
            })}
          </g>
          <text
            x="822"
            y="640"
            className="ward-map-bay-label map-label map-label--context"
            data-map-label-id="context:tokyo-bay"
            data-map-label-priority="60"
            data-map-label-state={labelState('context:tokyo-bay')}
          >
            TOKYO BAY
          </text>
          <path className="ward-map-north" d="M90 104V48M90 48L80 66M90 48L100 66" />
          <text
            x="90"
            y="36"
            className="ward-map-north-label map-label map-label--context"
            data-map-label-id="context:north"
            data-map-label-priority="50"
            data-map-label-state={labelState('context:north')}
          >
            N
          </text>
        </svg>
      </div>
      <div className="rail-legend" aria-label="Rail route focus">
        <div className="rail-legend__heading">
          <span>Base network · Metro, Toei &amp; Yamanote</span>
          <button
            type="button"
            onClick={() => setActiveRouteId(null)}
            disabled={activeRouteId === null}
          >
            Show full network
          </button>
        </div>
        <div className="rail-legend__routes rail-legend__routes--priority">
          {priorityRoutes.map((route) => (
            <button
              type="button"
              key={route.id}
              aria-pressed={activeRouteId === route.id}
              onClick={() => setActiveRouteId(activeRouteId === route.id ? null : route.id)}
            >
              <i style={{ background: route.color }} />
              <span>{route.short}</span>
            </button>
          ))}
        </div>
        <details className="rail-legend__more">
          <summary>Other Metro &amp; Toei lines</summary>
          <div className="rail-legend__routes">
            {contextRoutes.map((route) => (
              <button
                type="button"
                key={route.id}
                aria-pressed={activeRouteId === route.id}
                onClick={() => setActiveRouteId(activeRouteId === route.id ? null : route.id)}
              >
                <i style={{ background: route.color }} />
                <span>{route.short}</span>
              </button>
            ))}
          </div>
        </details>
        <div className="rail-legend__access" aria-label="Selected hotel access lines">
          <span>Hotel access lines</span>
          <div>
            {hotelAccessRoutes.map((route) => (
              <span key={route.id}>
                <i style={{ background: route.color }} />
                {route.short}
              </span>
            ))}
          </div>
        </div>
        <p aria-live="polite">
          {activeRoute
            ? `${activeRoute.operator} · ${activeRoute.name}`
            : activeHotel
              ? `${activeHotel.name}: ${activeHotel.routeIds
                  .map(
                    (routeId) =>
                      tokyoRailRoutes.find((route) => route.id === routeId)?.short ?? routeId,
                  )
                  .join(' + ')}`
              : `${activePath.short}: select a hotel or rail line`}
        </p>
      </div>
      <figcaption>
        <details className="map-data-disclosure">
          <summary>Map data</summary>
          <p>
            Wards: MLIT N03 2025. Rail and stations: MLIT N02 2022. The base network is Metro,
            Toei and Yamanote; Odakyu and Keio Inokashira appear only as hotel-access context.
            Hotel locations: operator pages. Tomigaya and Daita use editorial area overlays, not
            administrative boundaries. Full processing notes are in TOKYO_MAP_DATA.md.
          </p>
        </details>
        <span className="map-pan-note">
          Use the scale controls, then swipe or scroll the map to inspect details.
        </span>
      </figcaption>
    </figure>
  )
}

function TokyoScene() {
  const [selectedHotelId, setSelectedHotelId] = useState<TokyoStayHotelId | null>(
    readStoredTokyoStay,
  )
  const [activePathId, setActivePathId] = useState<TokyoStayPathId>(() => {
    const storedHotelId = readStoredTokyoStay()
    return (
      tokyoStayHotels.find((hotel) => hotel.id === storedHotelId)?.pathId ?? tokyoStayPaths[0].id
    )
  })
  const activePath =
    tokyoStayPaths.find((path) => path.id === activePathId) ?? tokyoStayPaths[0]
  const selectedHotel = tokyoStayHotels.find((hotel) => hotel.id === selectedHotelId)
  const selectedProfile = selectedHotel ? tokyoHotelPlanningNotes[selectedHotel.id] : null
  const pathHotels = tokyoStayHotels.filter((hotel) =>
    activePath.hotelIds.some((hotelId) => hotelId === hotel.id),
  )

  useEffect(() => {
    if (selectedHotelId) {
      window.localStorage.setItem(tokyoStayStorageKey, selectedHotelId)
    } else {
      window.localStorage.removeItem(tokyoStayStorageKey)
    }
    window.dispatchEvent(
      new CustomEvent('tokyo-stay-change', { detail: selectedHotelId }),
    )
  }, [selectedHotelId])

  const choosePath = (pathId: TokyoStayPathId) => {
    setActivePathId(pathId)
    if (selectedHotel?.pathId !== pathId) setSelectedHotelId(null)
  }

  const chooseHotel = (hotelId: TokyoStayHotelId) => {
    const hotel = tokyoStayHotels.find((candidate) => candidate.id === hotelId)
    if (!hotel) return
    setActivePathId(hotel.pathId)
    setSelectedHotelId(hotel.id)
  }

  const stationName = (stationId: string) =>
    tokyoStayStations.find((station) => station.id === stationId)?.name ??
    tokyoRailStations.find((station) => station.id === stationId)?.name ??
    stationId

  return (
    <section
      className="tokyo scene scene--sticky"
      id="tokyo"
      data-decision="tokyo"
      data-note-section
      data-mode="walk"
      aria-labelledby="tokyo-title"
    >
      <div className="scene__sticky">
        <header className="scene-heading scene-heading--staged map-section-frame">
          <span className="station-stamp">TOKYO · STAY DECISION</span>
          <div className="scene-heading__copy">
            <h2 id="tokyo-title">Where should we stay in Tokyo?</h2>
            <p>
              Choose the stay experience, then the hotel.
            </p>
          </div>
          <TravelerSceneStage scene="beds" />
        </header>
        <div className="tokyo-layout map-section-frame">
          <TokyoMap
            activePathId={activePathId}
            activeHotelId={selectedHotelId}
            onHotelSelect={chooseHotel}
          />
          <aside className="tokyo-stay-ledger">
            <span className="tokyo-stay-ledger__code">TOKYO STAY</span>
            <div className="tokyo-path-tabs" role="tablist" aria-label="Choose a Tokyo stay experience">
              {tokyoStayPaths.map((path) => (
                <button
                  type="button"
                  role="tab"
                  id={`tokyo-stay-tab-${path.id}`}
                  aria-selected={activePathId === path.id}
                  aria-controls="tokyo-stay-panel"
                  key={path.id}
                  onClick={() => choosePath(path.id)}
                >
                  <b>{path.code}</b>
                  <span>
                    <strong>{path.short}</strong>
                    <small>{path.hotelIds.length} hotels</small>
                  </span>
                </button>
              ))}
            </div>
            <div
              id="tokyo-stay-panel"
              className="tokyo-stay-panel"
              role="tabpanel"
              aria-labelledby={`tokyo-stay-tab-${activePathId}`}
            >
              <h3>{activePath.title}</h3>
              <p>{activePath.thesis}</p>
              <dl className="tokyo-path-criteria">
                {activePath.criteria.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="tokyo-hotel-options">
                <span>Then choose the hotel</span>
                {pathHotels.map((hotel) => (
                  <button
                    type="button"
                    aria-pressed={selectedHotelId === hotel.id}
                    key={hotel.id}
                    onClick={() => chooseHotel(hotel.id)}
                  >
                    <b>{hotel.mapCode}</b>
                    <span>
                      <strong>{hotel.name}</strong>
                      <small>
                        {hotel.area} · {hotel.stationIds.map(stationName).join(' / ')}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
              {selectedHotel && selectedProfile ? (
                <div className="tokyo-hotel-detail" aria-live="polite">
                  {selectedProfile.image && (
                    <figure className="tokyo-hotel-detail__image">
                      <img src={selectedProfile.image.src} alt={selectedProfile.image.alt} />
                      {selectedProfile.image.credit && (
                        <figcaption>{selectedProfile.image.credit}</figcaption>
                      )}
                    </figure>
                  )}
                  <div>
                    <span>CURRENT CHOICE</span>
                    <h4>{selectedHotel.name}</h4>
                    {'officialName' in selectedHotel && (
                      <small>{selectedHotel.officialName}</small>
                    )}
                  </div>
                  <section className="tokyo-hotel-take" aria-label="Planning take">
                    <span>PLANNING TAKE</span>
                    <div>
                      <section>
                        <h5>Pros</h5>
                        <ul>
                          {selectedProfile.pros.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <h5>Tradeoffs</h5>
                        <ul>
                          {selectedProfile.tradeoffs.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </section>
                  <a
                    className="tokyo-hotel-website"
                    href={selectedProfile.officialWebsiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Official website for ${selectedHotel.name} (opens in a new tab)`}
                  >
                    Official website <span aria-hidden="true">↗</span>
                  </a>
                  <details className="tokyo-hotel-context">
                    <summary>Verified location and transit context</summary>
                    <dl>
                      <div>
                        <dt>Map position</dt>
                        <dd>{selectedProfile.mapRead}</dd>
                      </div>
                      <div>
                        <dt>Station context</dt>
                        <dd>{selectedProfile.stationRead}</dd>
                      </div>
                      <div>
                        <dt>Official source</dt>
                        <dd>
                          {selectedHotel.officialFact} Checked {selectedHotel.asOf}.
                        </dd>
                      </div>
                    </dl>
                  </details>
                </div>
              ) : (
                <div className="tokyo-hotel-empty">
                  Select a hotel to see its map and details.
                </div>
              )}
            </div>
            <div className="tokyo-decision-state">
              <strong>Tokyo hotel decision</strong>
              <p>
                {selectedHotel
                  ? `Selected: ${selectedHotel.name} in ${selectedHotel.area}.`
                  : 'No hotel selected yet.'}
              </p>
              {selectedHotel && (
                <button type="button" onClick={() => setSelectedHotelId(null)}>
                  Clear selection
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

function RegionalTransition() {
  const [routeState, setRouteState] = useState<MiddleRouteState>(readStoredMiddleRoute)
  const [startNodeId, setStartNodeId] = useState<DrivingNodeId>(() => {
    const hotelId = readStoredTokyoStay()
    return hotelId && centralJapanDrivingRoutes.startNodeIds.includes(hotelId)
      ? hotelId
      : 'tokyo-station'
  })
  const [mapDetailOpen, setMapDetailOpen] = useState(false)
  const [routeAnnouncement, setRouteAnnouncement] = useState('')
  const [focusRequest, setFocusRequest] = useState<{
    stopId: MiddleStopId
    action: 'add' | 'remove' | 'earlier' | 'later'
  } | null>(null)
  const routeActionRefs = useRef(new Map<string, HTMLButtonElement>())
  useEffect(() => {
    window.localStorage.setItem(middleRouteStorageKey, JSON.stringify(routeState))
    window.dispatchEvent(
      new CustomEvent<MiddleRouteState>('middle-route-change', { detail: routeState }),
    )
  }, [routeState])

  useEffect(() => {
    const updateStart = (event: Event) => {
      const hotelId = (event as CustomEvent<TokyoStayHotelId | null>).detail
      setStartNodeId(
        hotelId && centralJapanDrivingRoutes.startNodeIds.includes(hotelId)
          ? hotelId
          : 'tokyo-station',
      )
    }
    window.addEventListener('tokyo-stay-change', updateStart)
    return () => window.removeEventListener('tokyo-stay-change', updateStart)
  }, [])

  useEffect(() => {
    if (!mapDetailOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMapDetailOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mapDetailOpen])

  useEffect(() => {
    if (!focusRequest) return
    const frame = window.requestAnimationFrame(() => {
      routeActionRefs.current
        .get(`${focusRequest.stopId}:${focusRequest.action}`)
        ?.focus()
      setFocusRequest(null)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusRequest, routeState.stopIds])

  const registerRouteAction =
    (stopId: MiddleStopId, action: 'add' | 'remove' | 'earlier' | 'later') =>
    (node: HTMLButtonElement | null) => {
      const key = `${stopId}:${action}`
      if (node) routeActionRefs.current.set(key, node)
      else routeActionRefs.current.delete(key)
    }

  const addStop = (stopId: MiddleStopId, focusMovedRow = false) => {
    const stopIds = addMiddleStop(routeState.stopIds, stopId)
    if (stopIds.length === routeState.stopIds.length) return
    setRouteState({ ...routeState, stopIds })
    setRouteAnnouncement(
      `${drivingNodes[stopId].name} added as stop ${stopIds.length}.`,
    )
    if (focusMovedRow) setFocusRequest({ stopId, action: 'remove' })
  }

  const removeStop = (stopId: MiddleStopId, focusMovedRow = false) => {
    if (!routeState.stopIds.includes(stopId)) return
    const stopIds = removeMiddleStop(routeState.stopIds, stopId)
    setRouteState({ ...routeState, stopIds })
    setRouteAnnouncement(
      `${drivingNodes[stopId].name} removed. ${stopIds.length} ${
        stopIds.length === 1 ? 'stop remains' : 'stops remain'
      }.`,
    )
    if (focusMovedRow) setFocusRequest({ stopId, action: 'add' })
  }

  const moveStop = (stopId: MiddleStopId, direction: -1 | 1) => {
    const index = routeState.stopIds.indexOf(stopId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= routeState.stopIds.length) return
    const stopIds = moveMiddleStop(routeState.stopIds, stopId, direction)
    setRouteState({ ...routeState, stopIds })
    setRouteAnnouncement(`${drivingNodes[stopId].name} moved to stop ${nextIndex + 1}.`)
    const action =
      nextIndex === 0
        ? 'later'
        : nextIndex === stopIds.length - 1
          ? 'earlier'
          : direction === -1
            ? 'earlier'
            : 'later'
    setFocusRequest({ stopId, action })
  }

  const chooseEnd = (endId: DrivingEndId) => {
    setRouteState((current) => ({ ...current, endId }))
  }

  const resetRoute = () => {
    setRouteState({ version: 1, stopIds: [], endId: null })
    setRouteAnnouncement('Route reset. All optional stops are now under Not in route.')
  }

  const { legs, complete: routeComplete, totalDistance, totalMinutes } = composeRoute<
    DrivingNodeId,
    DrivingPair
  >(startNodeId, routeState.stopIds, routeState.endId, drivingPairs)
  const selectedStopSet = new Set(routeState.stopIds)
  const { unselected: unselectedStopIds } = partitionMiddleStops(routeState.stopIds)
  const startNode = drivingNodes[startNodeId]

  const mapGraphic = (interactive: boolean) => (
    <div className={`central-map-sheet ${interactive ? '' : 'central-map-sheet--detail'}`}>
      <img
        src={centralJapanMapAsset}
        alt="Central Japan map showing Lake Nojiri, James Brown, Shirahone Onsen, Okuhida Onsen-go, Chubu-Sangaku National Park, Tokyo, and Kyoto."
      />
      <svg
        className="route-builder-overlay"
        viewBox={centralJapanDrivingRoutes.viewBox.join(' ')}
        aria-hidden="true"
      >
        {legs.map(
          (leg, index) =>
            leg.pair?.svgPath && (
              <g key={`${leg.fromId}-${leg.toId}`}>
                <path className="route-builder-overlay__casing" d={leg.pair.svgPath} />
                <path className="route-builder-overlay__line" d={leg.pair.svgPath} />
                <title>{`Leg ${index + 1}: ${drivingNodes[leg.fromId].name} to ${drivingNodes[leg.toId].name}`}</title>
              </g>
            ),
        )}
        {routeState.stopIds.map((stopId, index) => {
          const node = drivingNodes[stopId]
          return (
            <g className="route-builder-overlay__number" key={stopId}>
              <rect
                x={node.x - 15}
                y={node.y - 15}
                width="30"
                height="30"
                transform={`rotate(45 ${node.x} ${node.y})`}
              />
              <text x={node.x} y={node.y + 6} textAnchor="middle">
                {index + 1}
              </text>
            </g>
          )
        })}
      </svg>
      {interactive && (
        <div className="central-map-hotspots" aria-label="Middle-route stop markers">
          {centralJapanMapPoints.locations.map((location) => {
            const stopId = location.id as MiddleStopId
            const selected = selectedStopSet.has(stopId)
            return (
              <button
                type="button"
                className={`central-map-hotspot central-map-hotspot--${location.status} central-map-hotspot--${location.id} ${
                  selected ? 'is-active' : ''
                }`}
                style={{
                  left: `${(location.x / centralJapanMapPoints.viewBox[2]) * 100}%`,
                  top: `${(location.y / centralJapanMapPoints.viewBox[3]) * 100}%`,
                }}
                aria-label={`${selected ? 'Remove' : 'Add'} ${location.title} ${
                  selected ? 'from' : 'to'
                } route.`}
                aria-pressed={selected}
                key={location.id}
                onClick={() => (selected ? removeStop(stopId) : addStop(stopId))}
              >
                <span aria-hidden="true" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <section
      className="middle-route-builder scene"
      id="middle-route"
      data-decision="middle-route"
      data-note-section
      data-mode="map"
      aria-labelledby="middle-route-title"
    >
      <header className="scene-heading scene-heading--staged map-section-frame">
        <span className="station-stamp">3 · MIDDLE-OF-TRIP ROUTE</span>
        <div className="scene-heading__copy">
          <h2 id="middle-route-title">Which middle route should we take?</h2>
          <p>Choose and order stops, then select Kyoto or Tokyo.</p>
        </div>
        <TravelerSceneStage scene="onsen" />
      </header>

      <div className="middle-route-builder__layout map-section-frame">
        <figure className="route-builder-map">
          {mapGraphic(true)}
          <figcaption>
            <span>© OpenStreetMap contributors · MLIT / MOE</span>
            <button type="button" onClick={() => setMapDetailOpen(true)}>
              Open larger map
            </button>
          </figcaption>
        </figure>

        <aside className="route-builder-panel" aria-label="Ordered middle route builder">
          <div className="route-builder-start">
            <span>START</span>
            <strong>{startNode.name}</strong>
          </div>

          <section className="route-builder-order" aria-labelledby="route-order-title">
            <div className="route-builder-order__heading">
              <div>
                <h3 id="route-order-title">Travel order</h3>
                <span>
                  {routeState.stopIds.length} selected
                </span>
              </div>
              <button
                type="button"
                onClick={resetRoute}
                disabled={!routeState.stopIds.length && !routeState.endId}
              >
                Reset route
              </button>
            </div>
            {routeState.stopIds.length ? (
              <ol className="route-builder-selected">
                {routeState.stopIds.map((stopId, index) => {
                  const location = middleStopLocations[stopId]
                  return (
                    <li className="route-stop-row route-stop-row--selected" key={stopId}>
                      <span className="route-stop-number">
                        <b>{index + 1}</b>
                      </span>
                      <div className="route-stop-copy">
                        <strong>{location.title}</strong>
                        <small>{location.detail}</small>
                      </div>
                      <div className="route-order-actions">
                        <button
                          ref={registerRouteAction(stopId, 'earlier')}
                          type="button"
                          disabled={index === 0}
                          aria-label={`Move ${drivingNodes[stopId].name} earlier`}
                          onClick={() => moveStop(stopId, -1)}
                        >
                          ↑
                        </button>
                        <button
                          ref={registerRouteAction(stopId, 'later')}
                          type="button"
                          disabled={index === routeState.stopIds.length - 1}
                          aria-label={`Move ${drivingNodes[stopId].name} later`}
                          onClick={() => moveStop(stopId, 1)}
                        >
                          ↓
                        </button>
                        <button
                          ref={registerRouteAction(stopId, 'remove')}
                          type="button"
                          aria-label={`Remove ${drivingNodes[stopId].name}`}
                          onClick={() => removeStop(stopId, true)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="route-builder-empty">
                No middle stops selected. Add any option below.
              </p>
            )}

            <div className="route-builder-unselected-label">
              <span>Not in route</span>
              <small>{unselectedStopIds.length} available</small>
            </div>
            <ul className="route-builder-unselected">
              {unselectedStopIds.map((stopId) => {
                const location = middleStopLocations[stopId]
                return (
                  <li className="route-stop-row route-stop-row--unselected" key={stopId}>
                    <i
                      className={`route-stop-marker route-stop-marker--${location.status}`}
                      aria-hidden="true"
                    />
                    <div className="route-stop-copy">
                      <strong>{location.title}</strong>
                      <small>{location.detail}</small>
                    </div>
                    <button
                      ref={registerRouteAction(stopId, 'add')}
                      type="button"
                      aria-label={`Add ${drivingNodes[stopId].name} to route`}
                      onClick={() => addStop(stopId, true)}
                    >
                      Add
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <fieldset
            className="route-builder-end scene"
            id="final-city"
            data-decision="final-city"
            tabIndex={-1}
          >
            <legend>Final city</legend>
            <button
              type="button"
              aria-pressed={routeState.endId === 'kyoto'}
              onClick={() => chooseEnd('kyoto')}
            >
              Kyoto
            </button>
            <button
              type="button"
              aria-pressed={routeState.endId === 'tokyo-station'}
              onClick={() => chooseEnd('tokyo-station')}
            >
              Tokyo
            </button>
          </fieldset>

          <section className="route-builder-estimate" aria-live="polite">
            <span className="sr-only">{routeAnnouncement}</span>
            <div>
              <span>{routeComplete ? 'COMPLETE DRIVING ROUTE' : 'ROUTE NEEDS AN ENDPOINT'}</span>
              <strong>
                {routeComplete
                  ? `${formatDrivingDuration(totalMinutes)} · ${formatDistanceMiles(totalDistance)}`
                  : 'Choose Kyoto or Tokyo'}
              </strong>
            </div>
            {legs.length > 0 && (
              <ol>
                {legs.map((leg, index) => {
                  return (
                    <li key={`${leg.fromId}-${leg.toId}`}>
                      <span>LEG {index + 1}</span>
                      <div>
                        <strong>
                          {drivingNodes[leg.fromId].name} → {drivingNodes[leg.toId].name}
                        </strong>
                        {leg.pair ? (
                          <p>
                            {formatDrivingDuration(leg.pair.durationMinutes)} ·{' '}
                            {formatDistanceMiles(leg.pair.distanceKm)}
                          </p>
                        ) : (
                          <p>Route pair unavailable.</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
            <small>{centralJapanDrivingRoutes.caveat}</small>
          </section>
        </aside>
      </div>

      <details className="map-data-disclosure map-section-frame">
        <summary>Map and route data</summary>
        <p>
          Land and coastline: MLIT N03 2025. Park extent: MOE 2025. Driving routes: cached OSRM
          geometry over OpenStreetMap without live traffic. James Brown is shown at municipality
          level; no private address is stored.
        </p>
      </details>

      {mapDetailOpen && (
        <div
          className="route-map-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Larger Central Japan route map"
        >
          <div>
            <button type="button" autoFocus onClick={() => setMapDetailOpen(false)}>
              Close map
            </button>
            {mapGraphic(false)}
          </div>
        </div>
      )}
    </section>
  )
}

function PlanningSummary() {
  const [stayRange, setStayRange] = useState<StayRange>(readStoredStayRange)
  const [hotelId, setHotelId] = useState<TokyoStayHotelId | null>(readStoredTokyoStay)
  const [routeState, setRouteState] = useState<MiddleRouteState>(readStoredMiddleRoute)

  useEffect(() => {
    const updateDates = (event: Event) => {
      setStayRange((event as CustomEvent<StayRange>).detail)
    }
    const updateHotel = (event: Event) => {
      setHotelId((event as CustomEvent<TokyoStayHotelId | null>).detail)
    }
    const updateRoute = (event: Event) => {
      setRouteState((event as CustomEvent<MiddleRouteState>).detail)
    }
    const updateFromStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'japan-trip-japan-stay-v1') {
        setStayRange(readStoredStayRange())
      }
      if (!event.key || event.key === tokyoStayStorageKey) {
        setHotelId(readStoredTokyoStay())
      }
      if (!event.key || event.key === middleRouteStorageKey) {
        setRouteState(readStoredMiddleRoute())
      }
    }

    window.addEventListener('japan-stay-change', updateDates)
    window.addEventListener('tokyo-stay-change', updateHotel)
    window.addEventListener('middle-route-change', updateRoute)
    window.addEventListener('storage', updateFromStorage)
    return () => {
      window.removeEventListener('japan-stay-change', updateDates)
      window.removeEventListener('tokyo-stay-change', updateHotel)
      window.removeEventListener('middle-route-change', updateRoute)
      window.removeEventListener('storage', updateFromStorage)
    }
  }, [])

  const selectedHotel = tokyoStayHotels.find((hotel) => hotel.id === hotelId)
  const selectedPath = selectedHotel
    ? tokyoStayPaths.find((path) => path.id === selectedHotel.pathId)
    : null
  const startNodeId: DrivingNodeId =
    hotelId && centralJapanDrivingRoutes.startNodeIds.includes(hotelId)
      ? hotelId
      : 'tokyo-station'
  const { complete: routeComplete, totalDistance, totalMinutes } = composeRoute<
    DrivingNodeId,
    DrivingPair
  >(startNodeId, routeState.stopIds, routeState.endId, drivingPairs)
  const finalCity =
    routeState.endId === 'kyoto'
      ? 'Kyoto'
      : routeState.endId === 'tokyo-station'
        ? 'Tokyo'
        : null
  const routeSequence = buildRouteSequence(
    drivingNodes[startNodeId].name,
    routeState.stopIds.map((stopId) => drivingNodes[stopId].name),
    finalCity,
  )
  const datesComplete = Boolean(stayRange.checkIn && stayRange.checkOut)
  const nights =
    stayRange.checkIn && stayRange.checkOut
      ? countNights(stayRange.checkIn, stayRange.checkOut)
      : null
  const stillToDecide = getStillToDecide({
    datesComplete,
    hotelSelected: Boolean(selectedHotel),
    endId: routeState.endId,
    routeComplete,
  })

  return (
    <section
      className="summary scene"
      id="summary"
      data-decision="summary"
      data-note-section
      data-mode="read"
      aria-labelledby="summary-title"
    >
      <div className="summary__header">
        <div>
          <span>SUMMARY</span>
          <h2 id="summary-title">Current selections</h2>
        </div>
        <p>Saved locally in this browser.</p>
      </div>
      <dl className="summary-decisions">
        <div>
          <dt>Travel dates</dt>
          <dd>
            <strong>
              {datesComplete
                ? formatStayRange(stayRange.checkIn!, stayRange.checkOut!)
                : 'Not selected'}
            </strong>
            {datesComplete && nights !== null && (
              <span>
                {nights} {nights === 1 ? 'hotel night' : 'hotel nights'} · check-in{' '}
                {stayRange.checkIn} · check-out {stayRange.checkOut}
              </span>
            )}
          </dd>
          <a href="#travel-dates">Edit dates</a>
        </div>
        <div>
          <dt>Tokyo hotel</dt>
          <dd>
            <strong>{selectedHotel?.name ?? 'Not selected'}</strong>
            {selectedPath && <span>{selectedPath.title}</span>}
          </dd>
          <a href="#tokyo">Edit hotel</a>
        </div>
        <div className="summary-decisions__route">
          <dt>Middle route</dt>
          <dd>
            <div
              className="summary-route-sequence"
              aria-label={`Current route: ${routeSequence.join(' to ')}`}
            >
              {routeSequence.map((name, index) => (
                <span key={`${name}-${index}`}>
                  {name}
                  {index < routeSequence.length - 1 && <i aria-hidden="true">→</i>}
                </span>
              ))}
            </div>
            {routeState.stopIds.length === 0 && (
              <span>No optional middle stops selected.</span>
            )}
            {routeComplete && (
              <>
                <strong>
                  {formatDrivingDuration(totalMinutes)} · {formatDistanceMiles(totalDistance)}
                </strong>
                <small>{centralJapanDrivingRoutes.caveat}</small>
              </>
            )}
          </dd>
          <a href="#middle-route">Edit route</a>
        </div>
        <div>
          <dt>Final city</dt>
          <dd>
            <strong>{finalCity ?? 'Not selected'}</strong>
          </dd>
          <a href="#final-city">Edit final city</a>
        </div>
      </dl>
      <section className="summary-open" aria-labelledby="summary-open-title">
        <h3 id="summary-open-title">Still to decide</h3>
        {stillToDecide.length > 0 ? (
          <ul>
            {stillToDecide.map((decision) => (
              <li key={decision}>{decision}</li>
            ))}
          </ul>
        ) : (
          <p>All required decisions are set.</p>
        )}
      </section>
    </section>
  )
}

function App() {
  const [activeSection, setActiveSection] = useState('travel-dates')
  const { scrollYProgress } = useScroll()
  const [progress, setProgress] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', (latest) => setProgress(latest))

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.scene[id]'))
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - window.innerHeight / 2) -
              Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - window.innerHeight / 2),
          )[0]
        if (!visible) return
        const element = visible.target as HTMLElement
        setActiveSection(element.dataset.decision ?? element.id)
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!window.location.hash) return
    const target = document.querySelector<HTMLElement>(window.location.hash)
    const timeout = window.setTimeout(() => target?.scrollIntoView(), 120)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <TravelerJourneyProvider>
      {/* 
        THESIS: The trip begins in a saturated dusk field before the route ledger takes over.
        OWN-WORLD: Indigo, blue-plum, warm paper, transformed public-domain fish print, and restrained grain.
        STORY: Four friends enter the planning journey, see the four decisions immediately, then move into the working maps.
        FIRST VIEWPORT: A full-height two-zone composition with a large fish print, meeting title, traveler figures, and a compact agenda.
        FORM: Experience mode; illustrated opening transitioning cleanly into the established conductor system.
      */}
      <a className="skip-link" href="#travel-dates">
        Skip to planning decisions
      </a>
      <RouteRail activeSection={activeSection} progress={progress} />
      <main>
        <OpeningScene />
        <TravelDatesScene />
        <TokyoScene />
        <RegionalTransition />
        <PlanningSummary />
        <TravelerFinale />
      </main>
      <StickyNotes />
    </TravelerJourneyProvider>
  )
}

export default App
