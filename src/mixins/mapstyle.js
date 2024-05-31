export default {
  mounted () {
    this.initialMapOptions = { ...this.mapOptions }
  },
  computed: {
    mapStyle () {
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

      let style = require('../assets/' + this.mapType + '.json')
      style = JSON.parse(JSON.stringify(style))

      // Show/hide layers according to map options for initial render to save time
      style.layers.forEach(layer => {
        if (layer.metadata && layer.metadata['sotlas-map-option']) {
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
          source.url = source.url.replace('{key}', process.env.VUE_APP_MAPTILER_KEY)
        }
      })
      style.glyphs = style.glyphs.replace('{key}', process.env.VUE_APP_MAPTILER_KEY)

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
    mapApiKey () {
      return process.env.VUE_APP_MAPTILER_KEY
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
          wildlife: true
        },
        'swisstopo_raster': {
          name: 'swisstopo (Raster)',
          difficulty: true,
          skiing: true,
          snowshoe: true,
          slope_classes: true,
          wildlife: true
        },
        'swisstopo_aerial': {
          name: 'swisstopo (Aerial)',
          difficulty: true,
          skiing: true,
          snowshoe: true,
          slope_classes: true,
          wildlife: true
        },
        'basemapat': {
          name: 'basemap.at'
        },
        'caltopo': {
          name: 'CalTopo'
        },
        'toposvalbard': {
          name: 'TopoSvalbard'
        },
        'norkart': {
          name: 'Norkart'
        }
      },
      initialMapOptions: null
    }
  }
}
