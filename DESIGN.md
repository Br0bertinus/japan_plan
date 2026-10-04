---
name: Japan Trip Route Prototype
description: A conductor's working route ledger for a shared journey through Japan.
colors:
  carbon-ink: "#182a2e"
  punched-paper: "#f0eddf"
  paper-shadow: "#d9d5c8"
  timetable-blue: "#245f73"
  oxidized-green: "#66864b"
  ticket-coral: "#e45d42"
  route-violet: "#7b6ca8"
  stamp-yellow: "#ffca4b"
  timetable-gold: "#dfaa31"
  line-hibiya: "#9caeb7"
  line-asakusa: "#e85298"
  line-fukutoshin: "#bb641d"
  line-yurikamome: "#397da0"
  map-ground: "#e3e4d4"
  map-water: "#a9c7c8"
  opening-deep: "#20264f"
  opening-indigo: "#3a3f7a"
  opening-plum: "#5f426f"
  opening-blush: "#e5a5b4"
  opening-petal: "#f0d1cf"
  opening-coral: "#d87983"
  opening-cream: "#f2ead7"
typography:
  display:
    fontFamily: "Bahnschrift Condensed, Yu Gothic UI, sans-serif"
    fontSize: "clamp(4.6rem, 11.5vw, 10rem)"
    fontWeight: 900
    lineHeight: 0.74
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Bahnschrift Condensed, Yu Gothic UI, sans-serif"
    fontSize: "clamp(2.8rem, 6vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Bahnschrift Condensed, Yu Gothic UI, sans-serif"
    fontSize: "clamp(2rem, 4vw, 4rem)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Yu Gothic UI, Meiryo, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "normal"
  label:
    fontFamily: "Bahnschrift Condensed, Yu Gothic UI, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.1em"
  map-hotel:
    fontFamily: "Bahnschrift Condensed, Yu Gothic UI, sans-serif"
    fontSize: "11.5px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.45px"
  map-area:
    fontFamily: "Bahnschrift Condensed, Yu Gothic UI, sans-serif"
    fontSize: "12.5px"
    fontWeight: 760
    lineHeight: 1
    letterSpacing: "0.55px"
  map-station:
    fontFamily: "Bahnschrift Condensed, Yu Gothic UI, sans-serif"
    fontSize: "9.5px"
    fontWeight: 780
    lineHeight: 1
    letterSpacing: "0.45px"
rounded:
  square: "0"
  detail: "2px"
  figure: "6px"
  round: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "24px"
  lg: "28px"
  xl: "48px"
components:
  action-primary:
    backgroundColor: "{colors.carbon-ink}"
    textColor: "{colors.punched-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "11px 14px"
    height: "52px"
  action-primary-hover:
    backgroundColor: "{colors.stamp-yellow}"
    textColor: "{colors.carbon-ink}"
  station-stamp:
    backgroundColor: "{colors.carbon-ink}"
    textColor: "{colors.punched-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "8px 12px 7px"
  route-ledger:
    backgroundColor: "{colors.punched-paper}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.square}"
    padding: "28px 26px 24px"
  tokyo-stay-ledger:
    backgroundColor: "{colors.punched-paper}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.square}"
    padding: "18px 18px 16px"
  sticky-note:
    backgroundColor: "{colors.stamp-yellow}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.square}"
    padding: "12px 14px"
---

# Design System: Japan Trip Route Prototype

## Overview

**Creative North Star: "The Conductor's Working Ledger"**

The interface behaves like a route document in active use: printed sheets, timetable labels, punched tickets, ruled maps, and hand-positioned notes are assembled into one continuous journey. It is graphic and tactile rather than polished like a booking product. Carbon ink provides authority, paper tones provide working space, and route colors communicate movement, alternatives, and state. The opening uses a deep inky-blue field and four locally processed paper prints in natural paper tones to create a distinct gathering place before the lighter planning ledger begins.

Four planning decisions form the information architecture: Travel dates, Tokyo hotel, Middle-of-trip route, and Final city. The route remains the visual model that supplies evidence for those choices. Scale changes, official geography, generated regional cartography, and the four travelers connect scenes into one experience; individual destinations never collapse into a generic card catalog. Tokyo combines the official 23-special-ward boundaries with all Tokyo Metro and Toei Subway routes plus the JR Yamanote loop. Central Japan uses a separately projected official-data map for complete Niigata and surrounding context, Lake Nojiri, Chubu-Sangaku, Shirahone, Okuhida, and James Brown.

**Key Characteristics:**
- Hard-edged transit typography and compact uppercase labels
- Warm punched-paper surfaces against carbon and timetable fields
- Visible rails, rules, nodes, stamps, and comparison marks
- A compact four-step call agenda integrated with the Fish, Cherry, Temple, and Fuji paper-print rotation
- A two-month local-date service calendar with patterned itinerary spans and a shared-window output
- An official Tokyo ward and rail map paired with a two-step stay-experience ledger
- A projected Central Japan map with a minimal location and park key
- A compact read-only summary sourced from the existing decision stores
- Local folded-paper notes anchored to stable sections
- A coordinated set of original airplane, lodging, and outdoor-onsen stage props
- Slightly imperfect placement with precise underlying grids
- Motion that explains travel, progress, selection, or uncertainty

## Colors

The palette combines document neutrals with transit-coded accents; most surfaces stay in carbon and paper while color marks routes, people, choices, and active state.

### Primary
- **Carbon Ink:** The dominant text, border, rail, and dark-field color; it gives every sheet and control a printed, authoritative edge.
- **Punched Paper:** The principal reading surface and inverse text color on dark transit fields.
- **Timetable Blue:** The main structural accent for regional fields, selected rows, water outlines, and transit emphasis.

### Secondary
- **Oxidized Green:** Marks landscape, the Yamanote route, and one traveler without becoming a generic success color.
- **Ticket Coral:** Marks route progress, cross-city movement, selected paths, and consequential choice.
- **Route Violet:** Distinguishes an alternate rail line, traveler, and Kyoto branch.
- **Stamp Yellow:** Reserved for temporary attention: tickets, active stops, hover states, switch points, and visible keyboard focus.
- **Timetable Gold:** Identifies the Ginza Line and selected route details that need a warmer transit reference without borrowing the focus color.

### Transit Tokens
- **Operator Route Colors:** The Tokyo map uses the canonical colors published by Tokyo Metro, Toei, and JR East. Pale and contextual routes receive paper-colored casings so they remain legible without overpowering ward boundaries.
- **Yurikamome Blue:** This remains defined for a possible later layer. Yurikamome is not included or implied in the current Metro, Toei, and Yamanote scope.

The ward map uses the established coral, yellow, green, violet, and blue accents only as restrained paper-mixed fills for west, central, east, south, and bay-side focus wards. Non-focus wards remain map-ground neutral so the complete 23-ward outline stays legible without becoming a categorical heat map.

### Neutral
- **Paper Shadow:** Grounds the page beyond the primary paper and supplies the deeper stock tone behind punched details.

### Named Rules
**The Ledger Accent Rule.** Carbon and paper carry the interface; route colors identify movement, geography, people, or state and never become ambient decoration.

**The Administrative Geography Rule.** Ward boundaries use source-derived geometry and restrained group fills; popular neighborhood names are annotations, never substituted boundaries.

## Typography

**Display Font:** Bahnschrift Condensed (with Yu Gothic UI and sans-serif fallback)  
**Body Font:** Yu Gothic UI (with Meiryo, Segoe UI, and sans-serif fallback)  
**Label Font:** Bahnschrift Condensed (with Yu Gothic UI and sans-serif fallback)

**Character:** Condensed, heavy display type reads like a departure board or stamped route heading. The Japanese-capable body stack stays calm and legible so dense planning copy does not compete with the route apparatus.

### Hierarchy
- **Display** (900, `clamp(4.6rem, 11.5vw, 10rem)`, 0.74): Giant departure statements and the strongest single scene title.
- **Headline** (900, `clamp(2.8rem, 6vw, 6rem)`, 0.92): Major stop and decision headings.
- **Title** (900, `clamp(2rem, 4vw, 4rem)`, 0.92): Place names, option titles, and large component headings.
- **Body** (400, `1rem`, 1.62): Explanations and planning context, generally held near 52–64 characters.
- **Compact title** (900, `1.5rem`, 1): Dense route-ledger totals and selected origin labels.
- **Label** (900, `0.68rem`, `0.1em`, uppercase): Station stamps, route codes, statuses, and control labels.
- **Map hotel** (900, `11.5px`, `0.45px`): Primary hotel decision annotations with a compact paper halo.
- **Map area** (760, `12.5px`, `0.55px`): Secondary ward and area context without a heavy plaque.
- **Map station** (780, `9.5px`, `0.45px`): Tertiary access and orientation utility labels.

### Named Rules
**The Condensed Voice Rule.** Use the condensed face for route authority and labels; use the body stack for explanation, comparison, and uncertainty.

## Layout

Desktop composition is organized beside a fixed 92px decision rail. Its four stops exactly match the opening agenda: Travel dates, Tokyo hotel, Middle-of-trip route, and Final city. Major evidence scenes use full-viewport sticky sections inside the long journey, with generous fluid padding and an asymmetrical working-sheet grid: orientation or map content receives the larger column while notes and decisions occupy the narrower ledger column. Scene headings pair a compact station stamp column with a broad headline column.

The first three decision mastheads share a destination-stage grammar. The numbered station marker occupies the narrow left column, a `720 × 360` illustration stage sits directly beneath it, and the decision heading remains in the broad right column. The airplane, two-bed lodging scene, and outdoor onsen use this same coordinate system, baseline, visual weight, and responsive behavior. At 780px and below, the stage moves after the heading copy and before the section controls rather than overlaying content. Character travel follows invisible measured geometry; no dotted debug or trajectory path appears in the public composition.

The opening uses a solid inky-blue `#173B57` field, retained paper-print texture, and a crisp paper transition. At large sizes, a centered two-zone grid keeps the left-aligned `JAPAN` title, meeting date, traveler figures, and agenda together in a 520px left content column; the active Fish, Cherry, Temple, or Fuji print occupies an independent right illustration column with no overlap. The automatic seven-second Fish → Cherry → Temple → Fuji sequence has no visible selector, current-print label, or indicator. One discreet 44px pause/play target overlays the illustration with a small glyph, dynamic accessible name, pressed state, tooltip, and 3px focus treatment. Cherry and Temple receive per-print optical enlargement within the clipped frame. Reduced motion disables cycling and hides the control. At 1200px and below, the order becomes title and travelers, a purposefully cropped print, then agenda with left-aligned reading text. Four direct anchor rows state the discussion topics. The date section uses a ruled service sheet with a guided check-in/check-out sequence above two equal-width month tables and one direct range output.

The Tokyo surface pairs a large official map with a narrower stay-decision ledger. The map renders all 23 special wards, clipped surrounding administrative context, Tokyo Bay, a 14-route Metro/Toei/Yamanote base network, two selected private hotel-access routes, ten orientation hubs, six stay-decision station markers, and five verified hotel points in a fixed `1000 × 720` view box. The restored `100%` state shows the complete `0 0 1000 720` extent; 140%, 180%, and 220% scale that same geography while preserving the current center. Hotel selection brings the relevant official ward, exact point, nearby source-derived stations, and included routes forward while dimming unrelated context. Hotel annotations use the primary dark-ink treatment with a compact paper halo; wards use a smaller muted slate tier; station/access labels use the restrained utility tier. A deterministic collision pass preserves active hotel, other visible hotels, relevant access labels, major wards, and secondary context in that order, suppressing lower-priority overlaps rather than shrinking every label. Park Hyatt Tokyo anchors quieter West Shinjuku, HOTEL GROOVE SHINJUKU anchors Kabukicho's entertainment-district context, Hotel Toranomon Hills anchors Toranomon/Minato, TRUNK(HOTEL) YOYOGI PARK anchors park-side Tomigaya near central Shibuya, and YUEN BETTEI DAITA anchors more residential Daita near Shimokitazawa with real Odakyu and Inokashira access. The soft hotel-area radii are visibly editorial rather than invented neighborhood or park boundaries.

The Central Japan decision presents the complete `1800 × 1120` base map beside an operational route ledger. Tokyo and Central Japan share `--map-section-max-width`, `--map-section-gutter`, and the same centered wide-screen frame. The map owns the flexible grid track and grows materially on large screens; the route ledger uses the bounded `--route-controls-max-width` track so line lengths remain readable. The static artifact contains land, coastline, park, water, a 100-mile scale, four consistent diamond stop markers, and a small location/park key. The website composes selected road legs from cached OSRM geometry. One compact travel-order component holds every optional stop: selected rows stay first with diamond route numbers, concise location notes, reorder controls, and Remove; unselected rows sit below a `Not in route` divider with Add. Projection, marker precision, and dataset detail live in a compact Map data disclosure and repository documentation.

At 780px and below, the route rail becomes a fixed 66px bottom navigator with the compact labels Dates, Hotel, Middle, and Final. The opening is a deliberate one-column composition: visible `JPN / 2027`, title and traveler figures, a purposeful crop of the active paper print with its pause/play target inset inside the content edge, then the agenda. Sticky scenes return to normal document flow, May and June stack, and two-column sheets become one column. The Tokyo SVG remains pannable instead of compressing labels. The middle-route map stays within the viewport, the ledger stacks below it, route controls keep comfortable targets, and the larger-map dialog scrolls internally. The note launcher becomes an edge-mounted bottom-left control above the persistent navigation; notes clamp to reachable section bounds.

## Elevation & Depth

Depth is structural and print-like, not atmospheric. Paper objects use crisp offset shadows in carbon-tinted translucency, while dark scenes use tonal fields, rules, grids, and contour patterns. Selected route states may add an accent-colored offset or ring; surfaces do not use blur-heavy floating cards.

### Shadow Vocabulary
- **Small Slip** (`4px 5px 0 rgba(24, 42, 46, 0.24)`): Tooltips and compact paper labels.
- **Ticket Lift** (`8px 9px 0 rgba(24, 42, 46, 0.24)`): Tickets and small transport objects.
- **Ledger Lift** (`9px 11px 0 rgba(24, 42, 46, 0.15)`): Working ledgers and decision sheets.
- **Map Lift** (`10px 12px 0 rgba(24, 42, 46, 0.15)`): Large illustrated maps.

### Named Rules
**The Printed Offset Rule.** Shadows are hard, directional, and tied to physical paper scale; never substitute soft ambient elevation or glass effects.

## Shapes

The default silhouette is rectangular and hard-edged, usually with a 2–3px carbon border. Small 2px corners may soften fabricated details, while 6px corners belong to illustrated figures rather than general containers. True circles are reserved for route nodes, avatar heads, status markers, and the unresolved waypoint.

Paper artifacts may use slight rotations of roughly one degree, punched circles, dashed perforations, or clipped ticket notches. These irregularities should feel mechanically printed and handled, never whimsical or scrapbook-like.

## Components

### Buttons
- **Shape:** Hard rectangular controls with no general corner radius.
- **Primary:** Carbon field, punched-paper text, heavy compact label type, and at least 52px height.
- **Hover / Focus:** Hover reverses to stamp yellow and carbon; keyboard focus uses a 3px stamp-yellow outline with a 4px offset.
- **Transit / Tab:** Transparent cells are divided by rules and invert to carbon or stamp yellow when active.

### Chips
- **Style:** Station stamps and route codes are rectangular ink blocks with paper text, tight padding, and uppercase tracked labels.
- **State:** Active map nodes and route markers use stamp yellow inside a carbon outline rather than rounded pills.

### Cards / Containers
- **Corner Style:** Square working sheets; no generic rounded card shell.
- **Background:** Punched-paper surfaces over paper, landscape, or dark transit fields.
- **Shadow Strategy:** Hard offset shadows follow the Printed Offset Rule.
- **Border:** 2–3px carbon strokes define maps, ledgers, tickets, and decision sheets.
- **Internal Padding:** Usually 24–28px, reduced only for narrow viewports.

### Navigation
- **Style:** The persistent decision rail is carbon with four compact labels, circular nodes, and a coral journey line. Its labels and order match the planning agenda exactly. Active decisions use paper text, a coral-filled node, and a restrained coral ring.
- **Mobile:** The same four-decision model becomes a fixed bottom rail with the labels Dates, Hotel, Middle, and Final; tooltips and brand furniture are removed rather than compressed.

### Opening Call Agenda
The agenda is semantic anchor navigation set on a solid deep-indigo panel beside the active paper print. It is a compact discussion guide rather than a status board. Four ordered rows link to Travel dates, Tokyo hotel, Middle-of-trip route, and Final city; each names the immediate planning consequence without showing completion state. The short agenda introduction carries the single planning caveat. The Travel dates row states `May / June 2027 · choose Japan stay range` and points to the date service sheet. Cream text, blush rules, and an opaque panel maintain contrast.

### Travel Dates Planner
The first decision section is a shared hotel-stay calendar rather than a traveler-by-traveler flight planner. A dark ruled control sheet states the active step, repeats the selected check-in and check-out, and provides explicit edit and reset controls. The sequence is intentionally limited to two clicks: arrival in Japan and hotel check-in first, then departure from Japan and hotel check-out.

May and June 2027 render as semantic month tables with native date buttons. Desktop shows both months side by side; mobile stacks them at full readable width. Selected hotel nights use one plain pale-green range treatment rather than decorative patterns. The boundary dates carry explicit `IN` and `OUT` stamps, and the key states that check-out is the departure date and not a hotel night. Check-out must be strictly later than check-in; invalid clicks leave the stored value unchanged and show a direct recovery message.

The final yellow output repeats the full range and computed night count. Edit returns the interaction to the check-in step, while reset clears the range. State persists in versioned browser-local storage under `japan-trip-japan-stay-v1`; the component removes the superseded individual-itinerary key. Traveler origins, flight dates, timezones, flight durations, and date-line calculations remain outside this tool.

### Character Destination Stages
The destination props are bespoke paper-and-ink scenes, not icon-library glyphs or traced reference art. All three use carbon outlines, punched-paper bodies, hard printed offsets, restrained timetable accents, and strong negative space.

- **Airplane:** A right-facing passenger silhouette with separate rear assembly, fuselage, cabin, traveler plane, foreground wing, and entry layers. Four windows provide the group cue without turning the plane into a literal seating diagram.
- **Lodging:** Two adjacent low platform beds with four pillows and four sleeper positions. Frames, mattresses, pillows, traveler plane, duvets, and foreground remain separate so characters can later land behind the covers.
- **Onsen:** An abstract rotenburo built as one shallow organic water footprint inside a continuous ring of individually shaped stones. A small asymmetric timber spout and restrained grasses provide the outdoor-bath cue; thin steam curls and four ripple arcs remain secondary. The rear stones, contained water, traveler immersion plane, front water detail, and larger foreground stones create one coherent pool so future occupants remain shoulders-and-head silhouettes behind the front rim.

Typed metadata in `scenePropModel.ts` defines approach, entry, four occupant anchors, occlusion depth, exit, view box, and layer order. The SVG roots repeat those coordinates as stable `data-*` attributes for animation without path-geometry queries. `travelerJourneyState.ts` guards the one-way page-load sequence: header, dates travel and settlement, hotel travel and settlement, middle travel and settlement, finale travel, and dancing. Responsive document checkpoints define each segment; traveler position interpolates continuously from maximum downward scroll reached during the run. Upward and revisited scrolling cannot reduce progress, a 150ms activity window stops the limb cadence after scrolling pauses, and rapid jumps queue local scene handoffs in order. A body-level transit overlay renders articulated 88px desktop / 64px compact travelers above page content and below sticky notes and navigation, then hands off to scene-local SVG poses.

Settled poses use purpose-built head groups with scene-specific scales and offsets. All four complete hair, face, and chin silhouettes fit inside per-window airplane clips. Bed bodies remain behind duvets while complete Jules/Kate and Milo/Rob heads render in a final unmasked layer above every pillow, frame, and textile stroke. At the onsen, Jules and Kate occupy the foreground as heads only; Milo and Rob occupy the rear with simple bare shoulder silhouettes in the immersion layer. All four complete heads render after water, steam, ripples, basin lines, and stones. Onsen clothing bundles are four stable nodes that toss once and remain at dry landing points. At the document bottom, a typed ten-second group timeline coordinates groove, both-hands-up, full turns, position swaps, and regrouping with articulated limbs. `Replay journey` restores the header, maximum progress, and focus at `#departure` while leaving all planning and note storage untouched. Reduced motion skips travel, boarding, jumps, toss arcs, and dance loops, showing a static raised-arm finale.

### Route Ledger
The place ledger combines a coded label, condensed place title, explanatory body copy, ruled option rows, comparison pins, and an explicit evidence disclaimer. Selected rows invert to timetable blue with punched-paper text.

### Official Tokyo Ward, Rail, and Stay Map
The Tokyo map is geographic administrative and infrastructure cartography rather than an invented neighborhood or schematic diagram. It renders the official boundaries of all 23 special wards, clipped surrounding land, Tokyo Bay, a north arrow, all nine Tokyo Metro routes, all four Toei Subway routes, the JR Yamanote loop, the Odakyu Odawara and Keio Inokashira hotel-access lines, ten selected orientation hubs, six additional decision-station markers, five official-source hotel points, and annotation labels for planning-relevant wards. Every rendered rail route is clipped after simplification to the dissolved official 23-special-ward union, so route lines terminate at the mapped administrative edge rather than continuing into unmapped gray context. Focus wards use restrained paper-mixed fills by broad geographic group; slightly heavier outlines, dashed leader lines, yellow anchor dots, uppercase ward names, and smaller planning-name subtitles provide emphasis without implying new boundaries.

The map is generated, never hand traced. `scripts/build-tokyo-wards.mjs` downloads the 2025-01-01 MLIT National Land Numerical Information Administrative Area Data (`N03`) and the 2022 Railway Data (`N02`). It isolates ward codes `13101`–`13123`, filters exact operator, route, and station names, dissolves source records, cleans the geometry, and projects every layer to WGS 84 / UTM zone 54N (`EPSG:32654`). Official hotel coordinates are converted to GeoJSON and projected through the same Mapshaper command and viewport transform. Mapshaper `0.7.68` performs weighted-area simplification (`12%` for wards, `8%` for context, `35%` for routes), clips simplified routes and selected station geometry against the projected ward union, and emits TopoJSON source artifacts before the generated TypeScript converts projected geometry to SVG paths. The generator also writes a validation record proving the rendered route samples stay inside the union, that the decision validation extent contains all five hotel pins and six stay-decision markers, and that the public `100%` view is `0 0 1000 720`. N03 is CC BY 4.0; N02-22 is documented according to the exact permission and attribution wording on its official dataset page.

The full rail network is visible with paper casings and low default opacity. Stay selection controls default emphasis: Park Hyatt brings Toei Oedo and Yamanote forward; HOTEL GROOVE SHINJUKU brings Marunouchi and Yamanote forward with a source-derived Seibu-Shinjuku marker; Hotel Toranomon Hills brings Hibiya forward; TRUNK(HOTEL) YOYOGI PARK brings Chiyoda and Yamanote forward with a source-derived Yoyogi-Koen marker; and YUEN BETTEI DAITA brings the real Odakyu and Inokashira geometry plus Setagaya-Daita and Shimokitazawa forward. The interactive selector remains limited to the 14-route base network; a smaller legend labels the two private hotel-access lines so they do not read as Metro or Toei routes.

### Map Scale Controls
The scale bar sits above the geographic viewport and behaves like a compact instrument panel rather than a floating map widget. `100%` is the centered complete `0 0 1000 720` view recovered from the earlier approved implementation. Plus moves through `140%`, `180%`, and `220%`; minus returns through the same ladder; and “Reset” returns to the centered full view. The current viewport center is preserved while changing scale. Controls are native buttons with visible focus, disabled end states, and 44px touch targets on mobile. Zoom changes do not alter source geometry or route alignment.

### Tokyo Stay Decision Ledger
The companion punched-paper ledger asks for the experience path first and hotel second. Path A compares three distinct central/iconic contexts: Park Hyatt Tokyo in quieter West Shinjuku, HOTEL GROOVE SHINJUKU in Kabukicho, and Hotel Toranomon Hills in Toranomon/Minato. Path B compares two lower-key settings: TRUNK(HOTEL) YOYOGI PARK in Tomigaya near central Shibuya and YUEN BETTEI DAITA in more residential Daita near Shimokitazawa. A selected hotel reveals a concise **Planning take** with two or three pros and one or two tradeoffs, followed by a safely labeled canonical official-site link. Verified map, station, and operator context stays in a compact disclosure so subjective judgments are not presented as sourced facts. The profile model accepts a future curated local image with alt text and optional credit, but no image element is rendered while that field is absent. No official photography is copied, scraped, or hotlinked.

### Central Japan Route Map
The regional map is generated from all 47 MLIT N03 2025 prefecture packages, MLIT W09 2005 Lake Nojiri geometry, Ministry of the Environment April 2025 Chubu-Sangaku geometry, and OpenStreetMap/Nominatim location anchors. Every main-map layer uses one Lambert conformal conic projection on GRS80. The viewport is fitted from complete Niigata plus required route nodes and trip features, then expanded for spatial context-land selection. The base map intentionally contains no fixed route line or partial rail.

Shirahone is represented in Nagano. Okuhida Onsen-go uses Hirayu as its Gifu transport anchor. Source precision and editorial review radii remain in provenance rather than visible map labels.

All four selectable middle locations use the same open diamond marker. Yellow fill, a numbered diamond, and coral route overlay express selection and order. James Brown appears in the official Seiro-machi main-map position using an area-weighted centroid of public municipality polygons only. It has no private residential detail.

The website overlays four keyboard-accessible candidate controls aligned to the generated SVG and mirrors them in an add-stop ledger. Selected stops receive sequence numbers; clicking a selected map marker removes it. Generated overlay coordinates live in `src/data/central-japan-map-points.json`, written by the same map pipeline.

### Ordered Driving Route

The builder accepts any unique subset of Lake Nojiri, James Brown, Shirahone, and Okuhida. Add, remove, move earlier, move later, and reset controls avoid drag-only interaction. The start derives from the selected Tokyo hotel or Tokyo Station; the endpoint synchronizes with the Kyoto/Tokyo final choice. State persists under `japan-trip-middle-route-v1`.

The frontend composes adjacent legs from 56 cached directed OSRM pairs projected into the same map coordinate system. A coral road overlay, per-leg metrics, and summed distance/duration update immediately when order or endpoint changes. Source distances remain metric; `formatDistanceMiles()` provides every public miles value without false precision. One route-level caveat excludes live traffic.

### Alps and Onsen Follow-up

Chubu-Sangaku remains a desired experience whose gateway and itinerary association are unresolved. Shirahone remains the Nagano/east candidate; Okuhida remains a five-town Gifu/west region represented through Hirayu. Detailed public-transport and rental-car research stays in the repository until the group narrows the selected stops and travel assumptions.

### Rail Route Selector
The selector is a compact ruled legend under the map. Seven priority routes stay immediately available; the remaining seven are disclosed in a native `details` section. Every route button uses `aria-pressed`, a canonical color swatch, and a full route-name status line. “Show full network” restores the default geographic overview.

### Read-only Planning Summary
The final sheet reads the existing date, hotel, ordered route, and endpoint stores. It shows actual values, direct edit anchors, and only genuinely missing required decisions. It has no buttons for Kyoto or Tokyo and no separate persistence.

### Section Notes
A fixed folded-note launcher creates multiple local notes in the currently visible major section. One body-level overlay renders every note above section isolation, maps, transforms, and overflow while retaining each section ID and relative position as data. The overlay ignores pointer input; each note restores it. Normal notes occupy the note layer, the active drag is elevated within that layer, navigation remains accessible above it, and the launcher and Undo toast sit at the top UI layer. Notes use restrained yellow, blush, sage, or blue paper; a small deterministic rotation; a dedicated drag handle; plain autosaving text; a two-row control bar with an always-visible Delete control; section movement; color selection; and timed Undo. New notes cascade rather than covering one another. Arrow keys move by 8px, Shift plus arrow moves by 32px, and Alt plus vertical arrows or the section buttons re-anchor the note. Horizontal position is stored as a ratio so notes remain reachable after resizing. Deleting focuses the nearest remaining note, or the launcher when none remain; Undo restores the exact note and focuses its textarea. Note content stays only in `japan-trip-sticky-notes-v1` and is excluded from the summary.

## Do's and Don'ts

### Do:
- **Do** make the route, rail, map, node, or ledger structure visible whenever it carries meaning.
- **Do** use stamp yellow for temporary attention and focus, not as a broad background theme.
- **Do** use direct copy that states what is confirmed, what must be decided, and which tradeoffs matter.
- **Do** keep the site-level planning caveat concise and repeat only caveats required for a specific estimate.
- **Do** preserve full keyboard focus and reduced-motion behavior when adding interactions.
- **Do** stack the working sheets on small screens while keeping the route navigation persistent.
- **Do** preserve all 23 official ward boundaries, surrounding context, Tokyo Bay, and the distinction between official wards and informal planning names.
- **Do** regenerate Tokyo geometry through the MLIT N03/N02 → UTM 54N → Mapshaper workflow rather than editing generated SVG paths by hand.
- **Do** keep focus-ward color restrained, keep rail context subordinate to boundaries, and preserve readable mobile panning and route disclosure.
- **Do** keep map zoom bounded, center-preserving, keyboard operable, and independent from the generated geographic data.
- **Do** keep the Central Japan route map static; route geometry can reveal with scroll progress, but no vehicle should move along it.

### Don't:
- **Don't** turn destinations or options into a generic rounded travel-card grid.
- **Don't** introduce glassmorphism, soft ambient shadows, excessive gradients, or decorative blur.
- **Don't** use color without route, traveler, landscape, or interaction meaning.
- **Don't** replace transit labels and custom cartography with emoji or generic travel imagery.
- **Don't** treat unresolved choices as errors; show them as intentional open waypoints.
- **Don't** invent route segments, station coverage, neighborhood boundaries, or Odaiba service that is not present in the cited datasets.
- **Don't** promote every station label or rail route to equal visual weight; preserve geographic hierarchy and progressive disclosure.
- **Don't** collapse the mobile map to fit the viewport; preserve its pannable inspection width and swipe instruction.
