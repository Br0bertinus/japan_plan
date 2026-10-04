# Japan, May / June 2027

A responsive, scroll-driven planning prototype for Kate, Rob, Jules, and Milo's Japan trip. A four-step call agenda organizes the experience around Travel dates, Tokyo hotel, Middle-of-trip route, and Final city. The page includes a May / June 2027 shared hotel-stay calendar, an official-data Tokyo ward and rail map, an ordered Central Japan route builder, a read-only summary, and local section notes.

The shared Japan stay uses `japan-trip-japan-stay-v1`. The Tokyo hotel uses `japan-trip-tokyo-stay`. The ordered stops and Kyoto/Tokyo endpoint use `japan-trip-middle-route-v1`; the route builder is the only final-city control. The summary reads those three stores and has no duplicated form state. Section notes use `japan-trip-sticky-notes-v1`; they stay in the current browser, render through one global page overlay above section backgrounds, are not included in the summary, and are never sent to a backend. Driving source data stays in metric units internally, while every public distance is formatted in miles.

The first three decision mastheads contain original layered SVG destination props: an airplane, a four-sleeper lodging scene, and an outdoor stone onsen. `src/SceneProps.tsx` contains the illustrations; `src/scenePropModel.ts` defines their shared `720 × 360` coordinate system and stable anchors. `src/travelerJourneyState.ts`, `src/TravelerJourney.tsx`, and `src/TravelerScenes.tsx` implement one non-reversing page-load journey with articulated transit figures, prop-local boarding/bed/onsen handoffs, four persistent clothing bundles, a dressed dance finale, reduced-motion states, and a `Replay journey` control that resets animation only.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Validate and build

```bash
npm test
npm run lint
npm run build
```

The production output is written to `dist/`.

## Header artwork

The opening rotates Fish, Cherry, Temple, and Fuji transparent paper-print assets from `public/art/header-*-paper.png`. `src/headerPrints.ts` owns their order and seven-second cadence. One keyboard-accessible pause/play icon overlays the illustration; the print menu and current-print indicator are intentionally absent. Reduced motion keeps Fish static and hides the inactive control. CSS enlarges Cherry and Temple optically without modifying the PNGs. `scripts/build-header-print-assets.py` reproducibly processes the Cherry, Temple, and Fuji source images into the shared `1455 × 812` canvas without changing the approved Fish asset.

## Tokyo map data

The Tokyo map is generated from the 2025-01-01 edition of MLIT National Land Numerical Information Administrative Area Data (N03) and the 2022 edition of Railway Data (N02). It includes the 14-route Metro/Toei/Yamanote base network, the Odakyu Odawara and Keio Inokashira lines as selected hotel-access context, ten orientation hubs, six additional stay-decision station markers, and five hotel points verified against official hotel/operator location pages. The restored `100%` view uses the complete `0 0 1000 720` generated viewport; 140%, 180%, and 220% scale that same geographic extent for closer inspection. Deterministic collision handling keeps active hotels above other hotels, relevant access labels, wards, and secondary context. Rail geometry remains clipped to the dissolved official 23-special-ward union and checked by `src/data/tokyo-map-validation.json`. Hotel details separate Kate's planning take from sourced facts and link to official property sites without displaying or hotlinking hotel photography. Exact provenance, filtering, attribution, limitations, and processing steps are documented in [`TOKYO_MAP_DATA.md`](TOKYO_MAP_DATA.md).

Regenerate the committed map artifacts with:

```bash
npm run maps:tokyo
```

## Central Japan map data

The Central Japan map uses all 47 MLIT N03 2025 prefecture packages, MLIT W09 2005 Lake Nojiri geometry, Ministry of the Environment April 2025 Chubu-Sangaku National Park geometry, and OpenStreetMap/OSRM road data. Its fitted extent includes the complete Niigata prefecture and every supported route node. Lake Nojiri, James Brown, Shirahone, and Okuhida/Hirayu are optional stops. The map uses one diamond marker system, a 100-mile scale, a minimal location/park key, and no fixed itinerary or partial rail recommendation. Tokyo and Central Japan share the same responsive map-section gutters and wide-screen maximum; the Central map receives the flexible track while its route controls remain bounded for readable line lengths.

The generator caches 56 required directed driving pairs in `map-data/central-japan/source/driving-route-pairs-osrm.json` and writes projected frontend data to `src/data/central-japan-driving-routes.json`. The interface can compose any unique ordering of the four middle stops from the selected Tokyo hotel or Tokyo Station to Kyoto or Tokyo, then show per-leg and total distance/duration. No live route request is made by the app.

Exact provenance, licensing, projection, processing, service references, estimate assumptions, review-radius semantics, and limitations are documented in [`CENTRAL_JAPAN_MAP_DATA.md`](CENTRAL_JAPAN_MAP_DATA.md).

Regenerate the Central Japan artifact with:

```bash
npm install --prefix map-data/central-japan
npm run maps:central
```

## Stack

- Vite
- React
- TypeScript
- Motion
- Custom SVG, generated geographic SVG, CSS illustration, and one locally processed transparent PNG
- Mapshaper 0.7.68 for the reproducible Tokyo boundary and rail build
- An isolated Node cartography pipeline for the Central Japan map
