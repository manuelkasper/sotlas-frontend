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
      let mapZoom = Math.floor(Math.min(this.map.getZoom() + 2, 22))
      let mapBounds = this.map.getBounds().getNorthEast().lat + ',' + this.map.getBounds().getNorthEast().lng + ',' + this.map.getBounds().getSouthWest().lat + ',' + this.map.getBounds().getSouthWest().lng + ',' + mapZoom

      axios.get('https://api.windy.com/api/webcams/v2/map/' + mapBounds, { params: { key: this.windyApiKey, show: 'webcams:location,image,url,map' } })
        .then(response => {
          this.webcams = response.data.result.webcams.filter(webcam => { return webcam.status === 'active' })
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
