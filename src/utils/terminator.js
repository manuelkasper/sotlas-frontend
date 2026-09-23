// Day/night terminator and twilight band calculation.
//
// Sun position algorithm (ecliptic -> equatorial coordinates, GMST) ported from
// Leaflet.Terminator (https://github.com/joergdietrich/Leaflet.Terminator, MIT license),
// which in turn implements the low-precision solar position formulas from the
// Astronomical Almanac. Extended here to support arbitrary depression angles so
// that civil/nautical/astronomical twilight bands can be computed, not just the
// geometric (0.833°) terminator.

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

// Depression angle of the sun below the horizon, in degrees, for each named band.
// 'night' matches the standard terminator (accounting for atmospheric refraction
// and the sun's apparent radius); the twilight bands follow the usual astronomical
// definitions.
export const DEPRESSION_ANGLES = {
  night: 0.833,
  civil: 6,
  nautical: 12,
  astronomical: 18
}

function toJulian (date) {
  return (date.getTime() / 86400000) + 2440587.5
}

function gmst (julianDay) {
  const d = julianDay - 2451545.0
  return (18.697374558 + 24.06570982441908 * d) % 24
}

function sunEclipticPosition (julianDay) {
  const n = julianDay - 2451545.0
  let meanLongitude = 280.460 + 0.9856474 * n
  meanLongitude %= 360
  let meanAnomaly = 357.528 + 0.9856003 * n
  meanAnomaly %= 360
  const lambda = meanLongitude + 1.915 * Math.sin(D2R * meanAnomaly) +
    0.02 * Math.sin(D2R * 2 * meanAnomaly)
  return { lambda }
}

function eclipticObliquity (julianDay) {
  const n = julianDay - 2451545.0
  const t = n / 36525
  return 23.43929111 -
    t * (46.836769 / 3600 -
      t * (0.0001831 / 3600 +
        t * (0.00200340 / 3600 -
          t * (0.576e-6 / 3600 - t * 4.34e-8 / 3600))))
}

function sunEquatorialPosition (sunEclLng, eclObliq) {
  let alpha = R2D * Math.atan(Math.cos(D2R * eclObliq) * Math.tan(D2R * sunEclLng))
  const delta = R2D * Math.asin(Math.sin(D2R * eclObliq) * Math.sin(D2R * sunEclLng))
  const lQuadrant = Math.floor(sunEclLng / 90) * 90
  const raQuadrant = Math.floor(alpha / 90) * 90
  alpha += (lQuadrant - raQuadrant)
  return { alpha, delta }
}

// Point at angular distance `distance` (degrees) from (lat, lng) along the
// initial bearing `bearing` (degrees clockwise from north), on a sphere.
function destination (lat, lng, distance, bearing) {
  const phi1 = D2R * lat
  const delta = D2R * distance
  const theta = D2R * bearing
  const sinPhi2 = Math.sin(phi1) * Math.cos(delta) +
    Math.cos(phi1) * Math.sin(delta) * Math.cos(theta)
  const phi2 = Math.asin(Math.max(-1, Math.min(1, sinPhi2)))
  const dLambda = Math.atan2(
    Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
    Math.cos(delta) - Math.sin(phi1) * sinPhi2)
  return [lng + R2D * dLambda, R2D * phi2]
}

/**
 * Computes the region of the earth where the sun is more than depressionAngle
 * degrees below the horizon, as a GeoJSON FeatureCollection with a single
 * Polygon feature in [lng, lat] order. `date` should be a native Date.
 *
 * The region is a spherical cap centered on the antisolar point with an
 * angular radius of 90° - depressionAngle. Its boundary is traced by bearing
 * around that center, with longitudes kept continuous (they may extend beyond
 * ±180°; MapLibre wraps such geometries onto the adjacent world copies).
 * If the cap contains a pole, the boundary goes once around the globe, and
 * the ring is closed along that pole instead.
 */
export function nightPolygon (date, depressionAngle, resolutionPerDegree = 2) {
  const julianDay = toJulian(date)
  const gst = gmst(julianDay)
  const sunEclPos = sunEclipticPosition(julianDay)
  const eclObliq = eclipticObliquity(julianDay)
  const sunEqPos = sunEquatorialPosition(sunEclPos.lambda, eclObliq)

  // The subsolar point is where the local hour angle of the sun is zero.
  const antisolarLat = -sunEqPos.delta
  const antisolarLng = sunEqPos.alpha - gst * 15 + 180
  const radius = 90 - depressionAngle

  // Start tracing on the side facing away from the nearer pole, so that the
  // seam of the ring never lies next to a pole (where longitudes are
  // ill-defined) even when the boundary passes close to it.
  const startBearing = antisolarLat >= 0 ? 180 : 0
  const coordinates = []
  const steps = 360 * resolutionPerDegree
  for (let i = 0; i <= steps; i++) {
    const point = destination(antisolarLat, antisolarLng, radius, startBearing + i / resolutionPerDegree)
    if (coordinates.length > 0) {
      // Keep longitudes continuous instead of letting them jump by 360°.
      const prevLng = coordinates[coordinates.length - 1][0]
      point[0] += 360 * Math.round((prevLng - point[0]) / 360)
    }
    coordinates.push(point)
  }

  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  if (Math.abs(last[0] - first[0]) > 180) {
    // The boundary went once around the globe, so the cap contains a pole:
    // close the ring along that pole.
    const pole = antisolarLat >= 0 ? 90 : -90
    coordinates.push([last[0], pole], [first[0], pole], [first[0], first[1]])
  } else {
    // Closed ring; replace the last point so it matches the first exactly.
    coordinates[coordinates.length - 1] = [first[0], first[1]]
  }

  // Shift the whole ring by a multiple of 360° so that it is centered near
  // the ±180° range. This keeps it within ±360°, the extent that MapLibre
  // (geojson-vt) wraps onto the adjacent world copies.
  const lngs = coordinates.map(c => c[0])
  const center = (Math.min(...lngs) + Math.max(...lngs)) / 2
  const shift = 360 * Math.round(center / 360)
  if (shift !== 0) {
    for (const c of coordinates) {
      c[0] -= shift
    }
  }

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    }]
  }
}
