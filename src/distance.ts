const kilometersPerMile = 1.609344

export function kilometersToMiles(kilometers: number) {
  return kilometers / kilometersPerMile
}

export function formatDistanceMiles(kilometers: number) {
  const miles = kilometersToMiles(kilometers)
  if (miles === 0) return '0 mi'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}
