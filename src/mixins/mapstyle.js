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
      axios.get('https://api.sotl.as/map_server')
        .then(response => {
          if (response.data.mapServer) {
            this.mapServer = response.data.mapServer
            sessionStorage.setItem('mapServer', response.data.mapServer)
          }
        })
    }
  },
  computed: {
    mapStyle () {
      if (this.mapServer === null) {
        return null
      }

      let style = require('../assets/style.json')

      // Patch map server
      Object.values(style.sources).forEach(source => {
        source.url = source.url.replace('{mapServer}', this.mapServer)
      })
      style.glyphs = style.glyphs.replace('{mapServer}', this.mapServer)

      // Patch units
      if (this.$store.state.altitudeUnits === 'ft') {
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
    }
  },
  data () {
    return {
      mapServer: null,
      mapServers: {
        'eu': 'Europe (Switzerland)',
        'us': 'US (California)'
      }
    }
  }
}
