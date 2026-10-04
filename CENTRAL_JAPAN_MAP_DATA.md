# Central Japan map: data and provenance

This map and route cache support the ordered driving-route builder. The static base map contains geography, four optional locations, the national park, and a 100-mile scale; selected road geometry appears after the group builds a route.

## Repository files

- `public/maps/central-japan-concept-map.svg`: production map used by the website, with an `1800 × 1120` view box.
- `map-data/central-japan/build-map.mjs`: reproducible downloader, processor, SVG authoring, and PNG export script.
- `map-data/central-japan/source-manifest.json`: exact source URLs, local archive names, byte sizes, SHA-256 hashes, license labels, and projection definition from the source build.
- `map-data/central-japan/derived-map-layers.geojson`: processed coastline, prefecture-boundary mesh, park, lake, route, stop, and location-anchor layers in source longitude/latitude coordinates.
- `map-data/central-japan/package.json`: isolated generator dependencies so the app runtime remains small.
- `map-data/central-japan/source/driving-route-pairs-osrm.json`: durable raw cache for all required directed OSRM driving pairs.
- `map-data/central-japan/driving-route-pairs.json` and `src/data/central-japan-driving-routes.json`: projected route geometry and metrics used by the website.
- `map-data/central-japan/land-coverage-validation.json`: generated proof of complete Niigata and context-land coverage.
- `map-data/central-japan/route-builder-validation.json`: generated proof of supported nodes, pair coverage, reorder directions, endpoint combinations, and privacy constraints.
- `map-data/central-japan/route-options.md`: retained background research for later Shirahone-versus-Okuhida public-transport planning; it is not the active website route model.

Install the isolated map dependencies once, then regenerate from the project root:

```bash
npm install --prefix map-data/central-japan
npm run maps:central
```

The script downloads only into `map-data/central-japan/source/`, writes its review artifacts beside the generator, and synchronizes the production SVG to `public/maps/central-japan-concept-map.svg`.

## Sources

| Layer | Dataset and edition | Exact URL | Terms used for this concept |
|---|---|---|---|
| Prefecture land, coastline, and boundaries | MLIT National Land Numerical Information, Administrative Area Data `N03`, 2025-01-01; all 47 prefecture archives | [Dataset page](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html); archive pattern `https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_{code}_GML.zip` | CC BY 4.0, with MLIT attribution and notice that the map is processed |
| Station anchors used during processing | MLIT National Land Numerical Information, Railway Data `N02-24`, 2024 | [Dataset page](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2024.html); [archive](https://nlftp.mlit.go.jp/ksj/gml/data/N02/N02-24/N02-24_GML.zip) | CC BY 4.0, with MLIT attribution and processing notice; no partial rail line is rendered |
| Lake Nojiri polygon | MLIT National Land Numerical Information, Lakes and Marshes `W09-05`, 2005 | [Dataset page](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-W09-2005.html); [archive](https://nlftp.mlit.go.jp/ksj/gml/data/W09/W09-05/W09-05_GML.zip) | MLIT's legacy KSJ content terms apply where no individual license is stated; attribution and processing notice retained. See [MLIT use terms](https://nlftp.mlit.go.jp/ksj/other/agreement.html). |
| Chubu-Sangaku National Park extent | Ministry of the Environment, National Park Areas, current page states April 2025 | [Dataset page](https://www.biodic.go.jp/nps_nwp_nca_cz.html); [shapefile archive](https://www.biodic.go.jp/shapedata/nps.zip) | Japan Public Data License 1.0 unless individually stated otherwise, with MOE attribution and processing notice. The official page says the geometry is for overview use and may contain error. |
| Complete driving-route cache | OpenStreetMap road data returned by the public OSRM route service using the driving profile | Exact cached responses are stored in `source/driving-route-pairs-osrm.json` | © OpenStreetMap contributors, ODbL 1.0; visible attribution is included beside the map |
| Shirahone candidate center | OpenStreetMap Nominatim snapshot for Shirahone Onsen | Exact request and response snapshot are recorded in `source-manifest.json` and `source/shirahone-nominatim.json` | © OpenStreetMap contributors, ODbL 1.0 |
| Hirayu / Okuhida candidate center | OpenStreetMap Nominatim snapshot for Hirayu Onsen | Exact request and response snapshot are recorded in `source-manifest.json` and `source/okuhida-nominatim.json` | © OpenStreetMap contributors, ODbL 1.0 |
| Candidate plausibility | [Shirahone Onsen official access](https://shirahone.org/en/access) and [Okuhida Onsen-go Tourism Association](https://www.okuhida.or.jp/en/access/) | Official destination pages | Used only to support the two candidate geographies shared by Kate, not to recommend or confirm either stop |

## Processing

1. Download the 2025 N03 archives for all prefecture codes 01-47. Complete Niigata geometry, route nodes, and required trip features determine the fitted viewport; every official administrative feature intersecting a buffered viewport is selected spatially. TopoJSON shared-arc topology with 120,000-position quantization produces coastline and prefecture-boundary meshes.
2. Read the 2024 N02 UTF-8 GeoJSON for station anchors used during processing. The production base map intentionally renders no partial rail line or rail recommendation.
3. Read the W09 shapefile using Shift-JIS attributes and select the `野尻湖（芙蓉湖）` polygon at approximately 657 m elevation. The second Japanese feature named Lake Nojiri is in Miyazaki and is excluded by the exact source name and geometry.
4. Read the MOE national-park shapefile using UTF-8 attributes, select every record named `中部山岳`, and dissolve its zoning polygons to the park's complete mapped extent. The park is shown as an area, never a single pin.
5. Project every layer with a custom Lambert conformal conic on the GRS80 ellipsoid:

   `+proj=lcc +lat_1=34.5 +lat_2=38 +lat_0=36 +lon_0=138 +ellps=GRS80 +units=m +no_defs`

6. Calculate the map extent from complete Niigata geometry plus Tokyo, Kyoto, Lake Nojiri, Chubu-Sangaku, Shirahone, Hirayu, and required source-route geometry. Apply controlled longitude/latitude padding, then a larger context buffer for land selection. The current fitted bounds and source counts are written to `land-coverage-validation.json`.
7. Apply projected Douglas-Peucker simplification only for display. Source archives and cached route responses remain untouched.
8. Build or reuse 56 required directed OSRM route pairs among six supported Tokyo origins, four optional middle stops, and two endpoints. Project every route into the same `1800 × 1120` SVG coordinate system and validate all start/end and reorder combinations.
9. Export SVG directly and render PNG with `@resvg/resvg-js`. Synchronize the production base map and frontend JSON.

## Editorial decisions

- The base map has no fixed route lines, partial rail geometry, or dashed itinerary implications.
- Chubu-Sangaku is the real MOE polygon extent and remains a desired experience, not a selected route node or invented trailhead.
- Shirahone is represented in Nagano. Okuhida Onsen-go uses Hirayu as its Gifu transport anchor. Editorial review radii remain source metadata rather than visible label copy.
- Lake Nojiri, Seiro-machi, Shirahone, and Okuhida use one open diamond marker. Seiro-machi uses an area-weighted centroid of official municipality geometry; no private address is stored.
- The right-side key contains only location names and the park symbol. Dataset, projection, precision, and routing assumptions live in this file and the in-app `Map data` disclosure.
- The graphic scale is a calculated 100 miles, not a relabeled metric bar.
- Selected routes are composed in the browser from cached real road geometry. Order numbers and a coral route overlay appear only for the current working sequence.

## Ordered route builder

Supported origins are Tokyo Station and the five verified Tokyo hotel coordinates. Optional middle stops are Lake Nojiri cabin area, Seiro-machi family stop, Shirahone Onsen, and Okuhida Onsen-go via Hirayu. Endpoints are Kyoto Station and Tokyo Station.

The interface:

- accepts any unique subset of the four middle stops;
- supports add, remove, move earlier, move later, and reset without drag gestures;
- derives the origin from the current Tokyo hotel choice, falling back to Tokyo Station;
- owns the Kyoto/Tokyo final-city choice;
- composes every adjacent cached route pair and shows per-leg and summed distance/duration;
- converts metric source distances through the shared public miles formatter;
- persists only the ordered stop IDs and endpoint under `japan-trip-middle-route-v1`.

The OSRM results exclude live traffic. Recheck road conditions before travel.

The public-transport and rental-car research in `route-options.md` remains useful after the group narrows the stop sequence, but it is not rendered as a fixed Lake Nojiri-to-onsen itinerary.

## Decisions still needed from Kate

1. Which middle stops, if any, belong in the itinerary and in what order.
2. Whether the desired Alps visit fits one selected stay, a separate outing, or another route.
3. Whether the desired Alps visit means a specific gateway, trailhead, ropeway, scenic road, or simply a national-park experience.
4. Whether the trip ends in Kyoto or returns to Tokyo.
