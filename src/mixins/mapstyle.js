import api from './api.js'
import basemapatStyle from '../assets/basemapat.json'
import caltopoStyle from '../assets/caltopo.json'
import norkartStyle from '../assets/norkart.json'
import swisstopoStyle from '../assets/swisstopo.json'
import swisstopoAerialStyle from '../assets/swisstopo_aerial.json'
import swisstopoRasterStyle from '../assets/swisstopo_raster.json'
import toposvalbardStyle from '../assets/toposvalbard.json'
import partialSnowcoverDots from '../assets/partial-snowcover-dots.png'

export default {
  mixins: [api],
  mounted () {
    this.initialMapOptions = { ...this.mapOptions }
    this.updateMapTilerApiKey()
  },
  computed: {
    mapStyle () {
      if (!this.mapTilerApiKey) {
        return null
      }

      if (this.mapType === 'maptiler_outdoor') {
        if (this.$store.state.altitudeUnits === 'ft') {
          return 'dc9edd90-1320-4fa4-98ba-ad2d4efe5998'
        } else {
          return '3a0840d2-674e-4630-a70e-8fdb111259b9'
        }
      } else if (this.mapType === 'maptiler_winter') {
        if (this.$store.state.altitudeUnits === 'ft') {
          return 'f5400991-e3f4-4734-a941-6be8d26381e7'
        } else {
          return '5e862436-7ea7-4102-8b56-d35df3a11c07'
        }
      }

      let style = this.mapTypes[this.mapType].style

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

      // Patch MapTiler key
      Object.values(style.sources).forEach(source => {
        if (source.url) {
          source.url = source.url.replace('{key}', this.mapTilerApiKey)
        }
      })
      style.glyphs = style.glyphs.replace('{key}', this.mapTilerApiKey)

      // Patch units
      if (this.$store.state.altitudeUnits === 'ft') {
        style.layers.forEach(layer => {
          if (layer.id === 'summits_names') {
            layer.layout['text-field'] = ['concat', ['get', 'name'], '\n', ['get', 'code'], '\n', ['to-string', ['round', ['*', ['get', 'alt'], 3.28084]]], ' ft']
          } else if (layer.id === 'summits_inactive_names') {
            layer.layout['text-field'] = ['concat', ['get', 'name'], '\n', ['get', 'code'], '\n', ['to-string', ['round', ['*', ['get', 'alt'], 3.28084]]], ' ft\n(inactive)']
          }
        })
      }

      return style
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
    updateMapTilerApiKey () {
      if (this.$store.state.mapTilerApiKey) {
        return
      }

      // If we are logged in via SSO, then there's no need for Turnstile
      if ((this.$keycloak && this.$keycloak.authenticated) || this.$store.state.turnstileToken) {
        this.loadMapTilerApiKey(this.$store.state.turnstileToken)
          .then(response => {
            this.$store.commit('setMapTilerApiKey', response.mapTilerApiKey)
            if (this.$store.state.turnstileToken) {
              this.$store.commit('setTurnstileToken', null)
            }
          })
          .catch(error => {
            console.error(error)
            this.mapTilerApiKeyFailed = true
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
              map.addImage('partial-snowcover-pattern', snowcoverPattern, {
                pixelRatio: 2
              })
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
    }
  },
  watch: {
    '$store.state.turnstileToken': {
      handler () {
        this.updateMapTilerApiKey()
      }
    }
  },
  data () {
    return {
      mapTypes: {
        'maptiler_outdoor': {
          name: 'MapTiler Outdoor',
          difficulty: true,
          contours: true,
          hillshading: true
        },
        'maptiler_winter': {
          name: 'MapTiler Winter',
          contours: true,
          hillshading: true
        },
        'swisstopo': {
          name: 'swisstopo (Vector)',
          difficulty: true,
          contours: true,
          hillshading: true,
          skiing: true,
          snowshoe: true,
          slope_classes: true,
          wildlife: true,
          snow_depth: true,
          style: swisstopoStyle
        },
        'swisstopo_raster': {
          name: 'swisstopo (Raster)',
          difficulty: true,
          skiing: true,
          snowshoe: true,
          slope_classes: true,
          wildlife: true,
          style: swisstopoRasterStyle
        },
        'swisstopo_aerial': {
          name: 'swisstopo (Aerial)',
          difficulty: true,
          skiing: true,
          snowshoe: true,
          slope_classes: true,
          wildlife: true,
          style: swisstopoAerialStyle
        },
        'basemapat': {
          name: 'basemap.at',
          style: basemapatStyle
        },
        'caltopo': {
          name: 'CalTopo',
          style: caltopoStyle
        },
        'toposvalbard': {
          name: 'TopoSvalbard',
          style: toposvalbardStyle
        },
        'norkart': {
          name: 'Kartverket.no',
          slope_classes: true,
          style: norkartStyle
        }
      },
      initialMapOptions: null,
      mapTilerApiKey: null,
      mapTilerApiKeyFailed: false
    }
  }
}
