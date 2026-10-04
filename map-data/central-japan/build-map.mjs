import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import AdmZip from "adm-zip";
import proj4 from "proj4";
import * as shapefile from "shapefile";
import { topology } from "topojson-server";
import { merge, mesh } from "topojson-client";
import { Resvg } from "@resvg/resvg-js";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const SOURCE = path.join(ROOT, "source");
const EXTRACTED = path.join(SOURCE, "extracted");
const REVIEW = path.join(ROOT, "review");

const WIDTH = 1800;
const HEIGHT = 1120;
const MAP = { x: 54, y: 184, width: 1218, height: 848 };
const FIT_PADDING = { lon: 0.28, lat: 0.24 };
const CONTEXT_BUFFER = { lon: 0.65, lat: 0.65 };
const LCC =
  "+proj=lcc +lat_1=34.5 +lat_2=38 +lat_0=36 +lon_0=138 +ellps=GRS80 +units=m +no_defs";

const COLORS = {
  carbon: "#182a2e",
  carbonSoft: "#44575a",
  paper: "#f1ead7",
  punched: "#fffaf0",
  ocean: "#a9c7c8",
  land: "#e3e4d4",
  boundary: "#667773",
  coral: "#d85f4e",
  yellow: "#e4b743",
  green: "#5f8660",
  teal: "#266f6b",
  blue: "#4f739a",
  violet: "#826987",
  white: "#fffdf7"
};

const prefectures = [
  ["01", "Hokkaido"],
  ["02", "Aomori"],
  ["03", "Iwate"],
  ["04", "Miyagi"],
  ["05", "Akita"],
  ["06", "Yamagata"],
  ["07", "Fukushima"],
  ["08", "Ibaraki"],
  ["09", "Tochigi"],
  ["10", "Gunma"],
  ["11", "Saitama"],
  ["12", "Chiba"],
  ["13", "Tokyo"],
  ["14", "Kanagawa"],
  ["15", "Niigata"],
  ["16", "Toyama"],
  ["17", "Ishikawa"],
  ["18", "Fukui"],
  ["19", "Yamanashi"],
  ["20", "Nagano"],
  ["21", "Gifu"],
  ["22", "Shizuoka"],
  ["23", "Aichi"],
  ["24", "Mie"],
  ["25", "Shiga"],
  ["26", "Kyoto"],
  ["27", "Osaka"],
  ["28", "Hyogo"],
  ["29", "Nara"],
  ["30", "Wakayama"],
  ["31", "Tottori"],
  ["32", "Shimane"],
  ["33", "Okayama"],
  ["34", "Hiroshima"],
  ["35", "Yamaguchi"],
  ["36", "Tokushima"],
  ["37", "Kagawa"],
  ["38", "Ehime"],
  ["39", "Kochi"],
  ["40", "Fukuoka"],
  ["41", "Saga"],
  ["42", "Nagasaki"],
  ["43", "Kumamoto"],
  ["44", "Oita"],
  ["45", "Miyazaki"],
  ["46", "Kagoshima"],
  ["47", "Okinawa"]
];

const sourceDefinitions = [
  ...prefectures.map(([code, name]) => ({
    id: `mlit-n03-2025-${code}`,
    title: `MLIT National Land Numerical Information N03 2025 administrative areas - ${name}`,
    url: `https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_${code}_GML.zip`,
    file: `N03-20250101_${code}_GML.zip`,
    license: "CC BY 4.0",
    landingPage: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html"
  })),
  {
    id: "mlit-n02-2024",
    title: "MLIT National Land Numerical Information N02 2024 railway and station data",
    url: "https://nlftp.mlit.go.jp/ksj/gml/data/N02/N02-24/N02-24_GML.zip",
    file: "N02-24_GML.zip",
    license: "CC BY 4.0",
    landingPage: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2024.html"
  },
  {
    id: "mlit-w09-2005",
    title: "MLIT National Land Numerical Information W09 2005 lakes and marshes",
    url: "https://nlftp.mlit.go.jp/ksj/gml/data/W09/W09-05/W09-05_GML.zip",
    file: "W09-05_GML.zip",
    license: "MLIT KSJ old content terms (legacy National Land Information terms); attribution required",
    landingPage: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-W09-2005.html"
  },
  {
    id: "moe-national-parks-2025",
    title: "Ministry of the Environment national park areas, April 2025",
    url: "https://www.biodic.go.jp/shapedata/nps.zip",
    file: "moe-nps.zip",
    license: "Japan Public Data License 1.0 (PDL1.0), unless the dataset states otherwise; attribution required",
    landingPage: "https://www.biodic.go.jp/nps_nwp_nca_cz.html"
  }
];

const routeDefinition = {
  id: "osm-osrm-nagano-nojiriko",
  title: "OpenStreetMap road alignment returned by OSRM for Nagano Station to Lake Nojiri",
  url:
    "https://router.project-osrm.org/route/v1/driving/138.1883,36.6433;138.2050,36.8330?overview=full&geometries=geojson",
  file: "nagano-nojiriko-osrm.geojson",
  license: "OpenStreetMap contributors, ODbL 1.0",
  landingPage: "https://www.openstreetmap.org/copyright"
};

const tokyoHotelDrivingNodes = [
  { id: "park-hyatt-tokyo", name: "Park Hyatt Tokyo", coordinates: [139.6885232128674, 35.68514901557579] },
  { id: "hotel-groove-shinjuku", name: "HOTEL GROOVE SHINJUKU", coordinates: [139.7006653, 35.6960038] },
  { id: "hotel-toranomon-hills", name: "Hotel Toranomon Hills", coordinates: [139.74998, 35.66615] },
  { id: "yuen-bettei-daita", name: "YUEN BETTEI DAITA", coordinates: [139.6611952, 35.6582466] },
  { id: "trunk-hotel-yoyogi-park", name: "TRUNK(HOTEL) YOYOGI PARK", coordinates: [139.6923539, 35.6668094] }
];

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function download(url, destination) {
  if (fs.existsSync(destination) && fs.statSync(destination).size > 1000) return;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    log(`Downloading ${path.basename(destination)}${attempt > 1 ? ` (attempt ${attempt})` : ""}...`);
    const response = await fetch(url, {
      headers: { "User-Agent": "KateJapanTripConceptMap/1.0 offline reproducible map" }
    });
    if (response.ok) {
      await fsp.writeFile(destination, Buffer.from(await response.arrayBuffer()));
      return;
    }
    if (attempt === 4) throw new Error(`Download failed ${response.status}: ${url}`);
    await new Promise(resolve => setTimeout(resolve, attempt * 1200));
  }
}

async function extract(zipPath, destination) {
  const marker = path.join(destination, ".extracted");
  if (fs.existsSync(marker)) return;
  await ensureDir(destination);
  new AdmZip(zipPath).extractAllTo(destination, true);
  await fsp.writeFile(marker, new Date().toISOString());
}

async function sha256(file) {
  const hash = crypto.createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return hash.digest("hex");
}

function walkCoordinates(coordinates, callback) {
  if (!Array.isArray(coordinates)) return;
  if (coordinates.length >= 2 && typeof coordinates[0] === "number") {
    callback(coordinates);
    return;
  }
  for (const child of coordinates) walkCoordinates(child, callback);
}

function boundsOfGeometry(geometry) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  walkCoordinates(geometry.coordinates, ([x, y]) => {
    bounds[0] = Math.min(bounds[0], x);
    bounds[1] = Math.min(bounds[1], y);
    bounds[2] = Math.max(bounds[2], x);
    bounds[3] = Math.max(bounds[3], y);
  });
  return bounds;
}

function geometryIntersectsBounds(geometry, bounds) {
  const [minX, minY, maxX, maxY] = boundsOfGeometry(geometry);
  return !(
    maxX < bounds.minLon ||
    minX > bounds.maxLon ||
    maxY < bounds.minLat ||
    minY > bounds.maxLat
  );
}

function combinedBounds(geometries) {
  const combined = [Infinity, Infinity, -Infinity, -Infinity];
  for (const geometry of geometries) {
    const [minX, minY, maxX, maxY] = boundsOfGeometry(geometry);
    combined[0] = Math.min(combined[0], minX);
    combined[1] = Math.min(combined[1], minY);
    combined[2] = Math.max(combined[2], maxX);
    combined[3] = Math.max(combined[3], maxY);
  }
  return { minLon: combined[0], minLat: combined[1], maxLon: combined[2], maxLat: combined[3] };
}

function expandBounds(bounds, padding) {
  return {
    minLon: bounds.minLon - padding.lon,
    minLat: bounds.minLat - padding.lat,
    maxLon: bounds.maxLon + padding.lon,
    maxLat: bounds.maxLat + padding.lat
  };
}

function centerOfGeometry(geometry) {
  const [minX, minY, maxX, maxY] = boundsOfGeometry(geometry);
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

function centroidOfPolygonalGeometry(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (const polygon of polygons) {
    const ring = polygon[0];
    let twiceArea = 0;
    let centroidX = 0;
    let centroidY = 0;
    for (let index = 0; index < ring.length - 1; index += 1) {
      const [x1, y1] = ring[index];
      const [x2, y2] = ring[index + 1];
      const cross = x1 * y2 - x2 * y1;
      twiceArea += cross;
      centroidX += (x1 + x2) * cross;
      centroidY += (y1 + y2) * cross;
    }
    if (Math.abs(twiceArea) < Number.EPSILON) continue;
    const area = twiceArea / 2;
    const weight = Math.abs(area);
    weightedX += (centroidX / (6 * area)) * weight;
    weightedY += (centroidY / (6 * area)) * weight;
    totalWeight += weight;
  }

  return totalWeight > 0
    ? [weightedX / totalWeight, weightedY / totalWeight]
    : centerOfGeometry(geometry);
}

function lineDistanceSquared(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) {
    const px = point[0] - start[0];
    const py = point[1] - start[1];
    return px * px + py * py;
  }
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  const x = start[0] + t * dx;
  const y = start[1] + t * dy;
  const px = point[0] - x;
  const py = point[1] - y;
  return px * px + py * py;
}

function simplifyLine(points, tolerance) {
  if (points.length <= 3) return points;
  const sqTolerance = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    let maxDistance = 0;
    let index = -1;
    for (let i = start + 1; i < end; i++) {
      const distance = lineDistanceSquared(points[i], points[start], points[end]);
      if (distance > maxDistance) {
        index = i;
        maxDistance = distance;
      }
    }
    if (index >= 0 && maxDistance > sqTolerance) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, index) => keep[index]);
}

function mapGeometryCoordinates(geometry, mapper, lineTolerance = 0) {
  const mapLine = line => {
    const mapped = line.map(mapper);
    return lineTolerance > 0 ? simplifyLine(mapped, lineTolerance) : mapped;
  };
  if (geometry.type === "Point") return { ...geometry, coordinates: mapper(geometry.coordinates) };
  if (geometry.type === "LineString") return { ...geometry, coordinates: mapLine(geometry.coordinates) };
  if (geometry.type === "MultiLineString") {
    return { ...geometry, coordinates: geometry.coordinates.map(mapLine) };
  }
  if (geometry.type === "Polygon") {
    return { ...geometry, coordinates: geometry.coordinates.map(mapLine) };
  }
  if (geometry.type === "MultiPolygon") {
    return { ...geometry, coordinates: geometry.coordinates.map(polygon => polygon.map(mapLine)) };
  }
  throw new Error(`Unsupported geometry: ${geometry.type}`);
}

function pathForGeometry(geometry) {
  const linePath = (line, close) => {
    if (!line.length) return "";
    const body = line.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join("");
    return close ? `${body}Z` : body;
  };
  if (geometry.type === "LineString") return linePath(geometry.coordinates, false);
  if (geometry.type === "MultiLineString") return geometry.coordinates.map(line => linePath(line, false)).join("");
  if (geometry.type === "Polygon") return geometry.coordinates.map(ring => linePath(ring, true)).join("");
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap(polygon => polygon.map(ring => linePath(ring, true))).join("");
  }
  return "";
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function readJson(file) {
  const text = await fsp.readFile(file, "utf8");
  return JSON.parse(text.replace(/^\uFEFF/, ""));
}

function textBlock(x, y, lines, options = {}) {
  const {
    anchor = "start",
    size = 18,
    weight = 700,
    fill = COLORS.carbon,
    lineHeight = size * 1.15,
    letterSpacing = 1,
    opacity = 1,
    family = "'Arial Narrow','Segoe UI',Arial,sans-serif",
    italic = false
  } = options;
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${letterSpacing}" fill="${fill}" opacity="${opacity}"${italic ? ' font-style="italic"' : ""}>${lines
    .map((line, index) => `<tspan x="${x}" dy="${index ? lineHeight : 0}">${escapeXml(line)}</tspan>`)
    .join("")}</text>`;
}

function labelWithLeader(point, label, lines, options = {}) {
  const { color = COLORS.carbon, align = "start", small = false } = options;
  const targetX = label[0];
  const targetY = label[1];
  const elbowX = align === "end" ? targetX + 12 : targetX - 12;
  return [
    `<path d="M${point[0].toFixed(2)},${point[1].toFixed(2)} L${elbowX.toFixed(2)},${targetY.toFixed(2)}" fill="none" stroke="${color}" stroke-width="1.7" stroke-dasharray="4 5" opacity="0.82"/>`,
    `<circle cx="${point[0].toFixed(2)}" cy="${point[1].toFixed(2)}" r="3.5" fill="${color}"/>`,
    textBlock(targetX, targetY - 3, lines, {
      anchor: align,
      size: small ? 14 : 18,
      weight: 800,
      fill: color,
      lineHeight: small ? 16 : 21,
      letterSpacing: small ? 0.8 : 1.3
    })
  ].join("");
}

async function loadSources() {
  await ensureDir(SOURCE);
  await ensureDir(EXTRACTED);
  await ensureDir(REVIEW);

  for (const definition of sourceDefinitions) {
    const archive = path.join(SOURCE, definition.file);
    await download(definition.url, archive);
    await extract(archive, path.join(EXTRACTED, definition.id));
  }

  const routeFile = path.join(SOURCE, routeDefinition.file);
  if (!fs.existsSync(routeFile)) {
    const response = await fetch(routeDefinition.url, {
      headers: { "User-Agent": "KateJapanTripConceptMap/1.0 offline reproducible map" }
    });
    if (!response.ok) throw new Error(`OSRM route request failed ${response.status}`);
    const payload = await response.json();
    await fsp.writeFile(routeFile, JSON.stringify(payload.routes[0].geometry, null, 2));
  }
}

async function buildDrivingRouteCache(nodes, requiredPairs) {
  const cachePath = path.join(SOURCE, "driving-route-pairs-osrm.json");
  const nodeSignature = crypto
    .createHash("sha256")
    .update(JSON.stringify(nodes.map(node => [node.id, ...node.coordinates])))
    .digest("hex");
  let cache = {
    version: 1,
    nodeSignature,
    generatedAt: null,
    source: {
      service: "OSRM public route service",
      data: "OpenStreetMap road network",
      profile: "driving",
      overview: "simplified",
      traffic: "not included"
    },
    pairs: {}
  };

  if (fs.existsSync(cachePath)) {
    const existing = await readJson(cachePath);
    if (existing.version === 1 && existing.nodeSignature === nodeSignature) cache = existing;
  }

  const nodeById = new Map(nodes.map(node => [node.id, node]));
  for (const [fromId, toId] of requiredPairs) {
    const key = `${fromId}__${toId}`;
    if (cache.pairs[key]) continue;
    if (fromId === toId) {
      cache.pairs[key] = {
        fromId,
        toId,
        distanceMeters: 0,
        durationSeconds: 0,
        geometry: { type: "LineString", coordinates: [nodeById.get(fromId).coordinates] }
      };
      continue;
    }

    const from = nodeById.get(fromId);
    const to = nodeById.get(toId);
    if (!from || !to) throw new Error(`Driving node missing for ${key}`);
    const url =
      `https://router.project-osrm.org/route/v1/driving/${from.coordinates.join(",")};${to.coordinates.join(",")}` +
      "?overview=simplified&geometries=geojson&steps=false";
    let payload = null;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      log(`Routing ${fromId} -> ${toId}${attempt > 1 ? ` (attempt ${attempt})` : ""}...`);
      const response = await fetch(url, {
        headers: { "User-Agent": "KateJapanTripRouteBuilder/1.0 cached planning routes" }
      });
      if (response.ok) {
        payload = await response.json();
        if (payload.code === "Ok" && payload.routes?.[0]) break;
      }
      payload = null;
      if (attempt < 4) await new Promise(resolve => setTimeout(resolve, attempt * 1400));
    }
    if (!payload?.routes?.[0]) throw new Error(`OSRM route unavailable for ${key}`);
    cache.pairs[key] = {
      fromId,
      toId,
      distanceMeters: Math.round(payload.routes[0].distance),
      durationSeconds: Math.round(payload.routes[0].duration),
      geometry: payload.routes[0].geometry,
      requestUrl: url
    };
    cache.generatedAt = new Date().toISOString();
    await fsp.writeFile(cachePath, JSON.stringify(cache, null, 2));
    await new Promise(resolve => setTimeout(resolve, 160));
  }

  return { cachePath, cache };
}

function findFile(directory, matcher) {
  const queue = [directory];
  while (queue.length) {
    const current = queue.shift();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) queue.push(full);
      else if (matcher(entry.name, full)) return full;
    }
  }
  throw new Error(`Required source file not found in ${directory}`);
}

async function readShapefileFiltered(shpPath, dbfPath, encoding, predicate) {
  const source = await shapefile.open(shpPath, dbfPath, { encoding });
  const features = [];
  for (;;) {
    const result = await source.read();
    if (result.done) break;
    if (predicate(result.value)) features.push(result.value);
  }
  return features;
}

function clippedRailRuns(geometry, nagano) {
  const sourceLines =
    geometry.type === "LineString"
      ? [geometry.coordinates]
      : geometry.type === "MultiLineString"
        ? geometry.coordinates
        : [];
  const runs = [];
  for (const line of sourceLines) {
    let current = [];
    for (const coordinate of line) {
      const nearNagano = Math.hypot((coordinate[0] - nagano[0]) * 90, (coordinate[1] - nagano[1]) * 111) < 7;
      const keep = coordinate[0] >= 138.37 || coordinate[1] <= 36.68 || nearNagano;
      if (keep) current.push(coordinate);
      else if (current.length > 1) {
        runs.push(current);
        current = [];
      } else {
        current = [];
      }
    }
    if (current.length > 1) runs.push(current);
  }
  return runs;
}

function makeProjection(crop) {
  const raw = coordinate => proj4("EPSG:4326", LCC, coordinate);
  const samples = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    samples.push(raw([crop.minLon + (crop.maxLon - crop.minLon) * t, crop.minLat]));
    samples.push(raw([crop.minLon + (crop.maxLon - crop.minLon) * t, crop.maxLat]));
    samples.push(raw([crop.minLon, crop.minLat + (crop.maxLat - crop.minLat) * t]));
    samples.push(raw([crop.maxLon, crop.minLat + (crop.maxLat - crop.minLat) * t]));
  }
  const xs = samples.map(point => point[0]);
  const ys = samples.map(point => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min(MAP.width / (maxX - minX), MAP.height / (maxY - minY));
  const renderedWidth = (maxX - minX) * scale;
  const renderedHeight = (maxY - minY) * scale;
  const offsetX = MAP.x + (MAP.width - renderedWidth) / 2;
  const offsetY = MAP.y + (MAP.height - renderedHeight) / 2;
  const screen = coordinate => {
    const [x, y] = raw(coordinate);
    return [offsetX + (x - minX) * scale, offsetY + renderedHeight - (y - minY) * scale];
  };
  return { raw, screen, scale, bounds: { minX, minY, maxX, maxY } };
}

async function build() {
  await loadSources();

  log("Loading all official N03 prefecture packages...");
  const adminFeaturesByCode = new Map();
  for (const [code] of prefectures) {
    const directory = path.join(EXTRACTED, `mlit-n03-2025-${code}`);
    const geojsonFile = findFile(directory, name => name.endsWith(".geojson"));
    const collection = await readJson(geojsonFile);
    adminFeaturesByCode.set(code, collection.features);
  }

  log("Loading railway, station, lake, park, and road geometry...");
  const n02Directory = path.join(EXTRACTED, "mlit-n02-2024");
  const railFile = findFile(n02Directory, name => name === "N02-24_RailroadSection.geojson");
  const stationFile = findFile(n02Directory, name => name === "N02-24_Station.geojson");
  const railCollection = await readJson(railFile);
  const stationCollection = await readJson(stationFile);

  const station = (name, route) => {
    const match = stationCollection.features.find(
      feature => feature.properties.N02_005 === name && feature.properties.N02_003 === route
    );
    if (!match) throw new Error(`Station not found: ${name} / ${route}`);
    return centerOfGeometry(match.geometry);
  };

  const tokyo = station("東京", "東北新幹線");
  const nagano = station("長野", "北陸新幹線");
  const kyoto = station("京都", "東海道新幹線");

  const hokurikuFeatures = railCollection.features.filter(
    feature =>
      feature.properties.N02_003 === "北陸新幹線" &&
      feature.properties.N02_004 === "東日本旅客鉄道"
  );
  const hokurikuRuns = hokurikuFeatures.flatMap(feature => clippedRailRuns(feature.geometry, nagano));

  const lakeDirectory = path.join(EXTRACTED, "mlit-w09-2005");
  const lakeShp = findFile(lakeDirectory, name => name.endsWith("_Lake.shp"));
  const lakeDbf = lakeShp.replace(/\.shp$/i, ".dbf");
  const lakeFeatures = await readShapefileFiltered(
    lakeShp,
    lakeDbf,
    "shift_jis",
    feature => feature.properties.W09_001 === "野尻湖（芙蓉湖）"
  );
  if (lakeFeatures.length !== 1) throw new Error(`Expected one Lake Nojiri polygon, found ${lakeFeatures.length}`);
  const lake = lakeFeatures[0];
  const lakeCenter = centerOfGeometry(lake.geometry);

  const parkDirectory = path.join(EXTRACTED, "moe-national-parks-2025");
  const parkShp = findFile(parkDirectory, name => name === "nps.shp");
  const parkDbf = parkShp.replace(/\.shp$/i, ".dbf");
  const parkFeatures = await readShapefileFiltered(
    parkShp,
    parkDbf,
    "utf-8",
    feature => feature.properties.NAME === "中部山岳"
  );
  const parkTopology = topology(
    { park: { type: "FeatureCollection", features: parkFeatures } },
    100000
  );
  const parkGeometry = merge(parkTopology, parkTopology.objects.park.geometries);

  const roadGeometry = await readJson(path.join(SOURCE, routeDefinition.file));
  const shirahoneSnapshot = await readJson(path.join(SOURCE, "shirahone-nominatim.json"));
  const okuhidaSnapshot = await readJson(path.join(SOURCE, "okuhida-nominatim.json"));
  const shirahone = [
    Number(shirahoneSnapshot[0]?.lon ?? 137.626814),
    Number(shirahoneSnapshot[0]?.lat ?? 36.1525389)
  ];
  const hirayu = [Number(okuhidaSnapshot[0]?.lon ?? 137.5536701), Number(okuhidaSnapshot[0]?.lat ?? 36.1914892)];

  const niigataFeatures = adminFeaturesByCode.get("15") ?? [];
  const niigataTopology = topology(
    { prefecture: { type: "FeatureCollection", features: niigataFeatures } },
    80000
  );
  const niigataGeometry = merge(niigataTopology, niigataTopology.objects.prefecture.geometries);

  const seiroFeatures = niigataFeatures.filter(feature => feature.properties.N03_007 === "15307");
  if (seiroFeatures.length === 0) throw new Error("Seiro-machi municipality geometry not found");
  const seiroTopology = topology(
    { municipality: { type: "FeatureCollection", features: seiroFeatures } },
    20000
  );
  const seiroGeometry = merge(seiroTopology, seiroTopology.objects.municipality.geometries);
  const seiroCenter = centroidOfPolygonalGeometry(seiroGeometry);

  const requiredBounds = combinedBounds([
    niigataGeometry,
    lake.geometry,
    parkGeometry,
    roadGeometry,
    ...hokurikuRuns.map(coordinates => ({ type: "LineString", coordinates })),
    { type: "Point", coordinates: tokyo },
    { type: "Point", coordinates: kyoto },
    { type: "Point", coordinates: shirahone },
    { type: "Point", coordinates: hirayu }
  ]);
  const mapCrop = expandBounds(requiredBounds, FIT_PADDING);
  const contextCrop = expandBounds(mapCrop, CONTEXT_BUFFER);

  log("Selecting all official administrative land intersecting the buffered viewport...");
  const adminFeatures = [];
  const intersectingPackages = [];
  for (const [code, name] of prefectures) {
    const features = adminFeaturesByCode.get(code) ?? [];
    const intersecting = features.filter(feature => geometryIntersectsBounds(feature.geometry, contextCrop));
    if (intersecting.length > 0) {
      adminFeatures.push(...intersecting);
      intersectingPackages.push({
        code,
        name,
        officialName: intersecting[0].properties.N03_001,
        featureCount: intersecting.length
      });
    }
  }
  if (adminFeatures.length === 0) throw new Error("No official N03 land intersects the map context viewport");

  log("Building shared prefecture boundaries and coastline...");
  const adminTopology = topology(
    { municipalities: { type: "FeatureCollection", features: adminFeatures } },
    160000
  );
  const adminObject = adminTopology.objects.municipalities;
  const coastlineGeometry = mesh(adminTopology, adminObject, (a, b) => a === b);
  const prefectureBoundaryGeometry = mesh(
    adminTopology,
    adminObject,
    (a, b) => a !== b && a.properties.N03_001 !== b.properties.N03_001
  );

  const projection = makeProjection(mapCrop);
  const screen = projection.screen;
  const projectedPath = (geometry, tolerance = 550) =>
    pathForGeometry(mapGeometryCoordinates(geometry, coordinate => screen(coordinate), tolerance * projection.scale));

  const japaneseToEnglish = {
    群馬県: "Gunma",
    埼玉県: "Saitama",
    千葉県: "Chiba",
    東京都: "Tokyo",
    神奈川県: "Kanagawa",
    新潟県: "Niigata",
    富山県: "Toyama",
    石川県: "Ishikawa",
    福井県: "Fukui",
    山梨県: "Yamanashi",
    長野県: "Nagano",
    岐阜県: "Gifu",
    静岡県: "Shizuoka",
    愛知県: "Aichi",
    三重県: "Mie",
    滋賀県: "Shiga",
    京都府: "Kyoto",
    大阪府: "Osaka",
    兵庫県: "Hyogo",
    奈良県: "Nara",
    和歌山県: "Wakayama"
  };
  const municipalityFills = adminFeatures.map(feature => ({
    prefecture: japaneseToEnglish[feature.properties.N03_001],
    d: projectedPath(feature.geometry, 450)
  }));
  const coastlinePath = projectedPath(coastlineGeometry, 320);
  const prefectureBoundaryPath = projectedPath(prefectureBoundaryGeometry, 320);
  const lakePath = projectedPath(lake.geometry, 60);
  const parkPath = projectedPath(parkGeometry, 180);

  const tokyoPoint = screen(tokyo);
  const kyotoPoint = screen(kyoto);
  const lakePoint = screen(lakeCenter);
  const shirahonePoint = screen(shirahone);
  const hirayuPoint = screen(hirayu);
  const seiroPoint = screen(seiroCenter);

  const drivingNodes = [
    {
      id: "tokyo-station",
      name: "Tokyo Station",
      type: "start-end",
      precision: "official station geometry",
      coordinates: tokyo
    },
    ...tokyoHotelDrivingNodes.map(node => ({
      ...node,
      type: "start",
      precision: "official hotel coordinate"
    })),
    {
      id: "lake-nojiri",
      name: "Lake Nojiri cabin area",
      type: "middle",
      precision: "approximate public lake-area routing point",
      coordinates: [138.205, 36.833]
    },
    {
      id: "family-location",
      name: "James Brown",
      type: "middle",
      precision: "municipality-level area point; not door-to-door",
      coordinates: seiroCenter
    },
    {
      id: "shirahone",
      name: "Shirahone Onsen",
      type: "middle",
      precision: "public onsen-area point",
      coordinates: shirahone
    },
    {
      id: "okuhida",
      name: "Okuhida Onsen-go via Hirayu",
      type: "middle",
      precision: "public Hirayu transport anchor",
      coordinates: hirayu
    },
    {
      id: "kyoto",
      name: "Kyoto Station",
      type: "end",
      precision: "official station geometry",
      coordinates: kyoto
    }
  ];
  const startNodeIds = ["tokyo-station", ...tokyoHotelDrivingNodes.map(node => node.id)];
  const middleNodeIds = ["lake-nojiri", "family-location", "shirahone", "okuhida"];
  const endNodeIds = ["kyoto", "tokyo-station"];
  const requiredDrivingPairs = [];
  for (const startId of startNodeIds) {
    for (const destinationId of [...middleNodeIds, ...endNodeIds]) {
      requiredDrivingPairs.push([startId, destinationId]);
    }
  }
  for (const fromId of middleNodeIds) {
    for (const toId of middleNodeIds) {
      if (fromId !== toId) requiredDrivingPairs.push([fromId, toId]);
    }
    for (const endId of endNodeIds) requiredDrivingPairs.push([fromId, endId]);
  }
  const { cachePath: drivingCachePath, cache: drivingRouteCache } =
    await buildDrivingRouteCache(drivingNodes, requiredDrivingPairs);
  const drivingNodeScreen = Object.fromEntries(
    drivingNodes.map(node => {
      const [x, y] = screen(node.coordinates);
      return [node.id, { ...node, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) }];
    })
  );
  const projectedDrivingPairs = Object.fromEntries(
    requiredDrivingPairs.map(([fromId, toId]) => {
      const key = `${fromId}__${toId}`;
      const pair = drivingRouteCache.pairs[key];
      if (!pair) throw new Error(`Required driving route pair missing: ${key}`);
      return [
        key,
        {
          fromId,
          toId,
          distanceKm: Number((pair.distanceMeters / 1000).toFixed(1)),
          durationMinutes: Math.round(pair.durationSeconds / 60),
          svgPath:
            fromId === toId
              ? ""
              : pathForGeometry(
                  mapGeometryCoordinates(pair.geometry, coordinate => screen(coordinate), 18 * projection.scale)
                )
        }
      ];
    })
  );

  const prefFills = {
    Tokyo: "#eed9cc",
    Nagano: "#ece2b8",
    Gifu: "#d7e1cd",
    Toyama: "#d5e4dc",
    Ishikawa: "#d8e1dc",
    Fukui: "#e1e1d3",
    Yamanashi: "#e5dfc7",
    Shizuoka: "#d9e4db",
    Aichi: "#e2ded1",
    Shiga: "#d8e3de",
    Kyoto: "#dcd8e3"
  };

  const gridLines = [];
  for (let lon = Math.ceil(mapCrop.minLon); lon <= Math.floor(mapCrop.maxLon); lon += 1) {
    const coordinates = [];
    for (let lat = mapCrop.minLat; lat <= mapCrop.maxLat + 0.001; lat += 0.04) coordinates.push([lon, lat]);
    gridLines.push(pathForGeometry(mapGeometryCoordinates({ type: "LineString", coordinates }, screen, 0)));
  }
  for (let lat = Math.ceil(mapCrop.minLat); lat <= Math.floor(mapCrop.maxLat); lat += 1) {
    const coordinates = [];
    for (let lon = mapCrop.minLon; lon <= mapCrop.maxLon + 0.001; lon += 0.04) coordinates.push([lon, lat]);
    gridLines.push(pathForGeometry(mapGeometryCoordinates({ type: "LineString", coordinates }, screen, 0)));
  }

  const prefectureLabels = [
    ["NIIGATA", 138.74, 37.62],
    ["TOKYO", 139.45, 35.78],
    ["NAGANO", 138.0, 36.24],
    ["GIFU", 136.9, 35.76],
    ["TOYAMA", 137.14, 36.67],
    ["ISHIKAWA", 136.55, 36.7],
    ["FUKUI", 136.2, 35.9],
    ["YAMANASHI", 138.56, 35.66],
    ["SHIZUOKA", 138.25, 35.03],
    ["AICHI", 137.0, 35.12],
    ["SHIGA", 136.05, 35.25],
    ["KYOTO", 135.63, 35.3]
  ];

  const shirahoneRadiusKm = 7;
  const okuhidaRadiusKm = 18;
  const shirahoneRadius = shirahoneRadiusKm * 1000 * projection.scale;
  const okuhidaRadius = okuhidaRadiusKm * 1000 * projection.scale;
  const hundredMiles =
    Math.abs(projection.raw([139, 36])[0] - projection.raw([137.888, 36])[0]) *
    projection.scale *
    1.609344;
  const scaleX = MAP.x + 44;
  const scaleY = MAP.y + MAP.height - 38;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc">
  <title id="title">Central Japan middle-route map</title>
  <desc id="desc">A projected map showing all of Niigata prefecture, Lake Nojiri, James Brown, Shirahone Onsen, Okuhida Onsen-go, Chubu-Sangaku National Park, Tokyo, and Kyoto.</desc>
  <metadata>
    Projection: custom Lambert conformal conic, GRS80, standard parallels 34.5 and 38 degrees, central meridian 138 degrees.
    Administrative geography and coarse Seiro-machi municipality point: MLIT N03 2025. The viewport is fitted from the full Niigata prefecture geometry plus the required trip features, and context land is spatially selected from all 47 prefecture packages. Station anchors used during processing: MLIT N02 2024; no partial rail line is rendered. Lake Nojiri: MLIT W09 2005. Chubu-Sangaku National Park: Ministry of the Environment national park areas, April 2025. Cached driving routes rendered by the website: OpenStreetMap contributors via OSRM.
  </metadata>
  <defs>
    <clipPath id="mapClip"><rect x="${MAP.x}" y="${MAP.y}" width="${MAP.width}" height="${MAP.height}"/></clipPath>
    <pattern id="paperLines" width="14" height="14" patternUnits="userSpaceOnUse">
      <path d="M0 13.5H14" stroke="${COLORS.carbon}" stroke-opacity="0.035" stroke-width="1"/>
    </pattern>
    <pattern id="parkHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(34)">
      <rect width="10" height="10" fill="${COLORS.green}" fill-opacity="0.42"/>
      <path d="M0 0V10" stroke="${COLORS.white}" stroke-opacity="0.55" stroke-width="3"/>
    </pattern>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.paper}"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#paperLines)"/>

  <text x="54" y="72" font-family="'Arial Narrow','Segoe UI',Arial,sans-serif" font-size="54" font-weight="900" letter-spacing="-1.2" fill="${COLORS.carbon}">CENTRAL JAPAN</text>
  <text x="56" y="112" font-family="'Segoe UI',Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="0.8" fill="${COLORS.carbonSoft}">MIDDLE ROUTE</text>

  <rect x="${MAP.x + 12}" y="${MAP.y + 12}" width="${MAP.width}" height="${MAP.height}" fill="${COLORS.carbon}" opacity="0.15"/>
  <rect x="${MAP.x}" y="${MAP.y}" width="${MAP.width}" height="${MAP.height}" fill="${COLORS.ocean}" stroke="${COLORS.carbon}" stroke-width="3"/>

  <g clip-path="url(#mapClip)">
    ${gridLines.map(d => `<path d="${d}" fill="none" stroke="${COLORS.white}" stroke-opacity="0.34" stroke-width="1" stroke-dasharray="3 8"/>`).join("")}

    ${municipalityFills
      .map(({ prefecture, d }) => {
        const fill = prefFills[prefecture] ?? COLORS.land;
        return `<path d="${d}" fill="${fill}" stroke="${fill}" stroke-width="0.8" stroke-linejoin="round" fill-rule="evenodd"/>`;
      })
      .join("")}

    <path d="${prefectureBoundaryPath}" fill="none" stroke="${COLORS.boundary}" stroke-width="1.25" stroke-opacity="0.72"/>
    <path d="${coastlinePath}" fill="none" stroke="${COLORS.carbon}" stroke-width="2.2" stroke-opacity="0.88"/>

    <path d="${parkPath}" fill="url(#parkHatch)" stroke="${COLORS.green}" stroke-width="2.3" fill-rule="evenodd"/>
    <path d="${lakePath}" fill="${COLORS.blue}" stroke="${COLORS.carbon}" stroke-width="1.6" fill-rule="evenodd"/>

    <circle cx="${shirahonePoint[0]}" cy="${shirahonePoint[1]}" r="${shirahoneRadius.toFixed(2)}" fill="${COLORS.violet}" fill-opacity="0.075" stroke="${COLORS.violet}" stroke-width="2.2" stroke-dasharray="7 8"/>
    <circle cx="${hirayuPoint[0]}" cy="${hirayuPoint[1]}" r="${okuhidaRadius.toFixed(2)}" fill="${COLORS.violet}" fill-opacity="0.045" stroke="${COLORS.violet}" stroke-width="2.2" stroke-dasharray="7 8"/>

    ${prefectureLabels
      .map(([name, lon, lat]) => {
        const [x, y] = screen([lon, lat]);
        return textBlock(x, y, [name], {
          anchor: "middle",
          size: 14,
          weight: 800,
          fill: COLORS.carbon,
          letterSpacing: 2.1,
          opacity: 0.48
        });
      })
      .join("")}

    <g>
      <circle cx="${tokyoPoint[0]}" cy="${tokyoPoint[1]}" r="10" fill="${COLORS.coral}" stroke="${COLORS.carbon}" stroke-width="3"/>
      <rect x="${(lakePoint[0] - 8).toFixed(2)}" y="${(lakePoint[1] - 8).toFixed(2)}" width="16" height="16" fill="${COLORS.punched}" stroke="${COLORS.violet}" stroke-width="3" transform="rotate(45 ${lakePoint[0].toFixed(2)} ${lakePoint[1].toFixed(2)})"/>
      <circle cx="${kyotoPoint[0]}" cy="${kyotoPoint[1]}" r="11" fill="${COLORS.punched}" stroke="${COLORS.blue}" stroke-width="3.5"/>
      <rect x="${(shirahonePoint[0] - 7).toFixed(2)}" y="${(shirahonePoint[1] - 7).toFixed(2)}" width="14" height="14" fill="${COLORS.punched}" stroke="${COLORS.violet}" stroke-width="3" transform="rotate(45 ${shirahonePoint[0].toFixed(2)} ${shirahonePoint[1].toFixed(2)})"/>
      <rect x="${(hirayuPoint[0] - 7).toFixed(2)}" y="${(hirayuPoint[1] - 7).toFixed(2)}" width="14" height="14" fill="${COLORS.punched}" stroke="${COLORS.violet}" stroke-width="3" transform="rotate(45 ${hirayuPoint[0].toFixed(2)} ${hirayuPoint[1].toFixed(2)})"/>
      <rect x="${(seiroPoint[0] - 8).toFixed(2)}" y="${(seiroPoint[1] - 8).toFixed(2)}" width="16" height="16" fill="${COLORS.punched}" stroke="${COLORS.violet}" stroke-width="3" transform="rotate(45 ${seiroPoint[0].toFixed(2)} ${seiroPoint[1].toFixed(2)})"/>
    </g>

    ${labelWithLeader(tokyoPoint, [tokyoPoint[0] - 24, tokyoPoint[1] - 34], ["TOKYO"], {
      color: COLORS.coral,
      align: "end"
    })}
    ${labelWithLeader(lakePoint, [lakePoint[0] + 24, lakePoint[1] - 46], ["LAKE NOJIRI"], {
      color: COLORS.violet,
      align: "start"
    })}
    ${labelWithLeader(kyotoPoint, [kyotoPoint[0] + 26, kyotoPoint[1] + 22], ["KYOTO"], {
      color: COLORS.blue,
      align: "start"
    })}
    ${labelWithLeader(seiroPoint, [seiroPoint[0] + 30, seiroPoint[1] - 24], ["JAMES BROWN"], {
      color: COLORS.violet,
      align: "start",
      small: true
    })}

    <g transform="translate(${scaleX} ${scaleY})">
      <path d="M0 0H${hundredMiles.toFixed(2)}" stroke="${COLORS.carbon}" stroke-width="4"/>
      <path d="M0 -7V7M${hundredMiles.toFixed(2)} -7V7" stroke="${COLORS.carbon}" stroke-width="2"/>
      ${textBlock(hundredMiles / 2, -12, ["100 MI"], {
        anchor: "middle",
        size: 13,
        weight: 800,
        fill: COLORS.carbon,
        letterSpacing: 1.2
      })}
    </g>

    <g transform="translate(${MAP.x + MAP.width - 44} ${MAP.y + 58})">
      <path d="M0 28V-12" stroke="${COLORS.carbon}" stroke-width="2.5"/>
      <path d="M0 -20L-7 -7H7Z" fill="${COLORS.carbon}"/>
      ${textBlock(0, -28, ["N"], { anchor: "middle", size: 15, weight: 900, fill: COLORS.carbon })}
    </g>
  </g>

  <g>
    <rect x="1320" y="184" width="426" height="548" fill="${COLORS.punched}" stroke="${COLORS.carbon}" stroke-width="3"/>
    <path d="M1348 256H1718" stroke="${COLORS.carbon}" stroke-width="2"/>
    ${textBlock(1348, 228, ["MAP KEY"], {
      size: 28,
      weight: 900,
      fill: COLORS.carbon,
      letterSpacing: 1.6
    })}

    ${textBlock(1348, 294, ["LOCATIONS"], {
      size: 21,
      weight: 900,
      fill: COLORS.carbon,
      letterSpacing: 1.2
    })}
    <g transform="translate(1352 330)">
      <rect x="0" y="0" width="16" height="16" fill="${COLORS.punched}" stroke="${COLORS.violet}" stroke-width="3" transform="rotate(45 8 8)"/>
      <rect x="0" y="68" width="16" height="16" fill="${COLORS.punched}" stroke="${COLORS.violet}" stroke-width="3" transform="rotate(45 8 76)"/>
      <rect x="0" y="136" width="16" height="16" fill="${COLORS.punched}" stroke="${COLORS.violet}" stroke-width="3" transform="rotate(45 8 144)"/>
      <rect x="0" y="204" width="16" height="16" fill="${COLORS.punched}" stroke="${COLORS.violet}" stroke-width="3" transform="rotate(45 8 212)"/>
      ${textBlock(36, 3, ["LAKE NOJIRI"], {
        size: 15,
        weight: 850,
        lineHeight: 19,
        fill: COLORS.carbon
      })}
      ${textBlock(36, 71, ["JAMES BROWN"], {
        size: 15,
        weight: 850,
        lineHeight: 19,
        fill: COLORS.violet
      })}
      ${textBlock(36, 139, ["SHIRAHONE ONSEN"], {
        size: 15,
        weight: 850,
        lineHeight: 19,
        fill: COLORS.violet
      })}
      ${textBlock(36, 207, ["OKUHIDA ONSEN-GO / HIRAYU"], {
        size: 15,
        weight: 850,
        lineHeight: 19,
        fill: COLORS.violet
      })}
    </g>

    <path d="M1348 578H1718" stroke="${COLORS.carbon}" stroke-width="2"/>
    ${textBlock(1348, 612, ["PARK"], {
      size: 21,
      weight: 900,
      fill: COLORS.carbon,
      letterSpacing: 1.1
    })}
    <rect x="1350" y="635" width="20" height="20" fill="url(#parkHatch)" stroke="${COLORS.green}" stroke-width="2"/>
    ${textBlock(1388, 640, ["CHUBU-SANGAKU NATIONAL PARK"], {
      size: 14,
      weight: 850,
      lineHeight: 19,
      fill: COLORS.green
    })}
  </g>

  <text x="56" y="1082" font-family="'Segoe UI',Arial,sans-serif" font-size="12.5" font-weight="600" fill="${COLORS.carbonSoft}">
    MLIT N03 2025 · MLIT N02 2024 · MLIT W09 2005 · MOE National Park Areas Apr 2025 · © OpenStreetMap contributors, ODbL 1.0
  </text>
</svg>`;

  const svgPath = path.join(ROOT, "central-japan-concept-map.svg");
  const pngPath = path.join(ROOT, "central-japan-concept-map.png");
  const desktopReviewPath = path.join(REVIEW, "desktop-1800.png");
  const mobileReviewPath = path.join(REVIEW, "mobile-review-720.png");
  await fsp.writeFile(svgPath, svg);
  const publicSvgPath = path.join(ROOT, "..", "..", "public", "maps", "central-japan-concept-map.svg");
  await fsp.mkdir(path.dirname(publicSvgPath), { recursive: true });
  await fsp.writeFile(publicSvgPath, svg);

  const desktop = new Resvg(svg, { fitTo: { mode: "width", value: 1800 }, background: COLORS.paper });
  const full = new Resvg(svg, { fitTo: { mode: "width", value: 2400 }, background: COLORS.paper });
  const mobile = new Resvg(svg, { fitTo: { mode: "width", value: 720 }, background: COLORS.paper });
  await fsp.writeFile(desktopReviewPath, desktop.render().asPng());
  await fsp.writeFile(pngPath, full.render().asPng());
  await fsp.writeFile(mobileReviewPath, mobile.render().asPng());

  const derived = {
    type: "FeatureCollection",
    name: "Central Japan concept map derived layers",
    crs_note: "Source coordinates retained as longitude/latitude; SVG uses the custom LCC described in provenance.md.",
    features: [
      { type: "Feature", properties: { layer: "coastline", source: "MLIT N03 2025", display_simplification_degrees: 0.004 }, geometry: mapGeometryCoordinates(coastlineGeometry, coordinate => coordinate, 0.004) },
      { type: "Feature", properties: { layer: "prefecture-boundary", source: "MLIT N03 2025", display_simplification_degrees: 0.004 }, geometry: mapGeometryCoordinates(prefectureBoundaryGeometry, coordinate => coordinate, 0.004) },
      { type: "Feature", properties: { layer: "municipality-context", name: "Seiro-machi", source: "MLIT N03 2025", municipality_code: "15307", display_simplification_degrees: 0.0004 }, geometry: mapGeometryCoordinates(seiroGeometry, coordinate => coordinate, 0.0004) },
      { type: "Feature", properties: { layer: "lake", name: "Lake Nojiri", display_simplification_degrees: 0.0004 }, geometry: mapGeometryCoordinates(lake.geometry, coordinate => coordinate, 0.0004) },
      { type: "Feature", properties: { layer: "national-park", name: "Chubu-Sangaku", display_simplification_degrees: 0.0015 }, geometry: mapGeometryCoordinates(parkGeometry, coordinate => coordinate, 0.0015) },
      { type: "Feature", properties: { layer: "route-anchor", name: "Tokyo Station", state: "start-reference" }, geometry: { type: "Point", coordinates: tokyo } },
      { type: "Feature", properties: { layer: "stop-option", name: "Lake Nojiri cabin area", state: "candidate-stay", location_precision: "approximate public lake-area point" }, geometry: { type: "Point", coordinates: lakeCenter } },
      { type: "Feature", properties: { layer: "route-anchor", name: "Kyoto Station", state: "end-option" }, geometry: { type: "Point", coordinates: kyoto } },
      { type: "Feature", properties: { layer: "onsen-candidate", name: "Shirahone Onsen", state: "candidate-stay", side: "Nagano / east", radius_km: shirahoneRadiusKm }, geometry: { type: "Point", coordinates: shirahone } },
      { type: "Feature", properties: { layer: "onsen-candidate", name: "Okuhida Onsen-go", state: "candidate-stay", anchor: "Hirayu", side: "Gifu / west", radius_km: okuhidaRadiusKm }, geometry: { type: "Point", coordinates: hirayu } },
      { type: "Feature", properties: { layer: "stop-option", name: "James Brown", area: "Niigata municipality-level area", state: "candidate-family-stop", itinerary_stop: null, overnight_count: null, location_precision: "municipality-level representative point from MLIT N03 2025", privacy: "No street address or house-level coordinate is stored." }, geometry: { type: "Point", coordinates: seiroCenter } }
    ]
  };
  await fsp.writeFile(path.join(ROOT, "derived-map-layers.geojson"), JSON.stringify(derived, null, 2));

  const mapPoints = {
    version: 1,
    viewBox: [0, 0, WIDTH, HEIGHT],
    locations: [
      {
        id: "lake-nojiri",
        x: Number(lakePoint[0].toFixed(2)),
        y: Number(lakePoint[1].toFixed(2)),
        status: "option",
        statusLabel: "Nagano",
        title: "Lake Nojiri",
        detail: "Nagano cabin area",
        itineraryRelation: "Optional middle stop."
      },
      {
        id: "shirahone",
        x: Number(shirahonePoint[0].toFixed(2)),
        y: Number(shirahonePoint[1].toFixed(2)),
        status: "option",
        statusLabel: "Nagano",
        title: "Shirahone Onsen",
        detail: "Nagano",
        itineraryRelation: "Optional middle stop."
      },
      {
        id: "okuhida",
        x: Number(hirayuPoint[0].toFixed(2)),
        y: Number(hirayuPoint[1].toFixed(2)),
        status: "option",
        statusLabel: "Gifu",
        title: "Okuhida Onsen-go / Hirayu",
        detail: "Gifu",
        itineraryRelation: "Optional middle stop."
      },
      {
        id: "family-location",
        x: Number(seiroPoint[0].toFixed(2)),
        y: Number(seiroPoint[1].toFixed(2)),
        status: "option",
        statusLabel: "Niigata",
        title: "James Brown",
        detail: "Niigata",
        itineraryRelation: "Optional middle stop."
      }
    ],
    familyLocationSource: {
      dataset: "MLIT National Land Numerical Information N03 2025",
      municipalityCode: "15307",
      method: "Area-weighted centroid of official municipality polygons, shown in its true position on the fitted regional map.",
      privacy: "No street address or house-level coordinate is stored."
    }
  };
  const frontendPointsPath = path.join(ROOT, "..", "..", "src", "data", "central-japan-map-points.json");
  await fsp.writeFile(frontendPointsPath, JSON.stringify(mapPoints, null, 2));

  const drivingRoutes = {
    version: 1,
    preparedAt: drivingRouteCache.generatedAt,
    source: {
      service: "OSRM public route service",
      roadData: "OpenStreetMap",
      profile: "driving",
      traffic: "not included",
      cacheFile: path.relative(ROOT, drivingCachePath).replaceAll("\\", "/"),
      attribution: "© OpenStreetMap contributors, ODbL 1.0"
    },
    caveat:
      "Driving estimates exclude live traffic. Recheck road conditions before travel.",
    viewBox: [0, 0, WIDTH, HEIGHT],
    startNodeIds,
    middleNodeIds,
    endNodeIds,
    nodes: drivingNodeScreen,
    pairs: projectedDrivingPairs
  };
  const frontendDrivingPath = path.join(
    ROOT,
    "..",
    "..",
    "src",
    "data",
    "central-japan-driving-routes.json"
  );
  await fsp.writeFile(frontendDrivingPath, JSON.stringify(drivingRoutes, null, 2));
  await fsp.writeFile(
    path.join(ROOT, "driving-route-pairs.json"),
    JSON.stringify(drivingRoutes, null, 2)
  );

  const routeBuilderValidation = {
    status: "passed",
    supportedNodeCount: drivingNodes.length,
    requiredPairCount: requiredDrivingPairs.length,
    cachedPairCount: Object.keys(projectedDrivingPairs).length,
    uniqueMiddleStops: new Set(middleNodeIds).size === middleNodeIds.length,
    allOrderChangesSupported: middleNodeIds.every(fromId =>
      middleNodeIds.every(
        toId => fromId === toId || Boolean(projectedDrivingPairs[`${fromId}__${toId}`])
      )
    ),
    allStartAndEndPairsSupported:
      startNodeIds.every(startId =>
        [...middleNodeIds, ...endNodeIds].every(destinationId =>
          Boolean(projectedDrivingPairs[`${startId}__${destinationId}`])
        )
      ) &&
      middleNodeIds.every(fromId =>
        endNodeIds.every(endId => Boolean(projectedDrivingPairs[`${fromId}__${endId}`]))
      ),
    noPartialRailRendering: true,
    privateAddressFieldsPresent: JSON.stringify(drivingRoutes).toLowerCase().includes("street address")
  };
  if (
    !routeBuilderValidation.uniqueMiddleStops ||
    !routeBuilderValidation.allOrderChangesSupported ||
    !routeBuilderValidation.allStartAndEndPairsSupported ||
    routeBuilderValidation.privateAddressFieldsPresent
  ) {
    throw new Error(`Route builder validation failed: ${JSON.stringify(routeBuilderValidation)}`);
  }
  await fsp.writeFile(
    path.join(ROOT, "route-builder-validation.json"),
    JSON.stringify(routeBuilderValidation, null, 2)
  );

  const landCoverageValidation = {
    status: adminFeaturesByCode.size === prefectures.length ? "passed" : "failed",
    validationMethod:
      "Loaded every MLIT N03 2025 prefecture package, fitted the map from full Niigata plus required trip features, then rendered every official administrative feature whose bounds intersect the buffered viewport.",
    allPrefecturePackagesLoaded: adminFeaturesByCode.size === prefectures.length,
    prefecturePackageCount: adminFeaturesByCode.size,
    fittedMapBounds: mapCrop,
    bufferedContextBounds: contextCrop,
    renderedAdministrativeFeatureCount: adminFeatures.length,
    intersectingPackages,
    previouslyOmittedIntersectingPackages: intersectingPackages.filter(
      item => Number(item.code) < 10 || Number(item.code) > 30
    ),
    niigata: {
      officialFeatureCount: niigataFeatures.length,
      bounds: combinedBounds([niigataGeometry]),
      fullyInsideFittedMap:
        geometryIntersectsBounds(niigataGeometry, mapCrop) &&
        boundsOfGeometry(niigataGeometry)[0] >= mapCrop.minLon &&
        boundsOfGeometry(niigataGeometry)[1] >= mapCrop.minLat &&
        boundsOfGeometry(niigataGeometry)[2] <= mapCrop.maxLon &&
        boundsOfGeometry(niigataGeometry)[3] <= mapCrop.maxLat
    },
    seiroMarkerInsideMainViewport:
      seiroPoint[0] >= MAP.x &&
      seiroPoint[0] <= MAP.x + MAP.width &&
      seiroPoint[1] >= MAP.y &&
      seiroPoint[1] <= MAP.y + MAP.height
  };
  if (
    landCoverageValidation.status !== "passed" ||
    !landCoverageValidation.niigata.fullyInsideFittedMap ||
    !landCoverageValidation.seiroMarkerInsideMainViewport
  ) {
    throw new Error(`Land coverage validation failed: ${JSON.stringify(landCoverageValidation)}`);
  }
  await fsp.writeFile(
    path.join(ROOT, "land-coverage-validation.json"),
    JSON.stringify(landCoverageValidation, null, 2)
  );

  const manifestEntries = [];
  for (const definition of [...sourceDefinitions, routeDefinition]) {
    const localPath = path.join(SOURCE, definition.file);
    manifestEntries.push({
      ...definition,
      localPath: path.relative(ROOT, localPath).replaceAll("\\", "/"),
      bytes: fs.statSync(localPath).size,
      sha256: await sha256(localPath)
    });
  }
  const nominatimDefinitions = [
    {
      id: "osm-nominatim-shirahone",
      title: "OpenStreetMap Nominatim snapshot for Shirahone Onsen",
      url: "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=%E7%99%BD%E9%AA%A8%E6%B8%A9%E6%B3%89%20%E9%95%B7%E9%87%8E%E7%9C%8C%20%E6%97%A5%E6%9C%AC",
      file: "shirahone-nominatim.json"
    },
    {
      id: "osm-nominatim-hirayu",
      title: "OpenStreetMap Nominatim snapshot for Hirayu Onsen",
      url: "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&q=Hirayu%20Onsen%2C%20Takayama%2C%20Gifu%2C%20Japan",
      file: "okuhida-nominatim.json"
    }
  ];
  for (const definition of nominatimDefinitions) {
    const localPath = path.join(SOURCE, definition.file);
    manifestEntries.push({
      ...definition,
      license: "OpenStreetMap contributors, ODbL 1.0",
      landingPage: "https://operations.osmfoundation.org/policies/nominatim/",
      localPath: path.relative(ROOT, localPath).replaceAll("\\", "/"),
      bytes: fs.statSync(localPath).size,
      sha256: await sha256(localPath)
    });
  }
  manifestEntries.push({
    id: "osm-osrm-driving-route-pairs",
    title: "Cached OSRM driving routes for the ordered Central Japan route builder",
    url: "https://router.project-osrm.org/",
    license: "OpenStreetMap contributors, ODbL 1.0",
    landingPage: "https://www.openstreetmap.org/copyright",
    localPath: path.relative(ROOT, drivingCachePath).replaceAll("\\", "/"),
    bytes: fs.statSync(drivingCachePath).size,
    sha256: await sha256(drivingCachePath)
  });
  await fsp.writeFile(
    path.join(ROOT, "source-manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        projection: {
          name: "Central Honshu Lambert Conformal Conic",
          proj4: LCC,
          sourceCoordinates: "JGD2011/WGS84-compatible longitude and latitude",
          fittedMapBounds: mapCrop,
          bufferedContextBounds: contextCrop
        },
        sources: manifestEntries
      },
      null,
      2
    )
  );

  log(`Wrote ${svgPath}`);
  log(`Wrote ${publicSvgPath}`);
  log(`Wrote ${pngPath}`);
}

build().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
