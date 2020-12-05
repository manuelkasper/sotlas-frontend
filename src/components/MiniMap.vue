<template>
  <MglMap v-if="(mapCenter || bounds) && mapStyle" :mapStyle="mapStyle" :bounds="bounds" :fitBoundsOptions="fitBoundsOptions" :center="mapCenter" :zoom="12.5" :attributionControl="false" @load="onMapLoaded" @click="onMapClicked" @contextmenu="onMapRightClicked" @idle="onMapIdle">
    <MglGeolocateControl v-if="!$mq.mobile || isEnlarged" :positionOptions="{ enableHighAccuracy: true }" :fitBoundsOptions="{ maxZoom: 12.5 }" :trackUserLocation="true" position="top-right" />
    <MglNavigationControl v-if="!$mq.mobile" position="top-right" :showCompass="false" />
    <MglScaleControl v-if="!$mq.mobile || isEnlarged" position="bottom-left" />
    <div v-if="canEnlarge" class="mapboxgl-ctrl-top-left">
      <MapEnlargeControl :isEnlarged="isEnlarged" @enlarge="$emit('enlarge')" />
    </div>
    <MglAttributionControl :compact="true" position="bottom-right" />

    <MapRoute v-for="route in routes" :key="route.id" :route="route" />
    <MapPhoto v-for="photo in mapPhotos" :key="photo.filename" :summit="summit" :photo="photo" @photoClicked="photo => $emit('photoClicked', photo)" />
    <MapInfoPopup v-if="infoCoordinates !== null" :coordinates="infoCoordinates" @close="infoCoordinates = null" />
    <div v-if="zoomWarningVisible" class="zoom-warning">Zoom in to see all activations</div>
  </MglMap>
</template>

<script>
import { MglMap, MglGeolocateControl, MglNavigationControl, MglScaleControl, MglAttributionControl } from 'vue-mapbox'
import MapRoute from './MapRoute.vue'
import MapPhoto from './MapPhoto.vue'
import MapInfoPopup from './MapInfoPopup.vue'
import MapEnlargeControl from './MapEnlargeControl.vue'
import mapstyle from '../mixins/mapstyle.js'
import utils from '../mixins/utils.js'
import longtouch from '../mixins/longtouch.js'

export default {
  name: 'MiniMap',
  props: {
    summit: Object,
    routes: {
      type: Array,
      default: () => { return [] }
    },
    filter: Array,
    bounds: Array,
    isEnlarged: Boolean,
    zoomWarning: Boolean,
    showInactiveSummits: Boolean,
    canEnlarge: Boolean
  },
  components: {
    MglMap, MglGeolocateControl, MglNavigationControl, MapEnlargeControl, MglScaleControl, MglAttributionControl, MapRoute, MapPhoto, MapInfoPopup
  },
  mixins: [utils, mapstyle, longtouch],
  watch: {
    summit: {
      immediate: true,
      handler () {
        this.highlightCurrentSummit()
      }
    },
    showInactiveSummits () {
      this.showHideInactiveSummits()
    }
  },
  computed: {
    mapCenter () {
      if (this.summit && this.summit.coordinates) {
        return [this.summit.coordinates.longitude, this.summit.coordinates.latitude]
      } else {
        return undefined
      }
    },
    mapPhotos () {
      if (!this.summit || !this.summit.photos) {
        return []
      }
      return this.summit.photos.filter(photo => {
        if (photo.coordinates === undefined) {
          return false
        }
        if (photo.positioningError && photo.positioningError > 100) {
          return false
        }
        return true
      })
    },
    fitBoundsOptions () {
      return { padding: { left: 60, top: 40, right: 60, bottom: 40 }, maxZoom: 12 }
    }
  },
  methods: {
    showHideInactiveSummits () {
      if (!this.map) {
        return
      }

      if (this.showInactiveSummits) {
        this.map.setLayoutProperty('summits_inactive_names', 'visibility', 'visible')
        this.map.setLayoutProperty('summits_inactive_circles', 'visibility', 'visible')
      } else {
        this.map.setLayoutProperty('summits_inactive_names', 'visibility', 'none')
        this.map.setLayoutProperty('summits_inactive_circles', 'visibility', 'none')
      }
    },
    highlightCurrentSummit () {
      if (!this.map || !this.summit || !this.summit.code) {
        return
      }

      this.map.setFilter('summits_selected', ['==', 'code', this.summit.code])
    },
    onMapLoaded (event) {
      this.map = event.map
      this.map.touchZoomRotate.disableRotation()
      this.$nextTick(() => {
        this.map.resize()
      });
      ['summits_circles', 'summits_inactive_circles'].forEach(layer => {
        this.map.on('mouseenter', layer, () => {
          this.map.getCanvas().style.cursor = 'pointer'
        })
        this.map.on('mouseleave', layer, () => {
          this.map.getCanvas().style.cursor = ''
        })
      })

      this.map.setFilter('summits_circles', this.filter)
      this.map.setFilter('summits_names', this.filter)
      this.map.setFilter('summits_activations', this.filter)
      this.map.setFilter('summits_inactive_circles', this.filter)
      this.map.setFilter('summits_inactive_names', this.filter)

      this.map.setLayoutProperty('contour', 'visibility', 'visible')
      this.map.setLayoutProperty('contour_index', 'visibility', 'visible')
      this.map.setLayoutProperty('contour_label', 'visibility', 'visible')
      this.map.setLayoutProperty('hillshading', 'visibility', 'visible')

      this.updateDifficultyLayer()

      this.installLongTouchHandler(this.map, (e) => {
        this.infoCoordinates = {
          latitude: e.lngLat.lat,
          longitude: e.lngLat.lng
        }
      })

      // Workaround to let users scroll page on mobile devices without inadvertently
      // panning the map, while still being able to pan it with two fingers
      // See also: https://github.com/mapbox/mapbox-gl-js/issues/2618
      if (this.$mq.mobile) {
        this.map.on('touchstart', (e) => {
          if (this.isEnlarged) {
            this.map.dragPan.enable()
            return
          }

          let oe = e.originalEvent
          if (oe && 'touches' in oe) {
            if (oe.touches.length > 1) {
              oe.stopImmediatePropagation()
              this.map.dragPan.enable()
            } else {
              this.map.dragPan.disable()
            }
          }
        })
      }
      this.showHideInactiveSummits()
      this.highlightCurrentSummit()
    },
    onMapClicked (event) {
      if (event.mapboxEvent.originalEvent.hitMarker) {
        return
      }

      // Search for summit circles with some padding/fuzz to make it easier to hit on mobile devices
      let point = event.mapboxEvent.point
      let bbox = [[point.x - 10, point.y - 10], [point.x + 10, point.y + 10]]
      let features = this.map.queryRenderedFeatures(bbox, { layers: ['summits_circles', 'summits_inactive_circles'] })

      if (features.length > 0) {
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

        if (chosenFeature && chosenFeature.properties.code) {
          if (this.summit && chosenFeature.properties.code === this.summit.code) {
            this.$router.push('/map/summits/' + chosenFeature.properties.code)
          } else {
            this.$router.push('/summits/' + chosenFeature.properties.code)
          }
        }
      }
    },
    onMapRightClicked (event) {
      this.infoCoordinates = {
        latitude: event.mapboxEvent.lngLat.lat,
        longitude: event.mapboxEvent.lngLat.lng
      }
    },
    onMapIdle () {
      if (this.map) {
        this.zoomWarningVisible = (this.map.getZoom() < 3) && this.zoomWarning
      }
    },
    updateDifficultyLayer () {
      if (!this.map) {
        return
      }

      // Glean main map difficulty visibility setting
      let mapOptions
      try {
        mapOptions = JSON.parse(localStorage.getItem('mapOptions'))
        if (mapOptions && mapOptions.difficulty === false) {
          this.map.setLayoutProperty('road_path_pedestrian_sac', 'visibility', 'none')
          this.map.setLayoutProperty('road_path_pedestrian_sac_label', 'visibility', 'none')
        } else {
          this.map.setLayoutProperty('road_path_pedestrian_sac', 'visibility', 'visible')
          this.map.setLayoutProperty('road_path_pedestrian_sac_label', 'visibility', 'visible')
        }
      } catch (e) {}
    },
    resize () {
      this.$nextTick(() => {
        if (this.map) {
          this.map.resize()
        }
      })
    },
    easeTo (coordinates, zoom) {
      if (this.map) {
        this.map.easeTo({
          center: coordinates,
          zoom
        })
      }
    }
  },
  data () {
    return {
      infoCoordinates: null,
      zoomWarningVisible: false
    }
  }
}
</script>

<style scoped>
>>> .mapboxgl-canvas-container.mapboxgl-interactive {
  cursor: auto;
}
.map >>> .mapboxgl-popup {
  max-width: 400px !important;
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
