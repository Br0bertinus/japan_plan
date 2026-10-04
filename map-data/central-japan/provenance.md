# Central Japan route field sheet: data and provenance

This field sheet is the static geographic base for the Central Japan ordered driving-route builder. No middle stop is confirmed, and the base map draws no fixed itinerary or partial rail recommendation.

## Primary files

- `central-japan-concept-map.svg`: full vector concept sheet, 1800 x 1120 view box.
- `central-japan-concept-map.png`: 2400 x 1493 raster preview.
- `build-map.mjs`: reproducible downloader, processor, SVG authoring, and PNG export script.
- `source-manifest.json`: exact source URLs, local archive names, byte sizes, SHA-256 hashes, license labels, and projection definition.
- `derived-map-layers.geojson`: processed coastline, prefecture-boundary mesh, park, lake, route, stop, and candidate-center layers in source longitude/latitude coordinates.
- `source/driving-route-pairs-osrm.json`: cached raw OSRM responses for all required directed driving pairs.
- `driving-route-pairs.json`: projected route geometry and metrics synchronized to the frontend.
- `land-coverage-validation.json` and `route-builder-validation.json`: generated coverage, pair-completeness, and privacy checks.

Run `npm install` and `npm run build` from this folder to regenerate the outputs. The script downloads only into `source/` under this artifact folder.

## Sources

| Layer | Dataset and edition | Exact URL | Terms used for this concept |
|---|---|---|---|
| Prefecture land, coastline, and boundaries | MLIT National Land Numerical Information, Administrative Area Data `N03`, 2025-01-01; all 47 prefecture archives | [Dataset page](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html); archive pattern `https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_{code}_GML.zip` | CC BY 4.0, with MLIT attribution and notice that the map is processed |
| Station anchors used during processing | MLIT National Land Numerical Information, Railway Data `N02-24`, 2024 | [Dataset page](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2024.html); [archive](https://nlftp.mlit.go.jp/ksj/gml/data/N02/N02-24/N02-24_GML.zip) | CC BY 4.0, with MLIT attribution and processing notice; no partial rail line is rendered |
| Lake Nojiri polygon | MLIT National Land Numerical Information, Lakes and Marshes `W09-05`, 2005 | [Dataset page](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-W09-2005.html); [archive](https://nlftp.mlit.go.jp/ksj/gml/data/W09/W09-05/W09-05_GML.zip) | MLIT's legacy KSJ content terms apply where no individual license is stated; attribution and processing notice retained. See [MLIT use terms](https://nlftp.mlit.go.jp/ksj/other/agreement.html). |
| Chubu-Sangaku National Park extent | Ministry of the Environment, National Park Areas, current page states April 2025 | [Dataset page](https://www.biodic.go.jp/nps_nwp_nca_cz.html); [shapefile archive](https://www.biodic.go.jp/shapedata/nps.zip) | Japan Public Data License 1.0 unless individually stated otherwise, with MOE attribution and processing notice. The official page says the geometry is for overview use and may contain error. |
| Complete driving-route cache | OpenStreetMap road data returned by the public OSRM route service using the driving profile | Cached responses are stored in `source/driving-route-pairs-osrm.json` | © OpenStreetMap contributors, ODbL 1.0; visible attribution is included beside the map |
| Shirahone candidate center | OpenStreetMap Nominatim snapshot for Shirahone Onsen | Exact request and response snapshot are recorded in `source-manifest.json` and `source/shirahone-nominatim.json` | © OpenStreetMap contributors, ODbL 1.0 |
| Hirayu / Okuhida candidate center | OpenStreetMap Nominatim snapshot for Hirayu Onsen | Exact request and response snapshot are recorded in `source-manifest.json` and `source/okuhida-nominatim.json` | © OpenStreetMap contributors, ODbL 1.0 |
| Candidate plausibility | [Shirahone Onsen official access](https://shirahone.org/en/access) and [Okuhida Onsen-go Tourism Association](https://www.okuhida.or.jp/en/access/) | Official destination pages | Used only to support the two candidate geographies shared by Kate, not to recommend or confirm either stop |

## Processing

1. Download all 47 N03 2025 prefecture archives. Complete Niigata geometry plus all route nodes and required trip features determine the fitted viewport; every official administrative feature intersecting a buffered viewport is selected spatially.
2. Read the 2024 N02 UTF-8 GeoJSON for station anchors used during processing. No partial rail line is rendered in the production base map.
3. Read the W09 shapefile using Shift-JIS attributes and select the `野尻湖（芙蓉湖）` polygon at approximately 657 m elevation. The second Japanese feature named Lake Nojiri is in Miyazaki and is excluded by the exact source name and geometry.
4. Read the MOE national-park shapefile using UTF-8 attributes, select every record named `中部山岳`, and dissolve its zoning polygons to the park's complete mapped extent. The park is shown as an area, never a single pin.
5. Project every layer with a custom Lambert conformal conic on the GRS80 ellipsoid:

   `+proj=lcc +lat_1=34.5 +lat_2=38 +lat_0=36 +lon_0=138 +ellps=GRS80 +units=m +no_defs`

6. Calculate dynamic bounds from complete Niigata plus Tokyo, Kyoto, Lake Nojiri, Chubu-Sangaku, Shirahone, Hirayu, and source-route geometry. Apply controlled padding and a larger context buffer for land selection.
7. Apply projected Douglas-Peucker simplification only for display. Source archives and cached route responses remain untouched.
8. Build or reuse 56 directed OSRM driving pairs among six supported Tokyo origins, four optional middle stops, and two endpoints. Project every route into the shared `1800 × 1120` coordinate system.
9. Export the base SVG and PNG, synchronize frontend JSON, and write land and route-builder validation reports.

## Editorial decisions

- The base map contains no fixed route line, partial rail geometry, or dashed itinerary implication. Selected road geometry is composed in the browser from cached OSRM pairs.
- Chubu-Sangaku is the real MOE polygon extent and remains a desired experience, not an invented point or confirmed route node.
- Shirahone and Okuhida are the two actual candidates shared by Kate. Shirahone is a compact east-side settlement and uses a 7 km editorial review radius. Okuhida is a five-town west-side area; the map uses Hirayu as its transport anchor with an 18 km editorial review radius. Neither circle claims to be an administrative or tourism boundary.
- Lake Nojiri, James Brown, Shirahone, and Okuhida are all candidate middle stops. James Brown uses the official Seiro-machi municipality-level representative point and no private residential detail.

## Decisions still needed from Kate

1. Which middle stops, if any, belong in the itinerary and in what order.
2. How the desired Alps experience fits the selected stops.
3. Whether the Alps visit means a specific gateway, trailhead, ropeway, scenic road, or simply a national-park experience.
4. Whether the trip ends in Kyoto or returns to Tokyo.
