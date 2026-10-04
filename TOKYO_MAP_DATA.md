# Tokyo Map Data

The Tokyo map uses official administrative and railway geometry. It does not copy the third-party “Tokyo Special Wards” Google My Map or its downloadable KML, and it contains no hand-drawn rail paths.

## Administrative boundary source

- **Publisher:** Ministry of Land, Infrastructure, Transport and Tourism (MLIT), Japan
- **Dataset:** National Land Numerical Information, Administrative Area Data (`N03`)
- **Edition:** 2025 edition, boundaries current as of **2025-01-01**
- **Dataset page:** <https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html>
- **Terms:** <https://nlftp.mlit.go.jp/ksj/other/agreement.html>
- **License shown by MLIT:** Open Data (`CC BY 4.0`)

The build uses the prefectural packages needed to preserve the Tokyo Bay silhouette and nearby land context:

- Saitama (`N03-20250101_11`): <https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_11_GML.zip>
- Chiba (`N03-20250101_12`): <https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_12_GML.zip>
- Tokyo (`N03-20250101_13`): <https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_13_GML.zip>
- Kanagawa (`N03-20250101_14`): <https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_14_GML.zip>

## Railway source

- **Publisher:** Ministry of Land, Infrastructure, Transport and Tourism (MLIT), Japan
- **Dataset:** National Land Numerical Information, Railway Data (`N02`)
- **Product specification:** Version 3.1
- **Reference year:** 2022 fiscal year
- **Dataset page:** <https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v3_0.html>
- **Archive:** <https://nlftp.mlit.go.jp/ksj/gml/data/N02/N02-22/N02-22_GML.zip>
- **Source coordinate system:** JGD2011 geographic longitude and latitude
- **Terms:** <https://nlftp.mlit.go.jp/ksj/other/agreement.html>

The N02 page currently states, literally, “FY2021: under the applicable terms (open data); other years: commercial use permitted.” This build uses the 2022 archive, so the repository records the explicit commercial-use permission and follows the site terms that require source attribution and disclosure of editing or processing. It does not describe N02-22 as CC BY 4.0.

The rail archive contains legal route sections rather than a schematic passenger map. Route display names and colors are checked against the official operator maps:

- Tokyo Metro route map: <https://www.tokyometro.jp/en/subwaymap/pdf/routemap_en.pdf>
- Toei Subway route map: <https://www.kotsu.metro.tokyo.jp/eng/services/pdf/rosen_en.pdf>
- JR East railway maps: <https://www.jreast.co.jp/en/multi/downloads/>

## Tokyo stay-decision points

The five hotel candidates are real properties. Names, addresses, stable access facts, and point coordinates are taken from official hotel/operator pages rather than inferred from a third-party map:

| Map code | Hotel | Official location | Coordinate used | Official source |
|---|---|---|---|---|
| A1 | Park Hyatt Tokyo | 3-7-1-2 Nishi-Shinjuku, Shinjuku, Tokyo 163-1055 | `139.6885232128674, 35.68514901557579` from the official page's embedded map | <https://restaurants.tokyo.park.hyatt.co.jp/en/access/> |
| A2 | HOTEL GROOVE SHINJUKU, A PARKROYAL Hotel | 1-29-1 Kabukicho, Shinjuku-ku, Tokyo 160-0021 | `139.7006653, 35.6960038` from the official hotel's Google Maps link | <https://www.hotelgroove.jp/en/access/> |
| A3 | Hotel Toranomon Hills, The Unbound Collection by Hyatt | 2-6-4 Toranomon, Minato-ku, Tokyo 105-0001 | `139.74998, 35.66615` from official Hyatt map metadata | <https://www.hyatt.com/unbound-collection/en-US/tyoub-hotel-toranomon-hills/parking-and-transportation> |
| B1 | YUEN BETTEI DAITA | 2-31-26 Daita, Setagaya-ku, Tokyo 155-0033 | `139.6611952, 35.6582466` from the official UDS Hotels map link | <https://www.uds-hotels.com/yuenbettei/daita/access/> |
| B2 | TRUNK(HOTEL) YOYOGI PARK | 1-15-2 Tomigaya, Shibuya-ku, Tokyo 151-0063 | `139.6923539, 35.6668094` from the official hotel's Google Maps link | <https://yoyogipark.trunk-hotel.com/en/access> |

Canonical property pages used for the UI's **Official website** links:

- Park Hyatt Tokyo: <https://www.hyatt.com/park-hyatt/en-US/tyoph-park-hyatt-tokyo>
- HOTEL GROOVE SHINJUKU: <https://www.hotelgroove.jp/en/>
- Hotel Toranomon Hills: <https://www.hyatt.com/unbound-collection/en-US/tyoub-hotel-toranomon-hills>
- YUEN BETTEI DAITA: <https://www.uds-hotels.com/en/yuenbettei/daita/>
- TRUNK(HOTEL) YOYOGI PARK: <https://yoyogipark.trunk-hotel.com/en>

Sources were checked on **2026-10-03**. The UI uses only stable positioning and access facts: Park Hyatt Tokyo's West Shinjuku location and published JR Shinjuku access context; HOTEL GROOVE SHINJUKU's Tokyu Kabukicho Tower address plus published Seibu-Shinjuku and Shinjuku access; Hotel Toranomon Hills' direct basement connection to Toranomon Hills Station on the Hibiya Line; YUEN BETTEI DAITA's published approximate one-minute access from Setagaya-Daita and approximate eight-minute access from Shimokitazawa; and TRUNK(HOTEL) YOYOGI PARK's official Tomigaya address and park-side setting. The official TRUNK pages state that the property is in Tomigaya, Shibuya, across Inokashira Street from Yoyogi Park: <https://yoyogipark.trunk-hotel.com/en/about> and <https://yoyogipark.trunk-hotel.com/en/tomigaya>. The Tokyu Kabukicho Tower site independently identifies HOTEL GROOVE SHINJUKU as the tower's lifestyle hotel: <https://www.tokyu-kabukicho-tower.jp/hotelgroove/>. The UI does not add prices, availability, ratings, booking status, or unsupported service claims.

Pros, tradeoffs, relative luxury judgments, and the two points statements are labeled **Planning take · Kate's working assessment**. They are user-supplied decision inputs, not operator claims, rankings, or live redemption evidence. Hotel profiles support an optional curated local-image record, but no image record is populated and no hotel photography is displayed or hotlinked in this pass.

The hotel coordinates are converted to GeoJSON points, projected through the same Mapshaper `EPSG:32654` command as the ward and railway layers, and fitted through the same viewport projector. The map does not manually nudge any hotel point.

## Attribution

Source: Ministry of Land, Infrastructure, Transport and Tourism, National Land Numerical Information Download Site, “Administrative Area Data (N03), 2025 edition,” <https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html>, licensed under CC BY 4.0.

Source: Ministry of Land, Infrastructure, Transport and Tourism, National Land Numerical Information Download Site, “Railway Data (N02), product specification 3.1, 2022 reference year,” <https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v3_0.html>.

This project processes both sources into clipped, projected, simplified TopoJSON and SVG path data. The processed output is not presented as an unmodified MLIT product.

## Processing

Run `npm run maps:tokyo`. The generator in `scripts/build-tokyo-wards.mjs` performs these deterministic steps:

1. Download the four official MLIT N03 prefectural archives and the N02-22 railway archive, then extract the supplied GeoJSON files into `.cache/tokyo-wards/`.
2. Select Tokyo special-ward codes `13101` through `13123`.
3. Dissolve multipart records by `N03_007` ward code while preserving `N03_004` ward names, producing exactly 23 ward features.
4. Run Mapshaper topology cleaning so shared ward edges are represented consistently.
5. Project every layer to **WGS 84 / UTM zone 54N (`EPSG:32654`)**. Individual wards are never stretched or repositioned.
6. Simplify the ward layer to 12% retained weighted-area detail with `keep-shapes`; simplify surrounding land to 8%.
7. Merge and dissolve Saitama, Chiba, Tokyo, and Kanagawa land polygons, then clip the context to `139.44,35.49,140.06,35.85`.
8. Export topology-preserving source artifacts:
   - `src/data/tokyo-wards.topo.json`
   - `src/data/tokyo-context.topo.json`
9. Dissolve the 23 projected ward features into one official mapped-region union used only as the rail and station clipping boundary.
10. Filter N02 railway sections by exact operator and official route name, including the special Yamanote composition described below.
11. Dissolve railway sections by the project's stable route ID, clean them, project them to `EPSG:32654`, simplify them to 35% weighted-area detail, and then clip the simplified route geometry to the dissolved 23-ward union. Clipping after simplification prevents generalized chords from extending back outside the official region.
12. Export `src/data/tokyo-rail.topo.json` containing 16 clipped route features: 14 base-network routes and two selected hotel-access routes.
13. Filter the N02 station layer to ten orientation hubs plus six stay-decision markers, project the selected station geometry, clip it to the same ward union, and calculate one display point per station group.
14. Convert the five official hotel coordinates to GeoJSON and project them to `EPSG:32654` through Mapshaper. Hotel points, ward outlines, labels, and focus treatments are not clipped by the route-only boundary rule.
15. Generate `src/data/tokyoWardMap.ts`, which fits all source layers into one `1000 × 720` coordinate space and exports two view boxes:
    - `overview`: the complete 23-ward context and restored public `100%` view, exactly `0 0 1000 720`.
    - `decision`: a computed validation extent containing all five hotel points, all six stay-decision stations, linked orientation stations, and the four hotel wards with controlled padding.
16. Write `src/data/tokyo-map-validation.json`. The build fails if sampled route vertices or segment interiors fall outside the ward union, or if the decision validation extent excludes a required hotel or stay-station marker. The record also stores the public `100%` view box.

Mapshaper is pinned to version `0.7.68` in the generator command. No boundary or route is hand-traced, and no individual area is manually distorted.

## Public view and label layout

The public zoom ladder is `100%`, `140%`, `180%`, and `220%`. All four levels use the complete `0 0 1000 720` geography; closer levels scale the SVG and preserve the current pan center. This restores the approved farther-out default while leaving the clipped rail geometry unchanged.

Displayed labels are measured in SVG coordinates after layout. A deterministic priority pass accepts non-colliding labels in this order: active hotel, other visible hotel, relevant hotel-access station, decision/orientation station, major ward, then secondary context. Stable IDs break equal-priority ties. Candidate bounds are checked against hotel and station markers plus padded map edges; narrow viewports use larger collision padding. The active hotel label is retained, while conflicting lower-priority text is suppressed without removing the underlying station or hotel marker.

## Railway filtering

| Display route | Operator filter | Exact N02 route name(s) | Source features |
|---|---|---|---:|
| Ginza Line | `東京地下鉄` | `3号線銀座線` | 38 |
| Marunouchi Line | `東京地下鉄` | `4号線丸ノ内線`, `4号線丸ノ内線分岐線` | 61 |
| Hibiya Line | `東京地下鉄` | `2号線日比谷線` | 45 |
| Tozai Line | `東京地下鉄` | `5号線東西線` | 48 |
| Chiyoda Line | `東京地下鉄` | `9号線千代田線` | 43 |
| Yurakucho Line | `東京地下鉄` | `8号線有楽町線` | 50 |
| Hanzomon Line | `東京地下鉄` | `11号線半蔵門線` | 28 |
| Namboku Line | `東京地下鉄` | `7号線南北線` | 38 |
| Fukutoshin Line | `東京地下鉄` | `13号線副都心線` | 22 |
| Toei Asakusa Line | `東京都` | `1号線浅草線` | 44 |
| Toei Mita Line | `東京都` | `6号線三田線` | 56 |
| Toei Shinjuku Line | `東京都` | `10号線新宿線` | 45 |
| Toei Oedo Line | `東京都` | `12号線大江戸線` | 89 |
| JR Yamanote Line | `東日本旅客鉄道` | `山手線`, selected `東海道線`, selected `東北線` | 125 |
| Odakyu Odawara Line | `小田急電鉄` | `小田原線` | 100 |
| Keio Inokashira Line | `京王電鉄` | `井の頭線` | 33 |

The pipeline selects 865 source section features and dissolves them into 16 display routes: the 14-route base network of nine Tokyo Metro, four Toei Subway, and one JR East route, plus the two hotel-access private rail routes.

### Yamanote composition

N02 records the legal `山手線` route only between Shinagawa, Shinjuku, and Tabata. The passenger-facing loop continues on legal Tokaido and Tohoku route sections. The generator therefore composes the operational orientation loop from:

- all JR East `山手線` features;
- JR East `東海道線` features whose mean coordinate falls within `139.73,35.62,139.78,35.69`; and
- JR East `東北線` features whose mean coordinate falls within `139.75,35.675,139.785,35.75`.

These are source-derived legal-route sections. The composition can include closely parallel track geometry because N02 represents infrastructure sections, not a single schematic centerline.

### Route emphasis and colors

The 14-route Metro/Toei/Yamanote base network remains visible, with the Odakyu Odawara and Keio Inokashira lines added as subdued hotel-access context. The selected hotel controls the default emphasis: Park Hyatt brings Toei Oedo and Yamanote forward; HOTEL GROOVE SHINJUKU brings Marunouchi and Yamanote forward plus its source-derived Seibu-Shinjuku marker; Hotel Toranomon Hills brings Hibiya forward; TRUNK(HOTEL) YOYOGI PARK brings Chiyoda and Yamanote forward; and YUEN BETTEI DAITA brings the Odakyu and Inokashira access lines plus Setagaya-Daita and Shimokitazawa forward. The keyboard route selector isolates base-network routes; a separate compact legend identifies the selected private access lines without presenting them as additional subway routes.

The 14-route base network uses the canonical operator colors documented in the official maps linked above. The two hotel-access routes use distinct secondary display colors so they remain legible without reading as additional subway lines:

| Route | Color |
|---|---|
| Ginza | `#f39700` |
| Marunouchi | `#e60012` |
| Hibiya | `#9caeb7` |
| Tozai | `#00a7db` |
| Chiyoda | `#009944` |
| Yurakucho | `#d7c447` |
| Hanzomon | `#9b7cb6` |
| Namboku | `#00ada9` |
| Fukutoshin | `#bb641d` |
| Toei Asakusa | `#e85298` |
| Toei Mita | `#0079c2` |
| Toei Shinjuku | `#6cbb5a` |
| Toei Oedo | `#b6007a` |
| JR Yamanote | `#80c241` |
| Odakyu Odawara hotel access | `#2288cc` |
| Keio Inokashira hotel access | `#dd0077` |

## Selected station markers

The map includes ten orientation markers rather than treating every stop equally:

- Shinjuku
- Shibuya
- Ikebukuro
- Ueno
- Asakusa
- Akihabara
- Tokyo / Otemachi, grouped from the two official N02 station names
- Ginza
- Roppongi
- Shinagawa

Each marker is derived from the selected N02 station geometry and records the included routes serving it. On mobile, primary labels remain visible while secondary labels appear when their route is selected.

The hotel-decision layer adds six station markers from the same N02 archive:

| Display marker | Exact N02 station name | Source route context | Used for |
|---|---|---|---|
| Tochomae | `都庁前` | Toei Oedo Line | Park Hyatt Tokyo |
| Seibu-Shinjuku | `西武新宿` | Seibu Shinjuku Line | HOTEL GROOVE SHINJUKU |
| Toranomon Hills | `虎ノ門ヒルズ` | Tokyo Metro Hibiya Line | Hotel Toranomon Hills |
| Setagaya-Daita | `世田谷代田` | Odakyu Odawara Line | YUEN BETTEI DAITA |
| Shimokitazawa | `下北沢` | Odakyu Odawara and Keio Inokashira lines | YUEN BETTEI DAITA |
| Yoyogi-Koen | `代々木公園` | Tokyo Metro Chiyoda Line | TRUNK(HOTEL) YOYOGI PARK |

Odakyu and Keio Inokashira are not part of the Metro/Toei/Yamanote base layer, but their N02 geometry is now drawn as selected hotel-access context because it is essential to representing YUEN BETTEI DAITA truthfully. Seibu-Shinjuku remains a source-derived station marker without the full Seibu Shinjuku Line: HOTEL GROOVE is already visibly connected to the nearby Shinjuku base network, so expanding another private railway would not resolve a comparable map omission.

## Stay-decision interpretation

The hotel pins are grouped into two editorial experience paths:

- **Central / iconic Tokyo splurge:** Park Hyatt Tokyo in quieter West Shinjuku, HOTEL GROOVE SHINJUKU in Kabukicho's entertainment district, and Hotel Toranomon Hills in Toranomon/Minato. These are three distinct locations within one broad experience path, not interchangeable neighborhood claims.
- **Lower-key neighborhood retreat:** TRUNK(HOTEL) YOYOGI PARK in park-side Tomigaya, closer to central Shibuya, or YUEN BETTEI DAITA in more residential Daita with Shimokitazawa nearby. These are two distinct lower-key settings rather than interchangeable neighborhood claims.

Selecting a path or hotel changes emphasis only. It never changes the source geometry. The relevant official ward, hotel point, nearby station markers, and included routes come forward while unrelated detail remains visible at lower contrast.

The Tomigaya/Yoyogi Park and Daita/Shimokitazawa circles are editorial inspection radii centered on hotel points. They are not official ward, neighborhood, park, station-catchment, walk-time, or service boundaries. Tomigaya, Yoyogi Park, Daita, and Shimokitazawa are represented by accurate points and editorial labels over official ward geography. Jiyugaoka is intentionally absent because there is no current hotel candidate there.

## Interpretation

The polygons are official ward boundaries. Popular place names used by the trip plan are more granular and may cross ward boundaries:

- Shinjuku → Shinjuku Ward
- Shibuya / Harajuku → Shibuya Ward
- Asakusa / Ueno → Taito Ward
- Ginza / Tokyo Station → Chuo and Chiyoda wards
- Roppongi → Minato Ward
- Nakameguro → Meguro Ward
- Shinagawa → Shinagawa Ward
- Ikebukuro → Toshima Ward
- Odaiba → waterfront areas spanning Minato, Koto, and Shinagawa wards

Neighborhood extents, landmarks, and points of interest remain excluded except for the clearly editorial Tomigaya/Yoyogi Park and Daita/Shimokitazawa inspection radii. Odaiba has no service from the included route set; Yurikamome is explicitly deferred rather than fabricated as Tokyo Metro, Toei, or Yamanote coverage.

## Known limitations

- N02 is a 2022 reference-year infrastructure dataset, not live service data. It does not claim current operating status, service frequency, travel time, or accessibility.
- The display is geographic, not a station-by-station schematic. Generalization is necessary at the prototype's viewport scale.
- Dissolved N02 route sections may preserve parallel or branch geometry where the source distinguishes infrastructure sections.
- The grouped Tokyo / Otemachi marker is an orientation aid built from two official station records, not a claim that they are one physical station point.
- Official hotel pages can change their embedded-map implementation or access wording. The recorded coordinate source and check date make later verification possible.
- Hotel selection is stored only in browser `localStorage`; it is not a shared group decision or booking state.
