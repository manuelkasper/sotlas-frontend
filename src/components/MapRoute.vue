<template>
  <div>
    <MglGeojsonLayer v-if="trackSource" :sourceId="sourceId + '_trk'" :source="trackSource" :layerId="sourceId + '_trk'" :layer="trackLayer" before="summits_selected" />
    <MglGeojsonLayer v-if="waypointSource" :sourceId="sourceId + '_wpt'" :source="waypointSource" :layerId="sourceId + '_wpt'" :layer="waypointLayer" before="summits_selected" />
    <MglMarker v-if="startCoordinates" :coordinates="startCoordinates">
      <font-awesome-layers slot="marker" class="fa-2x">
        <font-awesome-icon icon="circle" :style="{ color: route.highlight ? '#ee0000' : '#0000ee' }" />
        <font-awesome-icon :icon="['fas', 'hiking']" transform="shrink-6" :style="{ color: 'white' }" />
      </font-awesome-layers>
    </MglMarker>
    <MglMarker v-if="parkingCoordinates" :coordinates="parkingCoordinates">
      <font-awesome-layers slot="marker" class="fa-2x">
        <font-awesome-icon icon="square" :style="{ color: 'white' }" />
        <font-awesome-icon :icon="['fas', 'parking']" :style="{ color: route.highlight ? '#ee0000' : '#0000ee' }" />
      </font-awesome-layers>
    </MglMarker>
    <MglMarker v-if="publicTransportCoordinates" :coordinates="publicTransportCoordinates">
      <font-awesome-layers slot="marker" class="fa-2x">
        <font-awesome-icon icon="square" :style="{ color: route.highlight ? '#ee0000' : '#0000ee' }" />
        <font-awesome-icon :icon="['fas', 'bus']" transform="shrink-6" :style="{ color: 'white' }" />
      </font-awesome-layers>
    </MglMarker>
  </div>
</template>

<script>
import axios from 'axios'
import togeojson from '@tmcw/togeojson'
import { MglGeojsonLayer, MglMarker } from 'vue-mapbox'
import haversineDistance from 'haversine-distance'
import tracks from '../mixins/tracks.js'

export default {
  name: 'MapRoute',
  props: {
    route: Object
  },
  components: {
    MglGeojsonLayer, MglMarker
  },
  mixins: [tracks],
  computed: {
    trackLayer () {
      let lineColor = '#1cd60d'
      let lineOpacity = 0.75
      let lineWidth = 3
      if (this.route.highlight === true) {
        lineColor = '#4fe005'
        lineOpacity = 0.85
        lineWidth = 4.5
      } else if (this.route.highlight === false) {
        lineColor = '#86bc6b'
        lineOpacity = 0.25
      }

      return {
        type: 'line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': lineColor,
          'line-width': lineWidth,
          'line-opacity': lineOpacity
        }
      }
    },
    waypointLayer () {
      return {
        type: 'symbol',
        layout: {
          visibility: this.route.highlight ? 'visible' : 'none',
          'icon-image': 'information_15',
          'text-field': '{name}',
          'text-font': ['Open Sans Regular'],
          'text-size': {
            base: 1,
            stops: [
              [13, 10],
              [20, 12]
            ]
          },
          'text-anchor': 'bottom',
          'text-offset': {
            stops: [
              [
                13,
                [
                  0,
                  2.3
                ]
              ],
              [
                20,
                [
                  0,
                  2.5
                ]
              ]
            ]
          }
        },
        paint: {
          'text-color': 'rgba(200, 0, 0, 1)',
          'text-halo-color': 'rgba(255, 255, 255, 1)',
          'text-halo-width': 1,
          'text-halo-blur': 1
        }
      }
    },
    startCoordinates () {
      if (!this.route.startPoint) {
        return null
      }
      // If start point coordinates are very close to parking or public transport, then don't display them
      if ((this.route.parking && this.route.parking.coordinates && haversineDistance(this.route.startPoint.coordinates, this.route.parking.coordinates) < 50) ||
          (this.route.publicTransport && this.route.publicTransport.coordinates && haversineDistance(this.route.startPoint.coordinates, this.route.publicTransport.coordinates) < 50)) {
        return null
      }
      return [this.route.startPoint.coordinates.longitude, this.route.startPoint.coordinates.latitude]
    },
    parkingCoordinates () {
      if (!this.route.parking || !this.route.parking.coordinates) {
        return null
      }
      return [this.route.parking.coordinates.longitude, this.route.parking.coordinates.latitude]
    },
    publicTransportCoordinates () {
      if (!this.route.publicTransport || !this.route.publicTransport.coordinates) {
        return null
      }
      return [this.route.publicTransport.coordinates.longitude, this.route.publicTransport.coordinates.latitude]
    },
    trackSource () {
      if (this.geoJsonSource === null || this.geoJsonSource.data.type !== 'FeatureCollection') {
        return null
      }
      return {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: this.geoJsonSource.data.features.filter(feature => feature.geometry.type === 'LineString')
        }
      }
    },
    waypointSource () {
      if (this.geoJsonSource === null || this.geoJsonSource.data.type !== 'FeatureCollection') {
        return null
      }

      return {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: this.geoJsonSource.data.features.filter(feature => feature.geometry.type === 'Point')
        }
      }
    }
  },
  watch: {
    route: {
      immediate: true,
      handler () {
        if (this.route.track) {
          if (this.route.track.filename) {
            this.loadGpx()
          } else if (this.route.track.points) {
            this.convertSmpPoints()
          }
        }
      }
    }
  },
  methods: {
    loadGpx () {
      this.sourceId = this.route.track.filename
      axios.get(this.trackUrl(this.route.track))
        .then(response => {
          let dom = (new DOMParser()).parseFromString(response.data, 'text/xml')
          this.geoJsonSource = {
            type: 'geojson',
            data: togeojson.gpx(dom)
          }
        })
    },
    convertSmpPoints () {
      this.sourceId = this.route.id
      let geojson = {
        type: 'LineString',
        coordinates: this.route.track.points.map(point => {
          return [point.longitude, point.latitude]
        })
      }
      this.geoJsonSource = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: geojson
          }]
        }
      }
    }
  },
  data () {
    return {
      geoJsonSource: null,
      sourceId: ''
    }
  }
}
</script>
