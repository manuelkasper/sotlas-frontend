<template>
  <div>
    <MapWebcam v-for="webcam in webcams" :key="webcam.webcamId" :webcam="webcam" :size="size" />
  </div>
</template>

<script>
import MapWebcam from '../components/MapWebcam.vue'
import axios from 'axios'
import { debounce } from '../debounce'

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
    hasSignificantChanges() {
      if (!this.map) return false
      
      const currentZoom = Math.floor(this.map.getZoom())
      const currentBounds = this.map.getBounds()
      
      // First load - always load webcams
      if (this.lastZoom === null || this.lastBounds === null) {
        return true
      }
      
      // Check zoom level change (more than 0.1 level)
      if (Math.abs(currentZoom - this.lastZoom) > 0.1) {
        return true
      }
      
      // Check if map center has moved significantly
      const currentCenter = currentBounds.getCenter()
      const lastCenter = this.lastBounds.getCenter()
      const currentSpan = Math.abs(currentBounds.getNorthEast().lat - currentBounds.getSouthWest().lat)
      
      const centerLatDiff = Math.abs(currentCenter.lat - lastCenter.lat)
      const centerLngDiff = Math.abs(currentCenter.lng - lastCenter.lng)
      
      // Load if center moved more than 1% of current map span
      if (centerLatDiff > currentSpan * 0.01 || centerLngDiff > currentSpan * 0.01) {
        return true
      }
      
      return false
    },
    setupMap () {
      if (!this.map || this.setup) {
        return
      }

      // Remove any existing idle listener to prevent duplicates
      if (this.idleListener) {
        this.map.off('idle', this.idleListener)
      }

      // Create a debounced version of loadWebcams
      this.idleListener = debounce(() => {
        this.loadWebcams()
      }, 300)

      this.map.on('idle', this.idleListener)
      
      // Initial load
      this.loadWebcams()
      this.setup = true
    },
    loadWebcams (isRetry = false) {
      // Check if changes are significant enough to warrant loading new webcams.
      // The single rate-limit retry passes isRetry so it still runs if the map has not moved.
      if (!isRetry && !this.hasSignificantChanges()) {
        return
      }
      
      // Prevent multiple simultaneous requests
      if (this.loading) {
        return
      }

      this.clearRateLimitRetry()
      this.loading = true
      
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
        this.loading = false
        return
      }

      axios.get('https://api.windy.com/webcams/api/v3/map/clusters', {
        headers: { 'X-WINDY-API-KEY': import.meta.env.VITE_WINDY_API_KEY },
        params: {
          northLat: this.map.getBounds().getNorthEast().lat,
          eastLon: this.map.getBounds().getNorthEast().lng,
          southLat: this.map.getBounds().getSouthWest().lat,
          westLon: this.map.getBounds().getSouthWest().lng,
          zoom: mapZoom,
          include: 'location,images,urls'
        },
        // Treat 429 as a resolved response so the global error snackbar stays hidden.
        validateStatus: status => (status >= 200 && status < 300) || status === 429
      })
        .then(response => {
          if (response.status === 429) {
            // Remember this view so idle events do not request again until the map moves.
            // Only the first 429 is retried; a second one stops until that move.
            this.rememberView()
            if (!isRetry) {
              this.scheduleRateLimitRetry()
            }
            return
          }

          this.webcams = response.data.filter(webcam => { return webcam.status === 'active' })
          this.rememberView()
        })
        .catch(error => {
          console.error('Error loading webcams:', error)
        })
        .finally(() => {
          this.loading = false
        })
    },
    rememberView () {
      this.lastZoom = Math.floor(this.map.getZoom())
      this.lastBounds = this.map.getBounds()
    },
    scheduleRateLimitRetry () {
      if (!this.setup) {
        return
      }

      this.clearRateLimitRetry()
      this.rateLimitRetryTimer = setTimeout(() => {
        this.rateLimitRetryTimer = null
        this.loadWebcams(true)
      }, 5000)
    },
    clearRateLimitRetry () {
      if (this.rateLimitRetryTimer) {
        clearTimeout(this.rateLimitRetryTimer)
        this.rateLimitRetryTimer = null
      }
    },
    cleanup() {
      this.clearRateLimitRetry()
      if (this.map && this.idleListener) {
        this.map.off('idle', this.idleListener)
        this.idleListener = null
      }
      this.setup = false
      this.lastZoom = null
      this.lastBounds = null
      this.loading = false
    }
  },
  watch: {
    map: {
      handler (newMap, oldMap) {
        // Clean up old map listeners
        if (oldMap && this.idleListener) {
          oldMap.off('idle', this.idleListener)
          this.idleListener = null
        }
        this.clearRateLimitRetry()
        this.setup = false
        this.lastZoom = null
        this.lastBounds = null
        this.loading = false
        this.setupMap()
      },
      immediate: true
    }
  },
  beforeUnmount() {
    this.cleanup()
  },
  data () {
    return {
      webcams: [],
      setup: false,
      idleListener: null,
      lastZoom: null,
      lastBounds: null,
      loading: false,
      rateLimitRetryTimer: null
    }
  }
}
</script>
