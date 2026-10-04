import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { inflateRawSync } from 'node:zlib'

const root = resolve(import.meta.dirname, '..')
const cacheDir = join(root, '.cache', 'tokyo-wards')
const dataDir = join(root, 'src', 'data')
const mapshaperVersion = '0.7.68'
const edition = '2025-01-01'
const clipBounds = '139.44,35.49,140.06,35.85'
const sourceCodes = ['11', '12', '13', '14']

const sources = sourceCodes.map((code) => ({
  code,
  url: `https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_${code}_GML.zip`,
  zip: join(cacheDir, `N03-20250101_${code}_GML.zip`),
  geojson: join(cacheDir, `N03-20250101_${code}.geojson`),
}))

const wardNames = {
  '13101': { en: 'Chiyoda', planning: 'Tokyo Station / central core', group: 'central' },
  '13102': { en: 'Chuo', planning: 'Ginza / Tsukiji', group: 'central' },
  '13103': { en: 'Minato', planning: 'Roppongi / Odaiba west', group: 'south' },
  '13104': { en: 'Shinjuku', planning: 'Shinjuku', group: 'west' },
  '13105': { en: 'Bunkyo', planning: '', group: 'context' },
  '13106': { en: 'Taito', planning: 'Asakusa / Ueno', group: 'east' },
  '13107': { en: 'Sumida', planning: '', group: 'context' },
  '13108': { en: 'Koto', planning: 'Odaiba east / bayside', group: 'bay' },
  '13109': { en: 'Shinagawa', planning: 'Shinagawa', group: 'south' },
  '13110': { en: 'Meguro', planning: 'Nakameguro', group: 'south' },
  '13111': { en: 'Ota', planning: '', group: 'context' },
  '13112': { en: 'Setagaya', planning: '', group: 'context' },
  '13113': { en: 'Shibuya', planning: 'Shibuya / Harajuku', group: 'west' },
  '13114': { en: 'Nakano', planning: '', group: 'context' },
  '13115': { en: 'Suginami', planning: '', group: 'context' },
  '13116': { en: 'Toshima', planning: 'Ikebukuro', group: 'west' },
  '13117': { en: 'Kita', planning: '', group: 'context' },
  '13118': { en: 'Arakawa', planning: '', group: 'context' },
  '13119': { en: 'Itabashi', planning: '', group: 'context' },
  '13120': { en: 'Nerima', planning: '', group: 'context' },
  '13121': { en: 'Adachi', planning: '', group: 'context' },
  '13122': { en: 'Katsushika', planning: '', group: 'context' },
  '13123': { en: 'Edogawa', planning: '', group: 'context' },
}

const railSource = {
  edition: '2022',
  url: 'https://nlftp.mlit.go.jp/ksj/gml/data/N02/N02-22/N02-22_GML.zip',
  zip: join(cacheDir, 'N02-22_GML.zip'),
  sections: join(cacheDir, 'N02-22_RailroadSection.geojson'),
  stations: join(cacheDir, 'N02-22_Station.geojson'),
}

const railRoutes = [
  {
    id: 'metro-ginza',
    name: 'Ginza Line',
    short: 'Ginza',
    operator: 'Tokyo Metro',
    operatorJa: '東京地下鉄',
    sourceNames: ['3号線銀座線'],
    color: '#f39700',
    priority: true,
  },
  {
    id: 'metro-marunouchi',
    name: 'Marunouchi Line',
    short: 'Marunouchi',
    operator: 'Tokyo Metro',
    operatorJa: '東京地下鉄',
    sourceNames: ['4号線丸ノ内線', '4号線丸ノ内線分岐線'],
    color: '#e60012',
    priority: true,
  },
  {
    id: 'metro-hibiya',
    name: 'Hibiya Line',
    short: 'Hibiya',
    operator: 'Tokyo Metro',
    operatorJa: '東京地下鉄',
    sourceNames: ['2号線日比谷線'],
    color: '#9caeb7',
    priority: true,
  },
  {
    id: 'metro-tozai',
    name: 'Tozai Line',
    short: 'Tozai',
    operator: 'Tokyo Metro',
    operatorJa: '東京地下鉄',
    sourceNames: ['5号線東西線'],
    color: '#00a7db',
    priority: false,
  },
  {
    id: 'metro-chiyoda',
    name: 'Chiyoda Line',
    short: 'Chiyoda',
    operator: 'Tokyo Metro',
    operatorJa: '東京地下鉄',
    sourceNames: ['9号線千代田線'],
    color: '#009944',
    priority: false,
  },
  {
    id: 'metro-yurakucho',
    name: 'Yurakucho Line',
    short: 'Yurakucho',
    operator: 'Tokyo Metro',
    operatorJa: '東京地下鉄',
    sourceNames: ['8号線有楽町線'],
    color: '#d7c447',
    priority: false,
  },
  {
    id: 'metro-hanzomon',
    name: 'Hanzomon Line',
    short: 'Hanzomon',
    operator: 'Tokyo Metro',
    operatorJa: '東京地下鉄',
    sourceNames: ['11号線半蔵門線'],
    color: '#9b7cb6',
    priority: false,
  },
  {
    id: 'metro-namboku',
    name: 'Namboku Line',
    short: 'Namboku',
    operator: 'Tokyo Metro',
    operatorJa: '東京地下鉄',
    sourceNames: ['7号線南北線'],
    color: '#00ada9',
    priority: false,
  },
  {
    id: 'metro-fukutoshin',
    name: 'Fukutoshin Line',
    short: 'Fukutoshin',
    operator: 'Tokyo Metro',
    operatorJa: '東京地下鉄',
    sourceNames: ['13号線副都心線'],
    color: '#bb641d',
    priority: true,
  },
  {
    id: 'toei-asakusa',
    name: 'Asakusa Line',
    short: 'Asakusa',
    operator: 'Toei Subway',
    operatorJa: '東京都',
    sourceNames: ['1号線浅草線'],
    color: '#e85298',
    priority: true,
  },
  {
    id: 'toei-mita',
    name: 'Mita Line',
    short: 'Mita',
    operator: 'Toei Subway',
    operatorJa: '東京都',
    sourceNames: ['6号線三田線'],
    color: '#0079c2',
    priority: false,
  },
  {
    id: 'toei-shinjuku',
    name: 'Shinjuku Line',
    short: 'Shinjuku',
    operator: 'Toei Subway',
    operatorJa: '東京都',
    sourceNames: ['10号線新宿線'],
    color: '#6cbb5a',
    priority: false,
  },
  {
    id: 'toei-oedo',
    name: 'Oedo Line',
    short: 'Oedo',
    operator: 'Toei Subway',
    operatorJa: '東京都',
    sourceNames: ['12号線大江戸線'],
    color: '#b6007a',
    priority: true,
  },
  {
    id: 'jr-yamanote',
    name: 'JR Yamanote Line',
    short: 'Yamanote',
    operator: 'JR East',
    operatorJa: '東日本旅客鉄道',
    sourceNames: ['山手線', '東海道線', '東北線'],
    color: '#80c241',
    priority: true,
  },
  {
    id: 'odakyu-odawara',
    name: 'Odakyu Odawara Line',
    short: 'Odakyu',
    operator: 'Odakyu Electric Railway',
    operatorJa: '小田急電鉄',
    sourceNames: ['小田原線'],
    color: '#2288cc',
    priority: false,
    category: 'hotel-access',
  },
  {
    id: 'keio-inokashira',
    name: 'Keio Inokashira Line',
    short: 'Inokashira',
    operator: 'Keio Corporation',
    operatorJa: '京王電鉄',
    sourceNames: ['井の頭線'],
    color: '#dd0077',
    priority: false,
    category: 'hotel-access',
  },
]

const railStations = [
  { id: 'shinjuku', name: 'Shinjuku', sourceNames: ['新宿'], primary: true },
  { id: 'shibuya', name: 'Shibuya', sourceNames: ['渋谷'], primary: true },
  { id: 'ikebukuro', name: 'Ikebukuro', sourceNames: ['池袋'], primary: false },
  { id: 'ueno', name: 'Ueno', sourceNames: ['上野'], primary: true },
  { id: 'asakusa', name: 'Asakusa', sourceNames: ['浅草'], primary: false },
  { id: 'akihabara', name: 'Akihabara', sourceNames: ['秋葉原'], primary: false },
  {
    id: 'tokyo-otemachi',
    name: 'Tokyo / Otemachi',
    sourceNames: ['東京', '大手町'],
    primary: true,
  },
  { id: 'ginza', name: 'Ginza', sourceNames: ['銀座'], primary: true },
  { id: 'roppongi', name: 'Roppongi', sourceNames: ['六本木'], primary: false },
  { id: 'shinagawa', name: 'Shinagawa', sourceNames: ['品川'], primary: false },
]

const stayStations = [
  {
    id: 'tochomae',
    name: 'Tochomae',
    sourceNames: ['都庁前'],
    hotelIds: ['park-hyatt-tokyo'],
  },
  {
    id: 'seibu-shinjuku',
    name: 'Seibu-Shinjuku',
    sourceNames: ['西武新宿'],
    hotelIds: ['hotel-groove-shinjuku'],
  },
  {
    id: 'toranomon-hills',
    name: 'Toranomon Hills',
    sourceNames: ['虎ノ門ヒルズ'],
    hotelIds: ['hotel-toranomon-hills'],
  },
  {
    id: 'setagaya-daita',
    name: 'Setagaya-Daita',
    sourceNames: ['世田谷代田'],
    hotelIds: ['yuen-bettei-daita'],
  },
  {
    id: 'shimokitazawa',
    name: 'Shimokitazawa',
    sourceNames: ['下北沢'],
    hotelIds: ['yuen-bettei-daita'],
  },
  {
    id: 'yoyogi-koen',
    name: 'Yoyogi-Koen',
    sourceNames: ['代々木公園'],
    hotelIds: ['trunk-hotel-yoyogi-park'],
  },
]

const stayHotels = [
  {
    id: 'park-hyatt-tokyo',
    pathId: 'central',
    mapCode: 'A1',
    name: 'Park Hyatt Tokyo',
    area: 'West Shinjuku',
    wardCode: '13104',
    longitude: 139.6885232128674,
    latitude: 35.68514901557579,
    catchmentRadius: 22,
    address: '3-7-1-2 Nishi-Shinjuku, Shinjuku, Tokyo 163-1055',
    stationIds: ['tochomae', 'shinjuku'],
    routeIds: ['toei-oedo', 'jr-yamanote'],
    officialFact:
      'The official access page places the hotel in Shinjuku Park Tower and describes access from Shinjuku Station.',
    sourceLabel: 'Park Hyatt Tokyo official access page',
    sourceUrl: 'https://restaurants.tokyo.park.hyatt.co.jp/en/access/',
    coordinateNote: 'Official embedded map pin',
    asOf: '2026-10-03',
  },
  {
    id: 'hotel-groove-shinjuku',
    pathId: 'central',
    mapCode: 'A2',
    name: 'HOTEL GROOVE SHINJUKU',
    officialName: 'HOTEL GROOVE SHINJUKU, A PARKROYAL Hotel',
    area: 'Kabukicho / Shinjuku',
    wardCode: '13104',
    longitude: 139.7006653,
    latitude: 35.6960038,
    catchmentRadius: 18,
    address: '1-29-1 Kabukicho, Shinjuku-ku, Tokyo 160-0021',
    stationIds: ['seibu-shinjuku', 'shinjuku'],
    routeIds: ['metro-marunouchi', 'jr-yamanote'],
    officialFact:
      'The official access page places the hotel in Tokyu Kabukicho Tower and lists Seibu-Shinjuku and Shinjuku stations.',
    sourceLabel: 'HOTEL GROOVE SHINJUKU official access page',
    sourceUrl: 'https://www.hotelgroove.jp/en/access/',
    coordinateNote: 'Official hotel Google Maps link',
    asOf: '2026-10-03',
  },
  {
    id: 'hotel-toranomon-hills',
    pathId: 'central',
    mapCode: 'A3',
    name: 'Hotel Toranomon Hills',
    officialName: 'Hotel Toranomon Hills, The Unbound Collection by Hyatt',
    area: 'Toranomon / Minato',
    wardCode: '13103',
    longitude: 139.74998,
    latitude: 35.66615,
    catchmentRadius: 20,
    address: '2-6-4 Toranomon, Minato-ku, Tokyo 105-0001',
    stationIds: ['toranomon-hills'],
    routeIds: ['metro-hibiya'],
    officialFact:
      'The official Hyatt access page states that the hotel is directly connected to Toranomon Hills Station on the Hibiya Line.',
    sourceLabel: 'Hotel Toranomon Hills official Hyatt access page',
    sourceUrl:
      'https://www.hyatt.com/unbound-collection/en-US/tyoub-hotel-toranomon-hills/parking-and-transportation',
    coordinateNote: 'Official Hyatt map metadata',
    asOf: '2026-10-03',
  },
  {
    id: 'yuen-bettei-daita',
    pathId: 'retreat',
    mapCode: 'B1',
    name: 'YUEN BETTEI DAITA',
    area: 'Daita / Shimokitazawa',
    wardCode: '13112',
    longitude: 139.6611952,
    latitude: 35.6582466,
    catchmentRadius: 44,
    address: '2-31-26 Daita, Setagaya-ku, Tokyo 155-0033',
    stationIds: ['setagaya-daita', 'shimokitazawa'],
    routeIds: ['odakyu-odawara', 'keio-inokashira'],
    officialFact:
      'The official access page lists Setagaya-Daita Station as approximately one minute away and Shimokitazawa Station as approximately eight minutes away on foot.',
    sourceLabel: 'YUEN BETTEI DAITA official access page',
    sourceUrl: 'https://www.uds-hotels.com/yuenbettei/daita/access/',
    coordinateNote: 'Official UDS Hotels Google Maps link',
    asOf: '2026-10-03',
  },
  {
    id: 'trunk-hotel-yoyogi-park',
    pathId: 'retreat',
    mapCode: 'B2',
    name: 'TRUNK(HOTEL) YOYOGI PARK',
    area: 'Tomigaya / Yoyogi Park',
    wardCode: '13113',
    longitude: 139.6923539,
    latitude: 35.6668094,
    catchmentRadius: 30,
    address: '1-15-2 Tomigaya, Shibuya-ku, Tokyo 151-0063',
    stationIds: ['yoyogi-koen', 'shibuya'],
    routeIds: ['metro-chiyoda', 'jr-yamanote'],
    officialFact:
      'The official hotel pages place the property in Tomigaya, across Inokashira Street from Yoyogi Park.',
    sourceLabel: 'TRUNK(HOTEL) YOYOGI PARK official access page',
    sourceUrl: 'https://yoyogipark.trunk-hotel.com/en/access',
    coordinateNote: 'Official hotel Google Maps link',
    asOf: '2026-10-03',
  },
]

mkdirSync(cacheDir, { recursive: true })
mkdirSync(dataDir, { recursive: true })

for (const source of sources) {
  if (!existsSync(source.zip)) {
    const response = await fetch(source.url)
    if (!response.ok) throw new Error(`Failed to download ${source.url}: ${response.status}`)
    writeFileSync(source.zip, Buffer.from(await response.arrayBuffer()))
  }

  if (!existsSync(source.geojson)) {
    const archive = readFileSync(source.zip)
    const entry = extractZipEntry(
      archive,
      (name) => name.endsWith(`N03-20250101_${source.code}.geojson`),
    )
    writeFileSync(source.geojson, entry)
  }
}

if (!existsSync(railSource.zip)) {
  const response = await fetch(railSource.url)
  if (!response.ok) throw new Error(`Failed to download ${railSource.url}: ${response.status}`)
  writeFileSync(railSource.zip, Buffer.from(await response.arrayBuffer()))
}

if (!existsSync(railSource.sections) || !existsSync(railSource.stations)) {
  const archive = readFileSync(railSource.zip)
  writeFileSync(
    railSource.sections,
    extractZipEntry(archive, (name) => name.endsWith('UTF-8/N02-22_RailroadSection.geojson')),
  )
  writeFileSync(
    railSource.stations,
    extractZipEntry(archive, (name) => name.endsWith('UTF-8/N02-22_Station.geojson')),
  )
}

const wardsGeojson = join(cacheDir, 'tokyo-wards.projected.geojson')
const wardUnionGeojson = join(cacheDir, 'tokyo-wards-union.projected.geojson')
const wardsTopojson = join(dataDir, 'tokyo-wards.topo.json')
const labelsGeojson = join(cacheDir, 'tokyo-ward-labels.geojson')
const contextGeojson = join(cacheDir, 'tokyo-context.projected.geojson')
const contextTopojson = join(dataDir, 'tokyo-context.topo.json')
const selectedRailGeojson = join(cacheDir, 'tokyo-rail.selected.geojson')
const projectedRailUnclippedGeojson = join(cacheDir, 'tokyo-rail.projected-unclipped.geojson')
const projectedRailGeojson = join(cacheDir, 'tokyo-rail.projected.geojson')
const railTopojson = join(dataDir, 'tokyo-rail.topo.json')
const selectedStationGeojson = join(cacheDir, 'tokyo-stations.selected.geojson')
const projectedStationUnclippedGeojson = join(
  cacheDir,
  'tokyo-stations.projected-unclipped.geojson',
)
const projectedStationGeojson = join(cacheDir, 'tokyo-stations.projected.geojson')
const selectedStayStationGeojson = join(cacheDir, 'tokyo-stay-stations.selected.geojson')
const projectedStayStationUnclippedGeojson = join(
  cacheDir,
  'tokyo-stay-stations.projected-unclipped.geojson',
)
const projectedStayStationGeojson = join(cacheDir, 'tokyo-stay-stations.projected.geojson')
const selectedStayHotelGeojson = join(cacheDir, 'tokyo-stay-hotels.selected.geojson')
const projectedStayHotelGeojson = join(cacheDir, 'tokyo-stay-hotels.projected.geojson')
const validationOutput = join(dataDir, 'tokyo-map-validation.json')

runMapshaper([
  sources.find(({ code }) => code === '13').geojson,
  '-filter',
  'N03_007 >= "13101" && N03_007 <= "13123"',
  '-dissolve',
  'N03_007',
  'copy-fields=N03_004',
  '-clean',
  '-proj',
  'epsg:32654',
  '-simplify',
  '12%',
  'keep-shapes',
  '-rename-fields',
  'ward_ja=N03_004,ward_code=N03_007',
  '-filter-fields',
  'ward_code,ward_ja',
  '-o',
  'format=geojson',
  wardsGeojson,
])

runMapshaper([wardsGeojson, '-o', 'format=topojson', wardsTopojson])
runMapshaper([wardsGeojson, '-points', 'inner', '-o', 'format=geojson', labelsGeojson])
runMapshaper([
  wardsGeojson,
  '-dissolve',
  '-clean',
  '-o',
  'format=geojson',
  wardUnionGeojson,
])

runMapshaper([
  ...sources.map(({ geojson }) => geojson),
  'combine-files',
  '-merge-layers',
  'target=*',
  'force',
  'name=context',
  '-filter',
  'N03_007 != null',
  '-dissolve',
  '-clip',
  `bbox=${clipBounds}`,
  '-clean',
  '-proj',
  'epsg:32654',
  '-simplify',
  '8%',
  'keep-shapes',
  '-o',
  'format=geojson',
  contextGeojson,
])

runMapshaper([contextGeojson, '-o', 'format=topojson', contextTopojson])

const rawRail = JSON.parse(readFileSync(railSource.sections, 'utf8'))
const routeSourceCounts = Object.fromEntries(railRoutes.map((route) => [route.id, 0]))
const selectedRailFeatures = rawRail.features.flatMap((feature) => {
  const route = routeForRailFeature(feature)
  if (!route) return []
  routeSourceCounts[route.id] += 1
  return [
    {
      ...feature,
      properties: {
        line_id: route.id,
        line_name: route.name,
        short_name: route.short,
        operator: route.operator,
        color: route.color,
        priority: route.priority ? 1 : 0,
        category: route.category ?? 'base',
        source_line: feature.properties.N02_003,
      },
    },
  ]
})

const missingRoutes = railRoutes.filter((route) => routeSourceCounts[route.id] === 0)
if (missingRoutes.length > 0) {
  throw new Error(`N02 route filter returned no geometry for: ${missingRoutes.map(({ id }) => id).join(', ')}`)
}

writeFileSync(
  selectedRailGeojson,
  JSON.stringify({ type: 'FeatureCollection', features: selectedRailFeatures }),
)

runMapshaper([
  selectedRailGeojson,
  '-dissolve',
  'line_id',
  'copy-fields=line_name,short_name,operator,color,priority,category',
  '-clean',
  '-proj',
  'epsg:32654',
  '-simplify',
  '35%',
  '-o',
  'format=geojson',
  projectedRailUnclippedGeojson,
])

runMapshaper([
  projectedRailUnclippedGeojson,
  '-clip',
  wardUnionGeojson,
  '-clean',
  '-o',
  'format=geojson',
  projectedRailGeojson,
])

runMapshaper([projectedRailGeojson, '-o', 'format=topojson', railTopojson])

const rawStations = JSON.parse(readFileSync(railSource.stations, 'utf8'))
const selectedStationFeatures = rawStations.features.flatMap((feature) => {
  const station = railStations.find(({ sourceNames }) =>
    sourceNames.includes(feature.properties.N02_005),
  )
  if (!station) return []
  const route = routeForStationFeature(feature)
  if (!route) return []

  return [
    {
      ...feature,
      properties: {
        station_id: station.id,
        station_name: station.name,
        station_name_ja: feature.properties.N02_005,
        primary: station.primary ? 1 : 0,
        line_id: route.id,
      },
    },
  ]
})

writeFileSync(
  selectedStationGeojson,
  JSON.stringify({ type: 'FeatureCollection', features: selectedStationFeatures }),
)

runMapshaper([
  selectedStationGeojson,
  '-proj',
  'epsg:32654',
  '-o',
  'format=geojson',
  projectedStationUnclippedGeojson,
])

runMapshaper([
  projectedStationUnclippedGeojson,
  '-clip',
  wardUnionGeojson,
  '-o',
  'format=geojson',
  projectedStationGeojson,
])

const selectedStayStationFeatures = rawStations.features.flatMap((feature) => {
  const station = stayStations.find(({ sourceNames }) =>
    sourceNames.includes(feature.properties.N02_005),
  )
  if (!station) return []

  return [
    {
      ...feature,
      properties: {
        station_id: station.id,
        station_name: station.name,
        station_name_ja: feature.properties.N02_005,
        line_name: feature.properties.N02_003,
        operator_name: feature.properties.N02_004,
      },
    },
  ]
})

writeFileSync(
  selectedStayStationGeojson,
  JSON.stringify({ type: 'FeatureCollection', features: selectedStayStationFeatures }),
)

runMapshaper([
  selectedStayStationGeojson,
  '-proj',
  'epsg:32654',
  '-o',
  'format=geojson',
  projectedStayStationUnclippedGeojson,
])

runMapshaper([
  projectedStayStationUnclippedGeojson,
  '-clip',
  wardUnionGeojson,
  '-o',
  'format=geojson',
  projectedStayStationGeojson,
])

writeFileSync(
  selectedStayHotelGeojson,
  JSON.stringify({
    type: 'FeatureCollection',
    features: stayHotels.map((hotel) => ({
      type: 'Feature',
      properties: { hotel_id: hotel.id },
      geometry: {
        type: 'Point',
        coordinates: [hotel.longitude, hotel.latitude],
      },
    })),
  }),
)

runMapshaper([
  selectedStayHotelGeojson,
  '-proj',
  'epsg:32654',
  '-o',
  'format=geojson',
  projectedStayHotelGeojson,
])

const wards = JSON.parse(readFileSync(wardsGeojson, 'utf8'))
const wardUnion = JSON.parse(readFileSync(wardUnionGeojson, 'utf8'))
const wardUnionGeometries =
  wardUnion.type === 'FeatureCollection'
    ? wardUnion.features.map((feature) => feature.geometry)
    : wardUnion.type === 'GeometryCollection'
      ? wardUnion.geometries
      : [wardUnion.geometry]
const labels = JSON.parse(readFileSync(labelsGeojson, 'utf8'))
const context = JSON.parse(readFileSync(contextGeojson, 'utf8'))
const projectedRail = JSON.parse(readFileSync(projectedRailGeojson, 'utf8'))
const projectedStations = JSON.parse(readFileSync(projectedStationGeojson, 'utf8'))
const projectedStayStations = JSON.parse(readFileSync(projectedStayStationGeojson, 'utf8'))
const projectedStayHotels = JSON.parse(readFileSync(projectedStayHotelGeojson, 'utf8'))
const contextFeatures =
  context.type === 'FeatureCollection'
    ? context.features
    : context.geometries.map((geometry) => ({ geometry }))

if (wards.features.length !== 23) {
  throw new Error(`Expected 23 special wards, received ${wards.features.length}`)
}

if (wardUnionGeometries.length !== 1 || !wardUnionGeometries[0]) {
  throw new Error(
    `Expected one dissolved special-ward union, received ${wardUnionGeometries.length}`,
  )
}

const labelByCode = new Map(
  labels.features.map((feature) => [feature.properties.ward_code, feature.geometry.coordinates]),
)
const bounds = geometryBounds(contextFeatures)
const viewport = { width: 1000, height: 720, padding: 0 }
const project = createViewportProjector(bounds, viewport)

const contextPaths = contextFeatures.flatMap((feature) => geometryPaths(feature.geometry, project))
const wardRecords = wards.features
  .map((feature) => {
    const code = feature.properties.ward_code
    const metadata = wardNames[code]
    if (!metadata) throw new Error(`Missing metadata for ward code ${code}`)
    const label = labelByCode.get(code)
    if (!label) throw new Error(`Missing interior label point for ward code ${code}`)
    const [labelX, labelY] = project(label)

    return {
      code,
      name: metadata.en,
      nameJa: feature.properties.ward_ja,
      planning: metadata.planning,
      group: metadata.group,
      focus: Boolean(metadata.planning),
      labelX,
      labelY,
      paths: geometryPaths(feature.geometry, project),
    }
  })
  .sort((a, b) => a.code.localeCompare(b.code))

if (projectedRail.features.length !== railRoutes.length) {
  throw new Error(
    `Expected ${railRoutes.length} dissolved rail routes, received ${projectedRail.features.length}`,
  )
}

const projectedRouteById = new Map(
  projectedRail.features.map((feature) => [feature.properties.line_id, feature]),
)
const railRouteRecords = railRoutes.map((route) => {
  const feature = projectedRouteById.get(route.id)
  if (!feature) throw new Error(`Missing projected geometry for ${route.id}`)
  return {
    id: route.id,
    name: route.name,
    short: route.short,
    operator: route.operator,
    color: route.color,
    priority: route.priority,
    category: route.category ?? 'base',
    sourceNames: route.sourceNames,
    sourceFeatureCount: routeSourceCounts[route.id],
    paths: lineGeometryPaths(feature.geometry, project),
  }
})

const stationBuckets = new Map()
for (const feature of projectedStations.features) {
  const id = feature.properties.station_id
  if (!stationBuckets.has(id)) {
    stationBuckets.set(id, { coordinates: [], routes: new Set() })
  }
  const bucket = stationBuckets.get(id)
  visitCoordinates(feature.geometry.coordinates, (coordinate) => bucket.coordinates.push(coordinate))
  bucket.routes.add(feature.properties.line_id)
}

const routeOrder = new Map(railRoutes.map((route, index) => [route.id, index]))
const railStationRecords = railStations.map((station) => {
  const bucket = stationBuckets.get(station.id)
  if (!bucket || bucket.coordinates.length === 0) {
    throw new Error(`Missing projected station geometry for ${station.id}`)
  }
  const centroid = bucket.coordinates.reduce(
    ([sumX, sumY], [x, y]) => [sumX + x, sumY + y],
    [0, 0],
  )
  const [x, y] = project([
    centroid[0] / bucket.coordinates.length,
    centroid[1] / bucket.coordinates.length,
  ])
  return {
    ...station,
    x,
    y,
    routes: [...bucket.routes].sort((a, b) => routeOrder.get(a) - routeOrder.get(b)),
  }
})

const stayStationBuckets = new Map()
for (const feature of projectedStayStations.features) {
  const id = feature.properties.station_id
  if (!stayStationBuckets.has(id)) {
    stayStationBuckets.set(id, {
      coordinates: [],
      lines: new Set(),
      operators: new Set(),
    })
  }
  const bucket = stayStationBuckets.get(id)
  visitCoordinates(feature.geometry.coordinates, (coordinate) => bucket.coordinates.push(coordinate))
  bucket.lines.add(feature.properties.line_name)
  bucket.operators.add(feature.properties.operator_name)
}

const stayStationRecords = stayStations.map((station) => {
  const bucket = stayStationBuckets.get(station.id)
  if (!bucket || bucket.coordinates.length === 0) {
    throw new Error(`Missing projected stay-decision station geometry for ${station.id}`)
  }
  const centroid = bucket.coordinates.reduce(
    ([sumX, sumY], [x, y]) => [sumX + x, sumY + y],
    [0, 0],
  )
  const [x, y] = project([
    centroid[0] / bucket.coordinates.length,
    centroid[1] / bucket.coordinates.length,
  ])
  return {
    ...station,
    x,
    y,
    lines: [...bucket.lines].sort(),
    operators: [...bucket.operators].sort(),
  }
})

const stayHotelPointById = new Map(
  projectedStayHotels.features.map((feature) => [
    feature.properties.hotel_id,
    feature.geometry.coordinates,
  ]),
)
const stayHotelRecords = stayHotels.map((hotel) => {
  const point = stayHotelPointById.get(hotel.id)
  if (!point) throw new Error(`Missing projected hotel point for ${hotel.id}`)
  const [x, y] = project(point)
  return { ...hotel, x, y }
})

const routeClipValidation = validateRoutesWithinGeometry(
  projectedRail.features,
  wardUnionGeometries[0],
)
if (!routeClipValidation.valid) {
  throw new Error(
    `Rail clipping validation failed for ${routeClipValidation.outsideSamples.length} sampled points.`,
  )
}

const decisionWardCodes = new Set(stayHotels.map((hotel) => hotel.wardCode))
const decisionStationIds = new Set(stayHotels.flatMap((hotel) => hotel.stationIds))
const decisionExtentFeatures = [
  ...wards.features.filter((feature) => decisionWardCodes.has(feature.properties.ward_code)),
  ...projectedStayStations.features,
  ...projectedStations.features.filter((feature) =>
    decisionStationIds.has(feature.properties.station_id),
  ),
  ...projectedStayHotels.features,
]
const decisionBounds = fitBoundsToAspect(
  padBounds(geometryBounds(decisionExtentFeatures), 0.065, 2400),
  viewport.width / viewport.height,
)
const decisionTopLeft = project([decisionBounds[0], decisionBounds[3]])
const decisionBottomRight = project([decisionBounds[2], decisionBounds[1]])
const decisionView = clampViewBox(
  {
    x: decisionTopLeft[0],
    y: decisionTopLeft[1],
    width: decisionBottomRight[0] - decisionTopLeft[0],
    height: decisionBottomRight[1] - decisionTopLeft[1],
  },
  viewport,
)
const mapViews = {
  overview: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  decision: decisionView,
}

const baselineVisibility = {
  hotels: stayHotelRecords.filter((hotel) => pointInView([hotel.x, hotel.y], decisionView)).length,
  stayStations: stayStationRecords.filter((station) =>
    pointInView([station.x, station.y], decisionView),
  ).length,
}
if (
  baselineVisibility.hotels !== stayHotelRecords.length ||
  baselineVisibility.stayStations !== stayStationRecords.length
) {
  throw new Error(
    `Hotel-decision baseline excludes required markers: ${baselineVisibility.hotels}/${stayHotelRecords.length} hotels, ${baselineVisibility.stayStations}/${stayStationRecords.length} stay stations.`,
  )
}

writeFileSync(
  validationOutput,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      officialRegion: {
        source: 'MLIT N03 2025 administrative boundaries',
        wardCount: wards.features.length,
        dissolvedFeatureCount: wardUnionGeometries.length,
      },
      railClipping: {
        method:
          'Routes are simplified, then clipped to the dissolved projected union of Tokyo’s 23 special wards.',
        routeCount: projectedRail.features.length,
        checkedVertices: routeClipValidation.checkedVertices,
        checkedSegmentSamples: routeClipValidation.checkedSegmentSamples,
        outsideSamples: routeClipValidation.outsideSamples.length,
        valid: routeClipValidation.valid,
      },
      hotelDecisionBaseline: {
        method:
          'Bounds include all five hotels, all stay-decision stations, linked orientation stations, and the four hotel wards, then add controlled padding and fit the map aspect ratio.',
        viewBox: decisionView,
        visibleHotels: baselineVisibility.hotels,
        visibleStayStations: baselineVisibility.stayStations,
      },
      publicDefault100View: {
        method:
          'The approved public 100% view uses the complete generated viewport; closer inspection scales this same view without changing geography.',
        viewBox: mapViews.overview,
      },
    },
    null,
    2,
  )}\n`,
)

const generated = `// Generated by scripts/build-tokyo-wards.mjs. Do not hand-edit geography.
export const tokyoWardMapMeta = ${JSON.stringify(
  {
    source: 'MLIT National Land Numerical Information (Administrative Area Data, N03)',
    edition,
    projection: 'WGS 84 / UTM zone 54N (EPSG:32654)',
    clipBounds,
    simplification: 'Mapshaper weighted-area simplification: wards 12%, context 8%, keep-shapes',
    license: 'CC BY 4.0',
  },
  null,
  2,
)} as const

export const tokyoWardMapViewport = ${JSON.stringify(
  { width: viewport.width, height: viewport.height },
  null,
  2,
)} as const

export const tokyoWardMapViews = ${JSON.stringify(mapViews, null, 2)} as const

export const tokyoContextPaths = ${JSON.stringify(contextPaths, null, 2)} as const

export const tokyoWards = ${JSON.stringify(wardRecords, null, 2)} as const

export const tokyoRailMapMeta = ${JSON.stringify(
  {
    source: 'MLIT National Land Numerical Information (Railway Data, N02)',
    edition: railSource.edition,
    projection: 'WGS 84 / UTM zone 54N (EPSG:32654)',
    routeCount: railRoutes.length,
    baseRouteCount: railRoutes.filter((route) => !route.category).length,
    hotelAccessRouteCount: railRoutes.filter((route) => route.category === 'hotel-access').length,
    stationCount: railStations.length,
    simplification: 'Mapshaper weighted-area simplification: routes 35%',
    clip:
      'All rendered rail geometry is clipped to the dissolved official union of Tokyo’s 23 special wards after simplification.',
    license: 'MLIT N02 page: 2022 falls under "other years: commercial use permitted"',
    yamanote:
      'Operational loop composed from N02 Yamanote, Tokaido, and Tohoku legal-route sections.',
  },
  null,
  2,
)} as const

export const tokyoRailRoutes = ${JSON.stringify(railRouteRecords, null, 2)} as const

export const tokyoRailStations = ${JSON.stringify(railStationRecords, null, 2)} as const

export const tokyoStayStations = ${JSON.stringify(stayStationRecords, null, 2)} as const

export const tokyoStayHotels = ${JSON.stringify(stayHotelRecords, null, 2)} as const
`

const output = join(dataDir, 'tokyoWardMap.ts')
writeFileSync(output, generated)
console.log(`Generated ${relative(root, output)} with ${wardRecords.length} wards.`)
console.log(
  `Generated ${railRouteRecords.length} rail routes (${railRoutes.filter((route) => !route.category).length} base + ${railRoutes.filter((route) => route.category === 'hotel-access').length} hotel access) and ${railStationRecords.length} interchange markers.`,
)
console.log(
  `Generated ${stayHotelRecords.length} hotel pins and ${stayStationRecords.length} stay-decision station markers.`,
)
console.log(
  `Validated ${routeClipValidation.checkedVertices} rail vertices and ${routeClipValidation.checkedSegmentSamples} segment samples inside the 23-ward union.`,
)
console.log(
  `Generated hotel-decision baseline view ${decisionView.x},${decisionView.y},${decisionView.width},${decisionView.height}.`,
)
console.log(
  `Source topology: ${relative(root, wardsTopojson)}, ${relative(root, contextTopojson)}, ${relative(root, railTopojson)}`,
)

function routeForRailFeature(feature) {
  const { N02_003: sourceName, N02_004: operator } = feature.properties
  const directRoute = railRoutes.find(
    (route) =>
      route.id !== 'jr-yamanote' &&
      route.operatorJa === operator &&
      route.sourceNames.includes(sourceName),
  )
  if (directRoute) return directRoute

  const yamanote = railRoutes.find(({ id }) => id === 'jr-yamanote')
  if (operator !== yamanote.operatorJa) return null
  if (sourceName === '山手線') return yamanote

  const [longitude, latitude] = coordinateMean(feature.geometry.coordinates)
  if (
    sourceName === '東海道線' &&
    pointInBounds([longitude, latitude], [139.73, 35.62, 139.78, 35.69])
  ) {
    return yamanote
  }
  if (
    sourceName === '東北線' &&
    pointInBounds([longitude, latitude], [139.75, 35.675, 139.785, 35.75])
  ) {
    return yamanote
  }
  return null
}

function routeForStationFeature(feature) {
  const { N02_003: sourceName, N02_004: operator, N02_005: stationName } = feature.properties
  const directRoute = railRoutes.find(
    (route) =>
      route.id !== 'jr-yamanote' &&
      route.operatorJa === operator &&
      route.sourceNames.includes(sourceName),
  )
  if (directRoute) return directRoute

  const yamanoteStationNames = new Set(['新宿', '渋谷', '池袋', '上野', '秋葉原', '東京', '品川'])
  if (
    operator === '東日本旅客鉄道' &&
    ['山手線', '東海道線', '東北線'].includes(sourceName) &&
    yamanoteStationNames.has(stationName)
  ) {
    return railRoutes.find(({ id }) => id === 'jr-yamanote')
  }
  return null
}

function coordinateMean(coordinates) {
  const points = []
  visitCoordinates(coordinates, (coordinate) => points.push(coordinate))
  const [sumX, sumY] = points.reduce(
    ([currentX, currentY], [x, y]) => [currentX + x, currentY + y],
    [0, 0],
  )
  return [sumX / points.length, sumY / points.length]
}

function pointInBounds([x, y], [minX, minY, maxX, maxY]) {
  return x >= minX && x <= maxX && y >= minY && y <= maxY
}

function runMapshaper(args) {
  if (!process.env.npm_execpath) {
    throw new Error('Run this generator through "npm run maps:tokyo" so npm can launch Mapshaper.')
  }
  const result = spawnSync(
    process.execPath,
    [
      process.env.npm_execpath,
      'exec',
      '--yes',
      `--package=mapshaper@${mapshaperVersion}`,
      '--',
      'mapshaper',
      ...args,
    ],
    {
      cwd: root,
      encoding: 'utf8',
      stdio: 'inherit',
    },
  )
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Mapshaper failed with exit code ${result.status}`)
}

function extractZipEntry(buffer, matches) {
  const endSignature = 0x06054b50
  let endOffset = -1
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset -= 1) {
    if (buffer.readUInt32LE(offset) === endSignature) {
      endOffset = offset
      break
    }
  }
  if (endOffset < 0) throw new Error('ZIP end-of-central-directory record not found')

  const entryCount = buffer.readUInt16LE(endOffset + 10)
  let offset = buffer.readUInt32LE(endOffset + 16)

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid ZIP central directory')
    const compression = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localOffset = buffer.readUInt32LE(offset + 42)
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8')

    if (matches(name)) {
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('Invalid ZIP local header')
      const localNameLength = buffer.readUInt16LE(localOffset + 26)
      const localExtraLength = buffer.readUInt16LE(localOffset + 28)
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength
      const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize)
      if (compression === 0) return Buffer.from(compressed)
      if (compression === 8) return inflateRawSync(compressed)
      throw new Error(`Unsupported ZIP compression method ${compression}`)
    }

    offset += 46 + nameLength + extraLength + commentLength
  }

  throw new Error('Requested GeoJSON entry was not found in the MLIT archive')
}

function padBounds([minX, minY, maxX, maxY], ratio, minimumPadding) {
  const paddingX = Math.max((maxX - minX) * ratio, minimumPadding)
  const paddingY = Math.max((maxY - minY) * ratio, minimumPadding)
  return [minX - paddingX, minY - paddingY, maxX + paddingX, maxY + paddingY]
}

function fitBoundsToAspect([minX, minY, maxX, maxY], targetAspect) {
  const width = maxX - minX
  const height = maxY - minY
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  if (width / height > targetAspect) {
    const fittedHeight = width / targetAspect
    return [minX, centerY - fittedHeight / 2, maxX, centerY + fittedHeight / 2]
  }

  const fittedWidth = height * targetAspect
  return [centerX - fittedWidth / 2, minY, centerX + fittedWidth / 2, maxY]
}

function clampViewBox(view, viewport) {
  const width = Math.min(view.width, viewport.width)
  const height = Math.min(view.height, viewport.height)
  return {
    x: round(Math.max(0, Math.min(view.x, viewport.width - width))),
    y: round(Math.max(0, Math.min(view.y, viewport.height - height))),
    width: round(width),
    height: round(height),
  }
}

function pointInView([x, y], view) {
  return (
    x >= view.x &&
    x <= view.x + view.width &&
    y >= view.y &&
    y <= view.y + view.height
  )
}

function validateRoutesWithinGeometry(features, clipGeometry) {
  const outsideSamples = []
  let checkedVertices = 0
  let checkedSegmentSamples = 0

  for (const feature of features) {
    const lines =
      feature.geometry.type === 'LineString'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates

    for (const line of lines) {
      for (const coordinate of line) {
        checkedVertices += 1
        if (!pointInPolygonGeometry(coordinate, clipGeometry)) {
          outsideSamples.push({
            routeId: feature.properties.line_id,
            kind: 'vertex',
            coordinate,
          })
        }
      }

      for (let index = 1; index < line.length; index += 1) {
        const start = line[index - 1]
        const end = line[index]
        for (const progress of [0.25, 0.5, 0.75]) {
          const sample = [
            start[0] + (end[0] - start[0]) * progress,
            start[1] + (end[1] - start[1]) * progress,
          ]
          checkedSegmentSamples += 1
          if (!pointInPolygonGeometry(sample, clipGeometry)) {
            outsideSamples.push({
              routeId: feature.properties.line_id,
              kind: 'segment',
              coordinate: sample,
            })
          }
        }
      }
    }
  }

  return {
    valid: outsideSamples.length === 0,
    checkedVertices,
    checkedSegmentSamples,
    outsideSamples: outsideSamples.slice(0, 20),
  }
}

function pointInPolygonGeometry(point, geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  return polygons.some((polygon) => pointInPolygon(point, polygon))
}

function pointInPolygon(point, polygon) {
  if (!pointInRing(point, polygon[0])) return false
  for (const hole of polygon.slice(1)) {
    if (pointOnRingBoundary(point, hole)) return true
    if (pointInRing(point, hole)) return false
  }
  return true
}

function pointInRing([x, y], ring) {
  if (pointOnRingBoundary([x, y], ring)) return true

  let inside = false
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [currentX, currentY] = ring[current]
    const [previousX, previousY] = ring[previous]
    const intersects =
      currentY > y !== previousY > y &&
      x <
        ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX
    if (intersects) inside = !inside
  }
  return inside
}

function pointOnRingBoundary(point, ring, tolerance = 0.05) {
  for (let index = 1; index < ring.length; index += 1) {
    if (distanceToSegment(point, ring[index - 1], ring[index]) <= tolerance) return true
  }
  return false
}

function distanceToSegment([pointX, pointY], [startX, startY], [endX, endY]) {
  const deltaX = endX - startX
  const deltaY = endY - startY
  if (deltaX === 0 && deltaY === 0) {
    return Math.hypot(pointX - startX, pointY - startY)
  }

  const progress = Math.max(
    0,
    Math.min(
      1,
      ((pointX - startX) * deltaX + (pointY - startY) * deltaY) /
        (deltaX * deltaX + deltaY * deltaY),
    ),
  )
  return Math.hypot(
    pointX - (startX + progress * deltaX),
    pointY - (startY + progress * deltaY),
  )
}

function geometryBounds(features) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity]
  for (const feature of features) {
    visitCoordinates(feature.geometry.coordinates, ([x, y]) => {
      bounds[0] = Math.min(bounds[0], x)
      bounds[1] = Math.min(bounds[1], y)
      bounds[2] = Math.max(bounds[2], x)
      bounds[3] = Math.max(bounds[3], y)
    })
  }
  return bounds
}

function createViewportProjector([minX, minY, maxX, maxY], { width, height, padding }) {
  const scale = Math.min((width - padding * 2) / (maxX - minX), (height - padding * 2) / (maxY - minY))
  const drawnWidth = (maxX - minX) * scale
  const drawnHeight = (maxY - minY) * scale
  const offsetX = (width - drawnWidth) / 2
  const offsetY = (height - drawnHeight) / 2

  return ([x, y]) => [
    round(offsetX + (x - minX) * scale),
    round(height - offsetY - (y - minY) * scale),
  ]
}

function geometryPaths(geometry, project) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  return polygons.map((polygon) =>
    polygon
      .map((ring) => {
        const points = ring.map(project)
        return `M${points.map(([x, y]) => `${x} ${y}`).join('L')}Z`
      })
      .join(''),
  )
}

function lineGeometryPaths(geometry, project) {
  const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates
  return lines.map((line) => {
    const points = line.map(project)
    return `M${points.map(([x, y]) => `${x} ${y}`).join('L')}`
  })
}

function visitCoordinates(coordinates, visit) {
  if (typeof coordinates[0] === 'number') {
    visit(coordinates)
    return
  }
  for (const child of coordinates) visitCoordinates(child, visit)
}

function round(value) {
  return Math.round(value * 10) / 10
}
