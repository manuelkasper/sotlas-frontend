import axios from 'axios'

export default {
  mounted () {
    let mapServerOverride
    if (localStorage.getItem('mapServer')) {
      mapServerOverride = localStorage.getItem('mapServer')
    } else if (sessionStorage.getItem('mapServer')) {
      mapServerOverride = sessionStorage.getItem('mapServer')
    }

    if (mapServerOverride && mapServerOverride !== 'test') {
      this.mapServer = mapServerOverride
    } else {
      axios.get(process.env.VUE_APP_API_URL + '/map_server')
        .then(response => {
          if (response.data.mapServer) {
            this.mapServer = response.data.mapServer
            sessionStorage.setItem('mapServer', response.data.mapServer)
          }
        })
    }

    this.initialMapOptions = { ...this.mapOptions }
  },
  computed: {
    mapStyle () {
      if (this.mapServer === null) {
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

      // Patch map server
      Object.values(style.sources).forEach(source => {
        if (source.url) {
          source.url = source.url.replace('{mapServer}', this.mapServer)
        }
      })
      style.glyphs = style.glyphs.replace('{mapServer}', this.mapServer)

      // Patch units
      if (this.$store.state.altitudeUnits === 'ft' && this.mapType === 'openmaptiles') {
        style.layers.forEach(layer => {
          if (layer.id === 'contour_label') {
            layer.layout['text-field'] = ['to-string', ['round', ['*', ['get', 'height'], 3.28084]]]
          } else if (layer.id === 'summits_names') {
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
        mapType = 'openmaptiles'
      }
      return mapType
    },
    mapApiKey () {
      return process.env.VUE_APP_MAPTILER_KEY
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
      mapServer: null,
      mapServers: {
        'eu': 'Europe (Switzerland)',
        'us': 'US (California)'
      },
      mapTypes: {
        'openmaptiles': 'OpenMapTiles',
        'maptiler_outdoor': 'MapTiler Outdoor',
        'maptiler_winter': 'MapTiler Winter',
        'swisstopo': 'swisstopo (Vector)',
        'swisstopo_raster': 'swisstopo (Raster)',
        'swisstopo_aerial': 'swisstopo (Aerial)',
        'basemapat': 'basemap.at',
        'caltopo': 'CalTopo',
        'toposvalbard': 'TopoSvalbard',
        'norkart': 'Norkart'
      },
      initialMapOptions: null
    }
  }
}
