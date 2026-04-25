function parseCoordinates(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Coordinates input is required' }
  }

  const str = input.trim()
  if (!str) return { valid: false, error: 'Coordinates are empty' }

  let points = []

  if (str.includes('\n')) {
    // Newline-separated: each line is "lng,lat" or "lng lat"
    const lines = str.split('\n').map(l => l.trim()).filter(l => l)
    for (const line of lines) {
      const parts = line.split(/[,\s]+/).map(Number)
      if (parts.length < 2 || parts.some(isNaN)) {
        return { valid: false, error: `Invalid coordinate pair: "${line}"` }
      }
      points.push([parts[0], parts[1]])
    }
  } else if (str.includes('|')) {
    // Pipe-separated: "lng,lat|lng,lat|..." (used in CSV bulk import)
    const pairs = str.split('|').map(p => p.trim()).filter(p => p)
    for (const pair of pairs) {
      const parts = pair.split(/[,\s]+/).map(Number)
      if (parts.length < 2 || parts.some(isNaN)) {
        return { valid: false, error: `Invalid coordinate pair: "${pair}"` }
      }
      points.push([parts[0], parts[1]])
    }
  } else {
    // Flat comma list: lng,lat,lng,lat,...
    const nums = str.split(',').map(s => Number(s.trim()))
    if (nums.some(isNaN)) {
      return { valid: false, error: 'Invalid coordinate values — expected numbers separated by commas' }
    }
    if (nums.length % 2 !== 0) {
      return { valid: false, error: 'Odd number of values — need pairs of lng,lat' }
    }
    for (let i = 0; i < nums.length; i += 2) {
      points.push([nums[i], nums[i + 1]])
    }
  }

  if (points.length < 2) {
    return { valid: false, error: 'At least 2 coordinate pairs are required' }
  }

  // Auto-detect and fix lat/lng swap (common user mistake: entering lat,lng instead of lng,lat)
  points = autoFixSwap(points)

  for (const [lng, lat] of points) {
    if (lat < -90 || lat > 90) {
      return { valid: false, error: `Invalid latitude ${lat} — must be between -90 and 90` }
    }
    if (lng < -180 || lng > 180) {
      return { valid: false, error: `Invalid longitude ${lng} — must be between -180 and 180` }
    }
  }

  return { valid: true, points }
}

function autoFixSwap(points) {
  const firsts = points.map(p => p[0])
  const seconds = points.map(p => p[1])
  const firstsAllInLatRange = firsts.every(v => Math.abs(v) <= 90)
  const secondsHasOutOfLat = seconds.some(v => Math.abs(v) > 90)
  // If all first values fit as latitudes but some seconds don't, user likely gave [lat, lng]
  if (firstsAllInLatRange && secondsHasOutOfLat) {
    return points.map(([a, b]) => [b, a])
  }
  return points
}

function buildLineStringWKT(points) {
  const coords = points.map(([lng, lat]) => `${lng} ${lat}`).join(', ')
  return `LINESTRING(${coords})`
}

module.exports = { parseCoordinates, buildLineStringWKT }
