const KEY_DECOMPRESSION_MAP = {
  a: 'altitude',
  ac: 'activatorCallsign',
  ao: 'activationCount',
  c: 'comments',
  d: 'code',
  e: 'speed',
  f: 'frequency',
  hc: 'homeCallsign',
  i: 'isActivator',
  ic: 'isoCode',
  l: 'callsign',
  m: 'mode',
  n: 'name',
  o: 'continent',
  p: 'points',
  s: 'summit',
  t: 'spotter',
  ts: 'timeStamp',
  ui: 'userID',
  y: 'type'
}

let KEY_COMPRESSION_MAP = null

function compressKeys (obj) {
  // Lazy init
  if (KEY_COMPRESSION_MAP === null) {
    KEY_COMPRESSION_MAP = {}
    Object.keys(KEY_DECOMPRESSION_MAP).forEach(key => {
      KEY_COMPRESSION_MAP[KEY_DECOMPRESSION_MAP[key]] = key
    })
  }

  return mapKeys(obj, KEY_COMPRESSION_MAP)
}

function decompressKeys (obj) {
  return mapKeys(obj, KEY_DECOMPRESSION_MAP)
}

function mapKeys (obj, map) {
  if (obj === null) {
    return null
  } else if (Array.isArray(obj)) {
    return obj.map(el => {
      return mapKeys(el, map)
    })
  } else if (typeof obj === 'object' && !(obj instanceof Date)) {
    let ret = {}
    Object.keys(obj).forEach(key => {
      let val = mapKeys(obj[key], map)

      if (map[key]) {
        ret[map[key]] = val
      } else {
        ret[key] = val
      }
    })
    return ret
  } else {
    return obj
  }
}

export { compressKeys, decompressKeys }
