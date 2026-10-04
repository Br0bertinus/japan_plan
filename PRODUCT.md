# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Kate, Rob, Jules, and Milo are planning a shared May / June 2027 trip to Japan. They need a compelling way to understand the trip as a connected journey, orient themselves within unfamiliar places, and identify the decisions that still need to be made together.

## Product Purpose

The prototype turns an early itinerary into a four-decision journey. Success means the group can choose travel dates, a Tokyo hotel, the middle-of-trip route, and the final city, then move into booking and deeper itinerary research with the major route shape resolved.

## Positioning

Instead of presenting a trip as a spreadsheet, booking funnel, or collection of destination cards, the experience makes the route itself the interface: scale, motion, illustrated maps, and traveler characters carry the group from decision to decision.

## Operating Context

This is a story-first planning prototype used before detailed booking and collaborative itinerary management. It explicitly organizes the trip around four decisions in order: travel dates, Tokyo hotel, middle-of-trip route, and final city. Travel can span May and June 2027; the date tool records one shared Japan hotel check-in and check-out range without guessing flight dates or a total trip length. No middle-trip destination is confirmed: Lake Nojiri, James Brown, Shirahone, and Okuhida are optional stops that can be added and reordered, while Chubu-Sangaku remains a desired experience to fit into the route later. The final decision is Kyoto versus returning to Tokyo. Restaurants, coffee shops, shopping, attractions, and day-by-day itinerary detail remain outside this prototype.

## Capabilities and Constraints

- Long, continuous, scroll-driven journey with sticky scenes and persistent route navigation.
- A compact four-step call agenda sits beside a rotating set of four locally processed paper prints: Fish, Cherry, Temple, and Fuji. One discreet overlaid pause/play control manages the automatic sequence; reduced motion keeps the print static and hides the inactive control.
- Public copy states confirmed facts, open decisions, and useful tradeoffs directly. It avoids poetic scene-setting, implementation narration, and repeated disclaimer language.
- Route estimates carry one concise no-live-traffic caveat beside the route output.
- The persistent route rail uses the same four names and order as the agenda: Travel dates, Tokyo hotel, Middle-of-trip route, and Final city.
- Choosing all four decisions provides the shared Japan stay window, route shape, and final city needed to move into flight selection, hotel booking, and detailed planning.
- Choosing the Tokyo hotel unlocks neighborhood-specific Tokyo research.
- Choosing the middle route unlocks deeper research for the selected stops, driving assumptions, onsen choice, and Alps plan.
- The route builder owns the Kyoto/Tokyo endpoint. The Final city agenda link targets that control directly.
- The Travel dates agenda row states `May / June 2027 · choose Japan stay range` and anchors to a dedicated date-planning section.
- The date planner uses a guided two-click sequence: arrival in Japan and hotel check-in first, then departure from Japan and hotel check-out.
- Check-out must be later than check-in and is not counted as a hotel night. Invalid clicks leave the stored value unchanged and show a direct recovery message.
- May and June 2027 render side by side on desktop and stack on mobile. Calendar buttons expose explicit `IN` and `OUT` markers plus a plain continuous hotel-night range.
- Flight dates, traveler origins, timezones, flight durations, and international-date-line calculations remain outside this tool and can be added after the shared Japan stay window is chosen.
- Stylized fictional avatar figures for Kate, Rob, Jules, and Milo; no realistic likenesses.
- Three original vector destination props support the traveler journey without copying stock references: a four-window passenger airplane in Travel dates, a two-bed/four-sleeper lodging scene in Tokyo hotel, and a four-person outdoor stone onsen in the middle-route scene.
- Every prop uses the same `720 × 360` stage coordinate system and exposes typed approach, entry, four occupant, occlusion-plane, and exit anchors. One page-load-scoped state machine moves a single logical traveler group from the header through airplane boarding, the Jules/Kate and Milo/Rob bed pairs, the onsen with four shirt-color bundles, and a persistent dressed dance finale. Position is continuously derived from maximum downward scroll progress: pausing stops the limbs, upward or revisited scrolling never reverses the journey, and new walking begins only past the previous maximum. `Replay journey` resets only animation state.
- Custom SVG and CSS cartography rather than a paid map API.
- Tokyo geography starts from official MLIT N03 administrative boundaries for all 23 special wards, processed through one consistent projection and topology-preserving simplification workflow.
- Tokyo transit context uses official MLIT N02 2022 railway and station geometry for all nine Tokyo Metro routes, all four Toei Subway routes, the JR Yamanote operational loop, and the Odakyu Odawara and Keio Inokashira lines as selected hotel-access context.
- Ward boundaries are official units; popular neighborhoods are more granular or informal planning references that must be layered separately.
- The Tokyo map includes a compact keyboard-accessible selector for the 14-route base network, a separate secondary legend for selected hotel-access lines, and ten orientation hubs, while omitting exhaustive station labels, live service information, landmarks, and detailed neighborhood unions.
- The Tokyo map supports four keyboard-accessible scale levels with scroll or touch panning for closer inspection.
- The approved Tokyo `100%` state is the full `0 0 1000 720` map extent. Visible labels use deterministic priority and collision suppression so hotel decisions remain legible without discarding geographic context.
- Five hotel points use coordinates published through official hotel/operator location pages and are grouped into two experience paths rather than presented as a generic neighborhood directory.
- Selecting a Tokyo path or hotel brings its ward, exact hotel pin, nearby source-derived station markers, and relevant included rail routes forward while preserving the full network as geographic context.
- Tomigaya/Yoyogi Park and Daita/Shimokitazawa are shown with explicitly editorial point catchments, never as official polygons. Yoyogi-Koen, Setagaya-Daita, and Shimokitazawa station context comes from N02 geometry. Odakyu and Keio Inokashira are drawn only as truthful YUEN access context; unrelated private rail remains outside the base layer.
- Jiyugaoka is intentionally excluded until there is a hotel candidate.
- Odaiba is not shown as served by the included network; Yurikamome remains explicitly deferred.
- Central Japan geography uses a consistently projected map built from all 47 MLIT N03 2025 prefecture packages, MLIT lake data, and Ministry of the Environment national-park geometry. The fitted extent contains the complete Niigata prefecture plus every route-builder node.
- Tokyo and Central Japan use the same responsive map-section gutters and wide-screen maximum. The Central map grows in the flexible track while route controls stay in a bounded reading column.
- Lake Nojiri, James Brown, Shirahone, and Okuhida are optional middle stops. One diamond marker system is used on the map and route list; fill, route number, and accent express interaction state.
- James Brown uses a municipality-level point derived from official Seiro-machi MLIT N03 2025 geometry. No street address or house-level coordinate is stored or displayed.
- The base map shows no partial rail line or fixed itinerary path. Selected road geometry appears only after the user builds a route.
- Shirahone Onsen is in Nagano. Okuhida Onsen-go is represented through Hirayu in Gifu.
- Onsen review circles are editorial planning radii, not official administrative or tourism boundaries.
- Chubu-Sangaku remains a desired experience rather than a fixed stop. The later planning question is whether it fits a Lake Nojiri outing, a Shirahone or Okuhida stay, or another route.
- The ordered route builder accepts any unique subset of the four middle stops in one compact list. Selected stops stay first with route numbers and keyboard move/remove controls; unselected stops remain below a `Not in route` divider with Add controls. Add appends, Remove returns a stop to the lower group, Reset leaves all options visible, and focus follows rows as they move. The builder derives its origin from the selected Tokyo hotel or Tokyo Station and owns the Kyoto/Tokyo endpoint.
- The app composes 56 cached directed OSRM driving pairs over OpenStreetMap road data. Each selected leg shows duration and a centrally formatted miles value; totals are summed from the exact displayed legs.
- Driving estimates exclude live traffic and should be rechecked before travel.
- The site does not embed or synchronize Google Maps.
- The Tokyo hotels are real verified candidates, but their inclusion is planning content rather than a recommendation or booking claim.
- Each hotel selection separates official location/transit context from a concise **Planning take** containing Kate's working pros and tradeoffs. Points statements are user-supplied planning facts, not live redemption or availability claims.
- Each hotel exposes a verified canonical operator website in a safely labeled new tab. Hotel profiles support future curated local images, but no photography is copied, scraped, hotlinked, or displayed in this version.
- No invented availability, prices, ratings, unsupported luxury claims, endorsements, or travel-time guarantees.
- Responsive desktop and mobile behavior with semantic structure, keyboard access, visible focus, and reduced-motion support.
- The final section is a read-only summary of dates, Tokyo hotel, route, endpoint, and genuinely unset required decisions. Edit links return to the owning controls.
- Multiple folded-paper notes can be created, edited, colored, dragged, moved by keyboard, re-anchored between stable sections, deleted, and restored with Undo. Every note keeps its own always-visible controls. Notes render in one document-level layer above page sections while section anchors remain the positioning model. They are versioned under `japan-trip-sticky-notes-v1`, remain local to the browser, and never enter route state, URLs, logs, documentation, or summary content.
- This version has no accounts, shared editing, booking integration, or production itinerary backend. The shared Japan stay range uses `japan-trip-japan-stay-v1`; the Tokyo choice uses `japan-trip-tokyo-stay`; and the ordered middle route and endpoint use `japan-trip-middle-route-v1`.

## Brand Commitments

The experience must feel culturally respectful and specific without relying on clichéd red-circle motifs, generic travel-template styling, decorative glassmorphism, excessive gradients, or emoji as interface. Its visual world may draw from Japanese transit ephemera, field notebooks, illustrated rail maps, and related systems.

## Evidence on Hand

The travelers, planning questions, candidate locations, and interaction requirements are provided in the project brief. The group enters one shared Japan hotel range in the browser-local planner; no flight dates or total trip length are assumed. Official MLIT N03 2025 municipality geometry supplies the coarse Seiro-machi family-stop context without using private residential data. Cached OSRM results provide complete road geometry between supported nodes without live routing calls. Official hotel/operator pages provide names, addresses, location coordinates, and stable access facts for the five Tokyo candidates. No hotel inventory, live availability, ratings, prices, or booking evidence is available; the prototype must not fabricate them.

## Product Principles

1. The four planning decisions are the primary information architecture; the maps and comparisons provide the facts needed to discuss them.
2. Place is explained through orientation and movement, not promotional claims.
3. Unresolved choices should feel intentional and inviting rather than incomplete.
4. Unresolved options and travel-time estimates must be labeled as planning information without repeating the same disclaimer in every card.
5. Motion should clarify scale, travel, and decision points while remaining optional.

## Accessibility & Inclusion

Honor `prefers-reduced-motion`, support keyboard navigation and focus visibility, maintain readable contrast, use semantic landmarks and controls, and preserve the full planning story at every viewport size.
