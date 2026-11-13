import axios from 'axios'

// Sentinel-2 L2A true-color imagery from the Microsoft Planetary Computer,
// which serves Copernicus Sentinel-2 data. Scene search is a STAC query at a
// point (cloud cover is reported per scene). Tiles come from a registered
// mosaic of that UTC day, with the clearest scenes drawn first.
const STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search'
const MOSAIC_REGISTER = 'https://planetarycomputer.microsoft.com/api/data/v1/mosaic/register'
const COLLECTION = 'sentinel-2-l2a'
const LOOKBACK_DAYS = 366
const MAX_PAGES = 3

// Dates at or above this scene cloud cover are not offered.
// Compared after rounding, so a scene shown as "95% cloud" is excluded.
export const MAX_CLOUD_COVER = 95

// The mosaic does not render below this view zoom.
export const MIN_ZOOM = 7.5

export function isTooCloudy (cloud) {
  return Math.round(cloud) >= MAX_CLOUD_COVER
}

// Mosaic ids are reused for the session. A failed registration is not cached.
const mosaicCache = new Map()

function isAbort (error) {
  return error && (error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.name === 'AbortError')
}

function stamp (date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function dayRange (date) {
  const start = new Date(`${date}T00:00:00Z`)
  const end = new Date(start.getTime())
  end.setUTCDate(end.getUTCDate() + 1)
  return `${stamp(start)}/${stamp(end)}`
}

export function formatCloud (cloud) {
  const rounded = Math.round(cloud)
  if (rounded === 0 && cloud > 0) {
    return '<1% cloud'
  }
  return `${rounded}% cloud`
}

// Newest first. When several scenes cover the point on the same day, keep
// the clearest one — that is also the one the mosaic draws on top.
export function scenesFromFeatures (features) {
  const byDate = new Map()
  for (const feature of features) {
    const props = feature.properties || {}
    const datetime = props.datetime
    const cloud = Number(props['eo:cloud_cover'])
    if (!datetime || !Number.isFinite(cloud)) {
      continue
    }
    const date = datetime.slice(0, 10)
    const prev = byDate.get(date)
    if (!prev || cloud < prev.cloud) {
      byDate.set(date, { date, cloud })
    }
  }
  return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date))
}

// Prefer the newest scene that is mostly clear, otherwise the clearest day.
export function preferredScene (scenes) {
  if (!scenes.length) {
    return null
  }
  const clear = scenes.find(scene => scene.cloud <= 20)
  if (clear) {
    return clear
  }
  return scenes.reduce((best, scene) => scene.cloud < best.cloud ? scene : best)
}

export async function scenesAt (longitude, latitude, signal) {
  const end = new Date()
  const start = new Date(end.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
  let url = STAC_SEARCH
  let body = {
    collections: [COLLECTION],
    intersects: { type: 'Point', coordinates: [longitude, latitude] },
    datetime: `${stamp(start)}/${stamp(end)}`,
    limit: 100,
    sortby: [{ field: 'properties.datetime', direction: 'desc' }],
    fields: {
      include: ['properties.datetime', 'properties.eo:cloud_cover'],
      exclude: ['assets', 'geometry', 'bbox', 'links', 'id']
    }
  }
  const features = []
  for (let page = 0; page < MAX_PAGES && url; page++) {
    const response = await axios.post(url, body, { signal })
    features.push(...(response.data.features || []))
    const next = (response.data.links || []).find(link => link.rel === 'next' && link.body)
    if (!next) {
      break
    }
    url = next.href
    body = next.body
  }
  return scenesFromFeatures(features)
}

export function tilesForDate (date) {
  const cached = mosaicCache.get(date)
  if (cached) {
    return cached
  }
  const pending = axios.post(MOSAIC_REGISTER, {
    collections: [COLLECTION],
    datetime: dayRange(date),
    sortby: [{ field: 'properties.eo:cloud_cover', direction: 'asc' }]
  }).then(response => {
    const id = response.data.searchid || response.data.id
    // The collection parameter is required on tile requests even though the
    // TileJSON template omits it.
    return `https://planetarycomputer.microsoft.com/api/data/v1/mosaic/${id}/tiles/WebMercatorQuad/{z}/{x}/{y}?collection=${COLLECTION}&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png`
  }).catch(error => {
    mosaicCache.delete(date)
    throw error
  })
  mosaicCache.set(date, pending)
  return pending
}

export { isAbort }
