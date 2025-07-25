<template>
  <div class="map-layout" ref="mapLayout">
    <MglMap v-if="showMap && mapStyle" :apiKey="mapApiKey" :mapStyle="mapStyle" :bounds.sync="bounds" :fitBoundsOptions="fitBoundsOptions" :center="center" :zoom="zoom" :dragRotate="false" :attributionControl="false" class="map" @load="onMapLoaded" @click="onMapClicked" @contextmenu="onMapRightClicked">
      <MglGeolocateControl :positionOptions="{ enableHighAccuracy: true }" :fitBoundsOptions="{ maxZoom: 12.5 }" :trackUserLocation="true" position="top-right" />
      <MglNavigationControl position="top-right" :showCompass="false" />
      <MglScaleControl position="bottom-left" :unit="mapUnits" />
      <MglAttributionControl :compact="$mq.mobile" position="bottom-right" />

      <!-- Note: these are not true Mapbox GL controls that get added via addControl(), as those don't mix well with Vue.js templating.
           Instead, we simply put all our custom non-Mapbox controls in the top left corner where they don't clash with any builtin controls. -->
      <div class="maplibregl-ctrl-top-left">
        <MapFilterControl ref="filterControl" position="top-left" @startFiltering="filtering = true" @stopFiltering="filtering = false" />
        <MapOptionsControl ref="optionsControl" position="top-left" />
        <MapDownloadControl position="top-left" />
      </div>

      <MglPopup v-if="loadingPopupCoordinates" key="loading" :coordinates="loadingPopupCoordinates" :showed="true" anchor="bottom" @added="onPopupAdded">
        <div class="loading-ring-wrapper">
          <LoadingRing />
        </div>
      </MglPopup>

      <SummitPopup v-if="summit" :summit="summit" :lastSpot="lastSummitSpot" :nextAlert="nextSummitAlert" @close="onPopupClosed" />

      <MapRoute v-for="route in persistentRoutes" :key="route.id" :route="route" />

      <MapInfoPopup v-if="infoCoordinates !== null" :coordinates="infoCoordinates" @close="infoCoordinates = null" />

      <MapDraw ref="draw" />

      <MapWebcams v-if="mapOptions.webcams" />
    </MglMap>
    <div v-if="zoomWarning" class="zoom-warning">Zoom in to see all filtered/spotted summits</div>
    <SwisstopoInfo />
    <BasemapAtInfo />
    <b-loading :is-full-page="false" :active="filtering || !showMap || !mapStyle" />
  </div>
</template>

<script>
import axios from 'axios'
import utils from '../mixins/utils.js'
import smptracks from '../mixins/smptracks.js'
import mapstyle from '../mixins/mapstyle.js'
import longtouch from '../mixins/longtouch.js'

import { MglMap, MglPopup, MglNavigationControl, MglGeolocateControl, MglScaleControl, MglAttributionControl } from 'vue-mapbox'
import MapFilterControl from '../components/MapFilterControl.vue'
import MapOptionsControl from '../components/MapOptionsControl.vue'
import MapDownloadControl from '../components/MapDownloadControl.vue'
import LoadingRing from '../components/LoadingRing.vue'
import SummitPopup from '../components/SummitPopup.vue'
import MapRoute from '../components/MapRoute.vue'
import MapInfoPopup from '../components/MapInfoPopup.vue'
import MapDraw from '../components/MapDraw.vue'
import MapWebcams from '../components/MapWebcams.vue'
import SwisstopoInfo from '../components/SwisstopoInfo.vue'
import BasemapAtInfo from '../components/BasemapAtInfo.vue'

export default {
  name: 'Map',
  components: {
    MglMap, MglPopup, MglNavigationControl, MglGeolocateControl, MglScaleControl, MglAttributionControl, MapFilterControl, MapOptionsControl, MapDownloadControl, LoadingRing, SummitPopup, MapRoute, MapInfoPopup, MapDraw, MapWebcams, SwisstopoInfo, BasemapAtInfo
  },
  mixins: [utils, smptracks, mapstyle, longtouch],
  created () {
    this.map = null
  },
  mounted () {
    // Check for summit code or coordinates first; if present, start map right there
    if (this.$route.params.summitCode) {
      this.fetchSummit(this.$route.params.summitCode)
        .then(summit => {
          if (summit) {
            this.bounds = [[summit.coordinates.longitude, summit.coordinates.latitude], [summit.coordinates.longitude, summit.coordinates.latitude]]
            this.fitBoundsOptions = this.makeFitBoundsOptions()
          }
          this.showMap = true
        })
    } else if (this.$route.params.coordinates) {
      this.center = this.$route.params.coordinates.split(/,/).reverse()
      if (this.$route.params.zoom) {
        this.zoom = parseFloat(this.$route.params.zoom)
      }
      this.showMap = true
    } else if (this.$route.params.region) {
      this.getRegionBounds(this.$route.params.region)
        .then(bounds => {
          this.bounds = bounds
          this.fitBoundsOptions = { animate: false, padding: { left: 60, top: 40, right: 60, bottom: 40 } }
          this.showMap = true
        })
    } else {
      if (localStorage.getItem('bounds')) {
        try {
          this.bounds = JSON.parse(localStorage.getItem('bounds'))
        } catch (e) {}
        this.showMap = true
      } else {
        axios.get(import.meta.env.VITE_API_URL + '/my_coordinates')
          .then(response => {
            if (response.data.latitude && response.data.longitude) {
              this.center = [response.data.longitude, response.data.latitude]
              this.zoom = 8
            } else {
              this.bounds = [[186, 75], [-172, -59]]
            }
          })
          .finally(() => {
            this.showMap = true
          })
      }
    }
  },
  props: {
    clickFuzz: {
      type: Number,
      default: 10
    }
  },
  data () {
    return {
      showMap: false,
      bounds: undefined,
      fitBoundsOptions: undefined,
      center: undefined,
      zoom: 14,
      loadingPopupCoordinates: null,
      summit: null,
      leavingRoute: false,
      zoomWarning: false,
      filtering: false,
      infoCoordinates: null,
      persistentRoutes: []
    }
  },
  watch: {
    bounds (val) {
      localStorage.setItem('bounds', JSON.stringify(Array.isArray(val) ? val : val.toArray()))
      this.updateMapURL()
      if (this.map) {
        const center = this.map.getCenter()
        this.$store.commit('setMapCenter', { latitude: center.lat, longitude: center.lng })

        this.zoomWarning = (this.map.getZoom() < 3 && (this.$refs.filterControl.isActive() || this.$refs.optionsControl.spotsShown()))
      }
    },
    '$route' (to, from) {
      this.updateRoute()
    },
    summit () {
      if (!this.summit) {
        return
      }
      if (!this.isSummitValid(this.summit)) {
        this.$refs.optionsControl.showInactive()
      }
      this.persistentRoutes = []
    },
    routes () {
      if (this.routes.length !== 0) {
        this.persistentRoutes = this.routes
      }
    },
    mapOptions: {
      handler (newValue) {
        this.updateLayers(this.map)
      },
      deep: true
    }
  },
  computed: {
    lastSummitSpot () {
      if (!this.summit) {
        return null
      }

      let spots = this.$store.state.spots.filter(spot => {
        return (spot.summit.code === this.summit.code)
      }).sort((a, b) => {
        if (a.timeStamp > b.timeStamp) {
          return -1
        } else if (a.timeStamp < b.timeStamp) {
          return 1
        } else {
          return 0
        }
      })
      if (spots.length > 0) {
        return spots[0]
      } else {
        return null
      }
    },
    nextSummitAlert () {
      if (!this.summit) {
        return null
      }

      let alerts = this.$store.state.alerts.filter(alert => {
        return (alert.summit.code === this.summit.code)
      }).sort((a, b) => {
        if (a.dateActivated > b.dateActivated) {
          return 1
        } else if (a.dateActivated < b.dateActivated) {
          return -1
        } else {
          return 0
        }
      })
      if (alerts.length > 0) {
        return alerts[0]
      } else {
        return null
      }
    },
    mapOptions () {
      return this.$store.state.mapOptions
    }
  },
  methods: {
    onMapLoaded (event) {
      this.map = event.map
      this.map.touchZoomRotate.disableRotation();
      ['summits_circles_all', 'summits_circles', 'summits_inactive_circles'].forEach(layer => {
        this.map.on('mouseenter', layer, () => {
          if (!this.$refs.draw.isDrawing()) {
            this.map.getCanvas().style.cursor = 'pointer'
          }
        })
        this.map.on('mouseleave', layer, () => {
          this.map.getCanvas().style.cursor = ''
        })
      })

      this.updateLayers(this.map)
      this.map.setLayoutProperty('summits_circles_all', 'visibility', 'visible')

      this.installLongTouchHandler(this.map, (e) => {
        this.infoCoordinates = {
          latitude: e.lngLat.lat,
          longitude: e.lngLat.lng
        }
      })
      this.updateRoute()
    },
    onMapClicked (event) {
      if (this.$refs.draw.isDrawing() || event.mapboxEvent.originalEvent.hitMarker) {
        return
      }

      // Search for summit circles with some padding/fuzz to make it easier to hit on mobile devices
      let point = event.mapboxEvent.point
      let bbox = [[point.x - this.clickFuzz, point.y - this.clickFuzz], [point.x + this.clickFuzz, point.y + this.clickFuzz]]
      let features = this.map.queryRenderedFeatures(bbox, { layers: ['summits_circles_all', 'summits_circles', 'summits_inactive_circles'] })

      if (features.length === 0) {
        // User probably clicked outside any features; close any controls
        this.$refs.filterControl.close()
        this.$refs.optionsControl.close()
        if (!this.summit) {
          this.persistentRoutes = []
        }
        return
      }

      // Find the summit closest to where the user tapped
      let minDistance = null
      let chosenFeature = null
      features.forEach(feature => {
        let projected = this.map.project(feature.geometry.coordinates)
        let distance = Math.pow(projected.x - point.x, 2) + Math.pow(projected.y - point.y, 2)
        if (minDistance === null || distance < minDistance) {
          minDistance = distance
          chosenFeature = feature
        }
      })

      if (chosenFeature) {
        this.handleSummitClick(chosenFeature)
      }
    },
    onMapRightClicked (event) {
      this.infoCoordinates = {
        latitude: event.mapboxEvent.lngLat.lat,
        longitude: event.mapboxEvent.lngLat.lng
      }
    },
    updateRoute () {
      if (!this.$route.path.startsWith('/map') || this.lastSetUrl === this.$route.path) {
        this.lastSetUrl = null
        return
      }

      this.$nextTick(() => {
        this.map.resize()
      })

      if (this.$route.params.summitCode) {
        this.jumpToSummitCode(this.$route.params.summitCode)
        return
      } else if (this.$route.params.coordinates) {
        let coords = this.$route.params.coordinates.split(/,/).reverse()
        this.map.jumpTo({
          center: coords,
          zoom: this.$route.params.zoom ? parseFloat(this.$route.params.zoom) : 14
        })
        if (this.$route.query.popup) {
          this.infoCoordinates = {
            latitude: parseFloat(coords[1]),
            longitude: parseFloat(coords[0])
          }
        }
      } else if (this.$route.params.region) {
        this.getRegionBounds(this.$route.params.region)
          .then(bounds => {
            this.map.fitBounds(bounds, { animate: true, padding: { left: 60, top: 40, right: 60, bottom: 40 } })
          })
      }

      // Additionally a hash with summit code may be provided to open the popup
      let matches = window.location.hash.match('^#/summits/(.+)$')
      if (matches && (this.summit === null || matches[1] !== this.summit.code)) {
        this.fetchSummit(matches[1])
          .then(summit => {
            this.summit = summit
          })
      }
    },
    onPopupClosed () {
      this.summit = null
      this.updateMapURL()
    },
    onPopupAdded (popup) {
      popup.popup.options.focusAfterOpen = false
    },
    handleSummitClick (feature) {
      this.loadingPopupCoordinates = feature.geometry.coordinates
      this.summit = null
      this.fetchSummit(feature.properties.code)
        .then(summit => {
          this.loadingPopupCoordinates = null
          this.summit = summit
          this.updateMapURL()
        })
    },
    fetchSummit (summitCode) {
      return axios.get(import.meta.env.VITE_API_URL + '/summits/' + summitCode)
        .then(response => {
          let summit = response.data
          summit.photo = null
          return summit
        })
    },
    fetchAssociation (associationCode) {
      return axios.get(import.meta.env.VITE_API_URL + '/associations/' + associationCode)
        .then(response => {
          return response.data
        })
    },
    getRegionBounds (region) {
      let assocReg = region.split('/')
      return this.fetchAssociation(assocReg[0])
        .then(association => {
          let region = association.regions.find(el => el.code === assocReg[1])
          if (region) {
            // Add padding to bounds
            let padding = 1 // km
            region.bounds[0][0] -= padding / (Math.cos(region.bounds[0][1] * Math.PI / 180) * 111.32)
            region.bounds[0][1] -= padding / 111.32
            region.bounds[1][0] += padding / (Math.cos(region.bounds[0][1] * Math.PI / 180) * 111.32)
            region.bounds[1][1] += padding / 111.32
            return region.bounds
          }
        })
    },
    jumpToSummitCode (summitCode) {
      if (this.summit != null && summitCode === this.summit.code) {
        return
      }

      this.fetchSummit(summitCode)
        .then(summit => {
          if (!summit) {
            return
          }

          this.jumpToSummit(summit)
        })
    },
    jumpToSummit (summit) {
      this.map.fitBounds([[summit.coordinates.longitude, summit.coordinates.latitude], [summit.coordinates.longitude, summit.coordinates.latitude]], this.makeFitBoundsOptions())
      this.summit = summit
    },
    updateMapURL () {
      if (this.map) {
        let url = '/map/coordinates/' + this.map.getCenter().toArray().reverse().map(a => { return a.toFixed(6) }).join(',') + '/' + this.map.getZoom().toFixed(1)
        let hash = ''
        if (this.summit && this.summit.code) {
          hash = '#/summits/' + this.summit.code
        }
        let path = url + hash
        if (!this.leavingRoute && this.$router.currentRoute.path !== path) {
          this.lastSetUrl = url
          this.$router.replace({ path, query: this.$router.currentRoute.query })
        }
      }
    },
    makeFitBoundsOptions () {
      let offsetY = 0
      let assumedPopupHeight = 430
      let mapHeight = this.$refs.mapLayout.clientHeight
      if (mapHeight < (assumedPopupHeight * 2)) {
        // Popup probably won't fit the screen vertically if we center the map on the summit, so we shift the map down
        offsetY = Math.max(0, Math.min(assumedPopupHeight - mapHeight / 2, mapHeight / 4 - 20))
      }
      return { offset: [0, offsetY], maxZoom: 14, animate: false }
    }
  },
  provide () {
    return {
      map: this.map
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.leavingRoute = false
      document.title = 'Map - SOTLAS'
    })
  },
  beforeRouteLeave (to, from, next) {
    if (!to.path.match(/^\/map/)) {
      this.leavingRoute = true
    }
    next()
  }
}
</script>

<style scoped>
.map-layout {
  position: absolute;
  touch-action: manipulation;
  top: 3.25rem;
  right: 0;
  bottom: 0;
  left: 0;
}
.map >>> .maplibregl-popup {
  max-width: 600px !important;
}
.loading-ring-wrapper {
  margin: 1rem 0.5rem 0.5rem 0.5rem;
}
.zoom-warning {
  position: absolute;
  left: 50%;
  top: 1.5rem;
  transform: translate(-50%, 0);
  background-color: #feffd2;
  padding: 0.2em 0.5em;
  border-radius: 0.5em;
  text-align: center;
  opacity: 0.9;
}
</style>
