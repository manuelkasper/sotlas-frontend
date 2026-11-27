import axios from 'axios'
import api from './api.js'
import partialSnowcoverDots from '../assets/partial-snowcover-dots.png'

// One lookup per page load, shared by every component that uses this mixin.
let detectedCountry = null
let detectedCountryPromise = null

function detectCountry () {
  if (!detectedCountryPromise) {
    detectedCountryPromise = axios.get(import.meta.env.VITE_API_URL + '/my_country', { ignoreError: true })
      .then(response => {
        const country = response.data && response.data.country
        detectedCountry = country ? String(country).trim().toUpperCase() : null
        return detectedCountry
      })
      .catch(() => null)
  }
  return detectedCountryPromise
}

// Dynamic imports so Vite emits one chunk per style. The map views fetch
// only the style that is actually selected.
const localStyleLoaders = {
  basemapat: () => import('../assets/basemapat.json'),
  caltopo: () => import('../assets/caltopo.json'),
  norkart: () => import('../assets/norkart.json'),
  os_outdoor: () => import('../assets/os_outdoor.json'),
  os_road: () => import('../assets/os_road.json'),
  swisstopo: () => import('../assets/swisstopo.json'),
  swisstopo_aerial: () => import('../assets/swisstopo_aerial.json'),
  swisstopo_raster: () => import('../assets/swisstopo_raster.json'),
  toposvalbard: () => import('../assets/toposvalbard.json'),
  ign_fr: () => import('../assets/ign_fr.json'),
  ign_scan25: () => import('../assets/ign_scan25.json'),
  ign_es: () => import('../assets/ign_es.json'),
  ign_be: () => import('../assets/ign_be.json'),
  mml: () => import('../assets/mml.json'),
  linz: () => import('../assets/linz.json'),
  linz_topo50: () => import('../assets/linz_topo50.json')
}

const localStyleCache = {}
const localStylePromises = {}

function loadLocalStyle (type) {
  if (!localStyleLoaders[type]) {
    return Promise.resolve(null)
  }
  if (!localStylePromises[type]) {
    localStylePromises[type] = localStyleLoaders[type]().then(module => {
      localStyleCache[type] = module.default
      return module.default
    }).catch(error => {
      localStylePromises[type] = null
      throw error
    })
  }
  return localStylePromises[type]
}

export default {
  mixins: [api],
  created () {
    if (this.userCountry) return
    detectCountry().then(country => {
      if (!this._mapStyleUnmounted) this.userCountry = country
    })
  },
  mounted () {
    this.initialMapOptions = { ...this.mapOptions }
    this.updateMapTilerApiKey()
  },
  beforeUnmount () {
    this._mapStyleUnmounted = true
  },
  computed: {
    mapLanguage () {
      // Primary language subtag, e.g. 'ja' from 'ja-JP', 'en' from 'en-US'
      return navigator.language.split('-')[0]
    },
    // Styles declare their group. World stays first, then the visitor's country
    // when it has its own styles, then the remaining groups by name.
    mapTypeGroups () {
      const buckets = new Map()
      for (const [type, attrs] of Object.entries(this.mapTypes)) {
        const label = attrs.group || 'World'
        if (!buckets.has(label)) buckets.set(label, [])
        buckets.get(label).push({ type, attrs })
      }
      const localCode = this.userCountry
      const isLocal = label => buckets.get(label)[0].attrs.groupCode === localCode
      return [...buckets.keys()].sort((a, b) => {
        if (a === 'World') return -1
        if (b === 'World') return 1
        const aLocal = isLocal(a)
        const bLocal = isLocal(b)
        if (aLocal !== bLocal) return aLocal ? -1 : 1
        return a.localeCompare(b)
      }).map(label => {
        const types = buckets.get(label)
        return { label, code: types[0].attrs.groupCode || null, types }
      })
    },
    mapStyle () {
      if (!this.mapTilerApiKey) {
        return null
      }

      // Cloud styles: return full style URL so MapLibre GL fetches them internally.
      // The key is not included here; both the current SDK and the future
      // transformRequest attach it automatically. Language is applied
      // post-load via applyLanguageToMap() in updateLayers().
      if (this.mapType === 'maptiler_outdoor') {
        if (this.$store.state.altitudeUnits === 'ft') {
          return 'https://api.maptiler.com/maps/dc9edd90-1320-4fa4-98ba-ad2d4efe5998/style.json'
        } else {
          return 'https://api.maptiler.com/maps/3a0840d2-674e-4630-a70e-8fdb111259b9/style.json'
        }
      } else if (this.mapType === 'maptiler_winter') {
        if (this.$store.state.altitudeUnits === 'ft') {
          return 'https://api.maptiler.com/maps/f5400991-e3f4-4734-a941-6be8d26381e7/style.json'
        } else {
          return 'https://api.maptiler.com/maps/5e862436-7ea7-4102-8b56-d35df3a11c07/style.json'
        }
      }

      // Local styles: fetched as their own chunk, then cloned and patched.
      if (this.localMapStyleType !== this.mapType || !this.localMapStyle) {
        return null
      }
      let style = JSON.parse(JSON.stringify(this.localMapStyle))

      // Show/hide layers according to map options for initial render to save time
      style.layers.forEach(layer => {
        if (layer.metadata && layer.metadata['sotlas-map-option'] && this.initialMapOptions) {
          if (this.initialMapOptions[layer.metadata['sotlas-map-option']]) {
            layer.layout.visibility = 'visible'
          } else {
            layer.layout.visibility = 'none'
          }
        }
      })

      const apiKeys = this.mapTypes[this.mapType].apiKeys || {}
      const applyPlaceholders = (value) => {
        if (typeof value !== 'string') return value
        return Object.entries(apiKeys).reduce((text, [token, key]) => {
          const resolved = typeof key === 'function' ? key() : key
          return text.replaceAll(token, () => resolved ?? '')
        }, value)
      }
      Object.values(style.sources).forEach(source => {
        if (source.url) {
          source.url = applyPlaceholders(source.url)
        }
        if (source.tiles) {
          source.tiles = source.tiles.map(applyPlaceholders)
        }
      })
      style.glyphs = applyPlaceholders(style.glyphs)
      if (style.sprite) {
        style.sprite = applyPlaceholders(style.sprite)
      }

      // Patch units for SOTLAS summit labels
      if (this.$store.state.altitudeUnits === 'ft') {
        style.layers.forEach(layer => {
          if (layer.id === 'summits_names') {
            layer.layout['text-field'] = ['concat', ['get', 'name'], '\n', ['get', 'code'], '\n', ['to-string', ['round', ['*', ['get', 'alt'], 3.28084]]], ' ft']
          } else if (layer.id === 'summits_inactive_names') {
            layer.layout['text-field'] = ['concat', ['get', 'name'], '\n', ['get', 'code'], '\n', ['to-string', ['round', ['*', ['get', 'alt'], 3.28084]]], ' ft\n(inactive)']
          }
        })
      }

      return this.applyLanguageToStyle(style)
    },
    mapType () {
      let mapType = this.$store.state.mapType
      if (!this.mapTypes[mapType]) {
        mapType = 'maptiler_outdoor'
      }
      return mapType
    },
    mapTilerApiKey () {
      return this.$store.state.mapTilerApiKey
    },
    mapUnits () {
      if (this.$store.state.altitudeUnits === 'ft') {
        return 'imperial'
      } else {
        return 'metric'
      }
    }
  },
  methods: {
    requestLocalStyle (type) {
      loadLocalStyle(type).then(style => {
        if (this._mapStyleUnmounted || !style || this.mapType !== type) {
          return
        }
        this.localMapStyle = style
        this.localMapStyleType = type
      }).catch(error => {
        console.error(error)
      })
    },
    updateMapTilerApiKey () {
      if (this.$store.state.mapTilerApiKey || this.$store.state.mapTilerApiKeyLoading) {
        return
      }

      // If we are logged in via SSO, then there's no need for Turnstile
      if ((this.$keycloak && this.$keycloak.authenticated) || this.$store.state.turnstileToken) {
        this.$store.commit('setMapTilerApiKeyLoading', true)
        this.loadMapTilerApiKey(this.$store.state.turnstileToken)
          .then(response => {
            this.$store.commit('setMapTilerApiKey', response.mapTilerApiKey)
            if (this.$store.state.turnstileToken) {
              this.$store.commit('setTurnstileToken', null)
            }
            this.$store.commit('setMapTilerApiKeyLoading', false)
          })
          .catch(error => {
            console.error(error)
            this.mapTilerApiKeyFailed = true
            this.$store.commit('setMapTilerApiKeyLoading', false)
          })
      }
    },
    updateLayers (map) {
      if (!map) {
        return
      }

      // Show/hide layers according to map options
      map.getStyle().layers.forEach(layer => {
        if (layer.metadata && layer.metadata['sotlas-map-option']) {
          if (this.mapOptions[layer.metadata['sotlas-map-option']]) {
            map.setLayoutProperty(layer.id, 'visibility', 'visible')
          } else {
            map.setLayoutProperty(layer.id, 'visibility', 'none')
          }
        }
      })

      // For cloud styles, apply language patches via setLayoutProperty
      // (local styles are pre-patched in the mapStyle computed)
      const isCloudStyle = (this.mapType === 'maptiler_outdoor' || this.mapType === 'maptiler_winter')
      if (isCloudStyle) {
        this.applyLanguageToMap(map)
      }

      if (this.mapTypes[this.mapType].snow_depth) {
        if (this.mapOptions['snow_depth']) {
          if (!map.getSource('snowcover')) {
            map.addSource('snowcover', {
              type: 'geojson',
              data: 'https://snow-maps-hs.slf.ch/public/hs/map/HS1D-v2/current/geojson'
            })
            let snowcoverPattern = new Image()
            snowcoverPattern.src = partialSnowcoverDots
            snowcoverPattern.onload = () => {
              // The style may have changed while the pattern image was loading.
              if (!map.getSource('snowcover') || !map.getLayer('scree_z17') || map.getLayer('snowcover')) return
              if (!map.hasImage('partial-snowcover-pattern')) {
                map.addImage('partial-snowcover-pattern', snowcoverPattern, { pixelRatio: 2 })
              }
              map.addLayer({
                id: 'snowcover-partial-background',
                type: 'fill',
                source: 'snowcover',
                filter: ['all', ['get', 'partialSnowCover'], ['==', ['get', 'value'], 1]],
                layout: {
                  'fill-sort-key': ['get', 'zIndex']
                },
                paint: {
                  'fill-color': ['get', 'fill'],
                  'fill-opacity': 1.0
                }
              }, 'scree_z17')
              map.addLayer({
                id: 'snowcover-partial',
                type: 'fill',
                source: 'snowcover',
                filter: ['all', ['get', 'partialSnowCover'], ['==', ['get', 'value'], 1]],
                layout: {
                  'fill-sort-key': ['get', 'zIndex']
                },
                paint: {
                  'fill-pattern': 'partial-snowcover-pattern',
                  'fill-opacity': 0.2
                }
              }, 'scree_z17')
              map.addLayer({
                id: 'snowcover',
                type: 'fill',
                source: 'snowcover',
                filter: ['any', ['!', ['get', 'partialSnowCover']], ['>', ['get', 'value'], 1]],
                layout: {
                  'fill-sort-key': ['get', 'zIndex']
                },
                paint: {
                  'fill-color': ['get', 'fill'],
                  'fill-opacity': 1.0
                }
              }, 'scree_z17')
            }
          } else {
            map.setLayoutProperty('snowcover-partial-background', 'visibility', 'visible')
            map.setLayoutProperty('snowcover-partial', 'visibility', 'visible')
            map.setLayoutProperty('snowcover', 'visibility', 'visible')
          }
          map.setLayoutProperty('water_polygon', 'visibility', 'none')
        } else {
          if (map.getLayer('snowcover')) {
            map.setLayoutProperty('snowcover-partial-background', 'visibility', 'none')
            map.setLayoutProperty('snowcover-partial', 'visibility', 'none')
            map.setLayoutProperty('snowcover', 'visibility', 'none')
          }
          if (map.getLayer('water_polygon')) {
            map.setLayoutProperty('water_polygon', 'visibility', 'visible')
          }
        }
      }
    },
    patchStringTextField (textField, lang) {
      // Bare 'name' or Mapbox-style placeholders '{name}', '{name:en}',
      // '{name:latin}', '{name:nonlatin}', etc. → coalesce(name:XX, name).
      // Without this branch, MapTiler layers that use '{name:en}' (Country/
      // City/Continent/Ocean labels) leak English through.
      if (textField === 'name' || /^\{name(:[\w-]+)?\}$/.test(textField)) {
        return ['coalesce', ['get', `name:${lang}`], ['get', 'name']]
      }
      return undefined
    },
    applyLanguageToMap (map) {
      const lang = this.mapLanguage
      map.getStyle().layers.forEach(layer => {
        if (!layer.layout || layer.layout['text-field'] === undefined) return
        if (layer.id && layer.id.startsWith('summit')) return
        if (layer.metadata && layer.metadata['sotlas-map-option']) return

        const textField = layer.layout['text-field']
        let patched
        if (typeof textField === 'string') {
          patched = this.patchStringTextField(textField, lang)
        } else if (Array.isArray(textField)) {
          patched = this.patchLanguageExpression(textField, lang)
        }

        if (patched !== undefined && patched !== textField) {
          map.setLayoutProperty(layer.id, 'text-field', patched)
        }
      })
    },
    applyLanguageToStyle (style) {
      const lang = this.mapLanguage
      style.layers.forEach(layer => {
        if (!layer.layout || layer.layout['text-field'] === undefined) return
        if (layer.id && layer.id.startsWith('summit')) return
        if (layer.metadata && layer.metadata['sotlas-map-option']) return

        const textField = layer.layout['text-field']
        if (typeof textField === 'string') {
          const patched = this.patchStringTextField(textField, lang)
          if (patched !== undefined) {
            layer.layout['text-field'] = patched
          }
        } else if (Array.isArray(textField)) {
          layer.layout['text-field'] = this.patchLanguageExpression(textField, lang)
        }
      })
      return style
    },
    patchLanguageExpression (expr, lang) {
      if (!Array.isArray(expr)) return expr

      // ["get", "name"] or ["get", "name:latin"] or ["get", "name:nonlatin"]
      // → ["coalesce", ["get", "name:XX"], ["get", "name"]]
      if (expr[0] === 'get' && expr.length === 2) {
        const field = expr[1]
        if (field === 'name' || field === 'name:latin' || field === 'name:nonlatin') {
          return ['coalesce', ['get', `name:${lang}`], ['get', 'name']]
        }
        return expr
      }

      const isNameGet = (e) => Array.isArray(e) && e.length === 2 && e[0] === 'get' &&
        typeof e[1] === 'string' &&
        (e[1] === 'name' || e[1] === 'name_int' || e[1].startsWith('name:'))

      // ["concat", ...]: collapse when it joins >=2 name references with no
      // structural non-name fields. Prevents the same name being rendered
      // twice (e.g. latin + nonlatin → "東京\n東京").
      if (expr[0] === 'concat') {
        let nameRefs = 0
        let otherNonStrings = 0
        for (let i = 1; i < expr.length; i++) {
          const arg = expr[i]
          if (isNameGet(arg)) {
            nameRefs++
          } else if (Array.isArray(arg)) {
            otherNonStrings++
          }
        }
        if (nameRefs >= 2 && otherNonStrings === 0) {
          return ['coalesce', ['get', `name:${lang}`], ['get', 'name']]
        }
      }

      // ["coalesce", ...]: if any arg references a name field (anywhere in
      // the list, not just first), replace the whole expression so the
      // user's language wins over name_int / name:latin / etc.
      if (expr[0] === 'coalesce') {
        for (let i = 1; i < expr.length; i++) {
          if (isNameGet(expr[i])) {
            return ['coalesce', ['get', `name:${lang}`], ['get', 'name']]
          }
        }
      }

      // Recurse into nested expressions
      return expr.map(item => Array.isArray(item) ? this.patchLanguageExpression(item, lang) : item)
    }
  },
  watch: {
    // Keep the last ready style so a local style that is still loading does
    // not drop mapStyle to null and unmount the map.
    mapStyle: {
      immediate: true,
      handler (style) {
        if (style) this.activeMapStyle = style
      }
    },
    '$store.state.turnstileToken': {
      handler () {
        this.updateMapTilerApiKey()
      }
    },
    mapType: {
      immediate: true,
      handler (type) {
        if (!this.loadMapStyle || !localStyleLoaders[type]) {
          return
        }
        this.requestLocalStyle(type)
      }
    }
  },
  data () {
    // Placeholder tokens in local style JSON, resolved when the style is applied.
    // MapTiler is read at apply time because it arrives after Turnstile or SSO.
    const mapTilerKeys = {
      '{maptilerkey}': () => this.mapTilerApiKey
    }
    const osKeys = {
      ...mapTilerKeys,
      '{oskey}': import.meta.env.VITE_OS_API_KEY || ''
    }
    const mmlKeys = {
      ...mapTilerKeys,
      '{nlskey}': import.meta.env.VITE_MML_API_KEY || ''
    }
    const linzKeys = {
      ...mapTilerKeys,
      '{linzkey}': import.meta.env.VITE_LINZ_API_KEY || ''
    }
    return {
      mapTypes: {
        // World
        'maptiler_outdoor': {
          name: 'MapTiler Outdoor',
          group: 'World',
          difficulty: true,
          contours: true,
          hillshading: true
        },
        'maptiler_winter': {
          name: 'MapTiler Winter',
          group: 'World',
          contours: true,
          hillshading: true
        },
        // Austria
        'basemapat': {
          name: 'basemap.at',
          group: 'Austria',
          groupCode: 'AT',
          apiKeys: mapTilerKeys
        },
        // Belgium
        'ign_be': {
          name: 'IGN Topo',
          group: 'Belgium',
          groupCode: 'BE',
          apiKeys: mapTilerKeys
        },
        // Finland
        'mml': {
          name: 'MML Topo',
          group: 'Finland',
          groupCode: 'FI',
          apiKeys: mmlKeys
        },
        // France
        'ign_fr': {
          name: 'IGN Topo',
          group: 'France',
          groupCode: 'FR',
          contours: true,
          slope_classes: true,
          skiing: true,
          apiKeys: mapTilerKeys
        },
        'ign_scan25': {
          name: 'IGN Scan 25',
          group: 'France',
          groupCode: 'FR',
          slope_classes: true,
          apiKeys: mapTilerKeys
        },
        // New Zealand
        'linz': {
          name: 'LINZ Topo',
          group: 'New Zealand',
          groupCode: 'NZ',
          contours: true,
          hillshading: true,
          apiKeys: linzKeys
        },
        'linz_topo50': {
          name: 'LINZ Topo50',
          group: 'New Zealand',
          groupCode: 'NZ',
          apiKeys: linzKeys
        },
        // Norway
        'norkart': {
          name: 'Kartverket.no',
          group: 'Norway',
          groupCode: 'NO',
          slope_classes: true,
          apiKeys: mapTilerKeys
        },
        'toposvalbard': {
          name: 'TopoSvalbard',
          group: 'Norway',
          groupCode: 'NO',
          apiKeys: mapTilerKeys
        },
        // Spain
        'ign_es': {
          name: 'IGN Spain',
          group: 'Spain',
          groupCode: 'ES',
          apiKeys: mapTilerKeys
        },
        // Switzerland
        'swisstopo': {
          name: 'swisstopo (Vector)',
          group: 'Switzerland',
          groupCode: 'CH',
          difficulty: true,
          contours: true,
          hillshading: true,
          skiing: true,
          snowshoe: true,
          slope_classes: true,
          wildlife: true,
          snow_depth: true,
          apiKeys: mapTilerKeys
        },
        'swisstopo_raster': {
          name: 'swisstopo (Raster)',
          group: 'Switzerland',
          groupCode: 'CH',
          difficulty: true,
          skiing: true,
          snowshoe: true,
          slope_classes: true,
          wildlife: true,
          apiKeys: mapTilerKeys
        },
        'swisstopo_aerial': {
          name: 'swisstopo (Aerial)',
          group: 'Switzerland',
          groupCode: 'CH',
          difficulty: true,
          skiing: true,
          snowshoe: true,
          slope_classes: true,
          wildlife: true,
          apiKeys: mapTilerKeys
        },
        // United Kingdom
        'os_outdoor': {
          name: 'OS Outdoor',
          group: 'United Kingdom',
          groupCode: 'GB',
          contours: true,
          apiKeys: osKeys
        },
        'os_road': {
          name: 'OS Road',
          group: 'United Kingdom',
          groupCode: 'GB',
          contours: true,
          apiKeys: osKeys
        },
        // United States
        'caltopo': {
          name: 'CalTopo',
          group: 'United States',
          groupCode: 'US',
          apiKeys: mapTilerKeys
        }
      },
      initialMapOptions: null,
      activeMapStyle: null,
      mapTilerApiKeyFailed: false,
      // Map and MiniMap set this so the other mixin users (the app shell,
      // settings, the layer menu) do not download a style.
      loadMapStyle: false,
      localMapStyle: null,
      localMapStyleType: null,
      userCountry: detectedCountry
    }
  }
}
