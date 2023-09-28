<template>
  <div>
    <MapWebcam v-for="webcam in webcams" :key="webcam.id" :webcam="webcam" :size="size" />
  </div>
</template>

<script>
import MapWebcam from '../components/MapWebcam.vue'
import axios from 'axios'

export default {
  name: 'MapWebcams',
  components: { MapWebcam },
  inject: ['map'],
  props: {
    size: {
      type: String,
      default: 'is-normal'
    }
  },
  methods: {
    setupMap () {
      if (!this.map || this.setup) {
        return
      }

      this.map.on('idle', e => {
        this.loadWebcams()
      })
      this.loadWebcams()
      this.setup = true
    },
    loadWebcams () {
      // Convert MapBox zoom level to Google Maps like zoom level
      let mapZoom = Math.floor(Math.min(this.map.getZoom() + 1, 18))

      // Windy v3 API has a limit on the latitude/longitude span relative to the zoom level.
      // Ensure that we are within the limit, lower the zoom level if necessary, otherwise
      // we will get a 400 response.
      let latSpan = Math.abs(this.map.getBounds().getNorthEast().lat - this.map.getBounds().getSouthWest().lat)
      let lngSpan = Math.abs(this.map.getBounds().getNorthEast().lng - this.map.getBounds().getSouthWest().lng)
      while (mapZoom > 4) {
        let maxAllowedLatSpan = 22.5 / Math.pow(2, mapZoom - 4)
        let maxAllowedLngSpan = 45 / Math.pow(2, mapZoom - 4)
        if (latSpan < maxAllowedLatSpan && lngSpan < maxAllowedLngSpan) {
          break
        }
        mapZoom--
      }

      if (mapZoom <= 4) {
        // We have reached the limit of what we can request via the API - so don't request anything
        this.webcams = []
        return
      }

      axios.get('https://api.windy.com/webcams/api/v3/map/clusters', {
        headers: { 'X-WINDY-API-KEY': this.windyApiKey },
        params: {
          northLat: this.map.getBounds().getNorthEast().lat,
          eastLon: this.map.getBounds().getNorthEast().lng,
          southLat: this.map.getBounds().getSouthWest().lat,
          westLon: this.map.getBounds().getSouthWest().lng,
          zoom: mapZoom,
          include: 'location,images,urls'
        }
      })
        .then(response => {
          this.webcams = response.data.filter(webcam => { return webcam.status === 'active' })
        })
    }
  },
  watch: {
    map: {
      handler () {
        this.setupMap()
      },
      immediate: true
    }
  },
  data () {
    return {
      windyApiKey: 'FIHFGWMrA0iF5Wz4fnBIR8Sb0GRUUeQY',
      webcams: []
    }
  }
}
</script>
