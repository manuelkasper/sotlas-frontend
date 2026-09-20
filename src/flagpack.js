import countryCodeList from 'flagpack-core/countryCodeList.json'

const coreFlags = import.meta.glob('../node_modules/flagpack-core/svg/m/*.svg', {
  eager: true,
  query: '?url&no-inline',
  import: 'default'
})

function urlsByCode (modules) {
  const map = {}
  for (const [path, url] of Object.entries(modules)) {
    const name = path.slice(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))
    map[name.toUpperCase()] = url
  }
  return map
}

const FLAGS = urlsByCode(coreFlags)

const NAMES = {}
for (const country of countryCodeList) {
  if (country.alpha2) {
    NAMES[country.alpha2] = country.countryName
  }
  if (country.alpha3) {
    NAMES[country.alpha3] = country.countryName
  }
}

NAMES.GB = NAMES['GB-UKM']

const CODE_ALIASES = {
  GB: 'GB-UKM'
}

export function resolveFlagCode (country) {
  if (!country) {
    return null
  }
  const code = String(country).toUpperCase()
  return CODE_ALIASES[code] || code
}

export function flagUrl (country) {
  const code = resolveFlagCode(country)
  return (code && FLAGS[code]) || null
}

export function flagLabel (country) {
  if (!country) {
    return undefined
  }
  return NAMES[String(country).toUpperCase()] || NAMES[resolveFlagCode(country)]
}
