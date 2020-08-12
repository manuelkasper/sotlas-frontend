<template>
  <div>
    <div v-if="chartData || loading" class="elevation-chart">
      <div class="elevation-controls">
        <b-button size="is-small" type="is-text" icon-left="window-close" @click="hideElevationProfile" />
      </div>
      <b-loading :active="loading" :is-full-page="false" />
      <LineChart v-if="chartData" :data="chartData" labelField="distance" valueField="elevation" name="Elevation" :xIsSeries="true" :animate="false" :suffixX="' ' + distanceUnits" :suffixY="' ' + $store.state.altitudeUnits" />
    </div>
  </div>
</template>

<script>
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import haversineDistance from 'haversine-distance'
import cheapRuler from 'cheap-ruler'
import togpx from 'togpx'
import moment from 'moment'
import axios from 'axios'
import utils from '../mixins/utils.js'
import LineChart from './LineChart.vue'
import { gpx, kml } from '@tmcw/togeojson'

export default {
  components: { LineChart },
  inject: ['map'],
  mixins: [utils],
  mounted () {
    this.setupDraw()
  },
  watch: {
    map () {
      this.setupDraw()
    }
  },
  computed: {
    distanceUnits () {
      return (this.$store.state.altitudeUnits === 'ft' ? 'mi' : 'km')
    }
  },
  methods: {
    isDrawing () {
      return (this.draw && this.draw.getMode() !== 'simple_select')
    },
    setupDraw () {
      if (!this.map || this.draw) {
        return
      }

      this.draw = new MapboxDraw({
        controls: {
          point: true,
          line_string: true,
          trash: true,
          open: true,
          save: true
        },
        displayControlsDefault: false,
        styles: [
          {
            'id': 'gl-draw-line-midpoint',
            'type': 'circle',
            'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
            'paint': {
              'circle-radius': 3,
              'circle-color': '#d20c0c'
            }
          },
          {
            'id': 'gl-draw-line-inactive',
            'type': 'line',
            'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#d20c0c',
              'line-width': 2
            }
          },
          {
            'id': 'gl-draw-line-active',
            'type': 'line',
            'filter': ['all', ['==', '$type', 'LineString'], ['==', 'active', 'true']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#d20c0c',
              'line-dasharray': [0.2, 2],
              'line-width': 2
            }
          },
          {
            'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
            'type': 'circle',
            'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
            'paint': {
              'circle-radius': 7,
              'circle-color': '#fff'
            }
          },
          {
            'id': 'gl-draw-polygon-and-line-vertex-inactive',
            'type': 'circle',
            'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
            'paint': {
              'circle-radius': 5,
              'circle-color': '#d20c0c'
            }
          },
          {
            'id': 'gl-draw-point-point-stroke-inactive',
            'type': 'circle',
            'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'feature'], ['!=', 'mode', 'static']],
            'paint': {
              'circle-radius': 7,
              'circle-opacity': 1,
              'circle-color': '#fff'
            }
          },
          {
            'id': 'gl-draw-point-inactive',
            'type': 'circle',
            'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'feature'], ['!=', 'mode', 'static']],
            'paint': {
              'circle-radius': 5,
              'circle-color': '#d20c0c'
            }
          },
          {
            'id': 'gl-draw-point-active',
            'type': 'circle',
            'filter': ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint'], ['==', 'active', 'true']],
            'paint': {
              'circle-radius': 9,
              'circle-color': '#d20c0c'
            }
          },
          {
            'id': 'gl-draw-point-stroke-active',
            'type': 'circle',
            'filter': ['all', ['==', '$type', 'Point'], ['==', 'active', 'true'], ['!=', 'meta', 'midpoint']],
            'paint': {
              'circle-radius': 7,
              'circle-color': '#fff'
            }
          }
        ]
      })
      this.map.addControl(this.draw, 'top-right')

      this.map.addSource('_measurements', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })

      this.map.addLayer({
        id: '_measurements_endpoint',
        source: '_measurements',
        type: 'symbol',
        minzoom: 9,
        filter: ['all', ['==', 'measType', 'endpoint']],
        paint: {
          'text-color': '#d20c0c',
          'text-halo-color': '#fff',
          'text-halo-width': 2
        },
        layout: {
          'text-font': ['Open Sans Regular'],
          'text-field': '{label}',
          'text-size': { 'stops': [[9, 9], [12, 14]] },
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'text-offset': [1.5, 1.5]
        }
      })

      this.map.addLayer({
        id: '_measurements_interval',
        source: '_measurements',
        type: 'symbol',
        minzoom: 12.5,
        filter: ['all', ['==', 'measType', 'interval']],
        paint: {
          'text-color': '#d20c0c'
        },
        layout: {
          'text-font': ['Open Sans Regular'],
          'text-field': '{label}',
          'text-size': 10,
          'icon-image': 'us-state_2'
        }
      })

      // Update measurements on render
      this.map.on('draw.render', e => {
        let labelFeatures = []
        let all = this.draw.getAll()
        if (all && all.features) {
          let selected = this.draw.getSelectedIds()
          let ruler = cheapRuler(this.map.getCenter().lat, 'meters')
          all.features.forEach(feature => {
            if (feature.geometry.type === 'LineString') {
              let distance = ruler.lineDistance(feature.geometry.coordinates)

              if (distance > 0) {
                // 1 km (or 1 mi) interval markers along line, unless selected
                if (!selected.includes(feature.id) && distance < 100000) {
                  let markerOffset = this.$store.state.altitudeUnits === 'ft' ? 1609.3445 : 1000
                  let i = 1
                  while (markerOffset < distance) {
                    if (distance - markerOffset < 200) {
                      break
                    }
                    let intervalCoords = ruler.along(feature.geometry.coordinates, markerOffset)
                    labelFeatures.push({
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: intervalCoords
                      },
                      properties: {
                        label: i,
                        measType: 'interval'
                      }
                    })
                    i++
                    markerOffset = i * (this.$store.state.altitudeUnits === 'ft' ? 1609.3445 : 1000)
                  }
                }

                // Total distance at endpoint
                labelFeatures.push({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: feature.geometry.coordinates[feature.geometry.coordinates.length - 1]
                  },
                  properties: {
                    label: this.formatDistance(distance),
                    measType: 'endpoint'
                  }
                })
              }
            }
          })
        }
        this.map.getSource('_measurements').setData({
          type: 'FeatureCollection',
          features: labelFeatures
        })
        this.map.moveLayer('_measurements_interval')
      })

      this.map.on('draw.open', e => {
        this.input = document.createElement('input')
        this.input.setAttribute('type', 'file')
        this.input.setAttribute('accept', '.gpx,.kml,application/gpx+xml,application/vnd.google-earth.kml+xml')
        this.input.addEventListener('change', (e) => {
          for (let i = 0; i < e.target.files.length; i++) {
            let reader = new FileReader()
            reader.onload = e => {
              try {
                let dom = new DOMParser().parseFromString(e.target.result, 'text/xml')
                if (!dom) {
                  throw new Error('Bad XML document')
                }
                if (dom.documentElement.tagName === 'kml') {
                  this.draw.set(kml(dom))
                } else {
                  this.draw.set(gpx(dom))
                }
              } catch (e) {
                console.error(e)
              }
            }
            reader.readAsText(e.target.files[i])
          }
        }, false)
        this.input.click()
      })

      this.map.on('draw.save', e => {
        let all = this.draw.getAll()
        if (all && all.features && all.features.length > 0) {
          const loadingComponent = this.$buefy.loading.open()
          this.addElevations(all)
            .then(() => {
              loadingComponent.close()
              let gpx = togpx(all)
              let blob = new Blob([gpx], { type: 'application/gpx+xml' })
              let url = window.URL.createObjectURL(blob)
              let link = document.createElement('a')
              link.download = 'sotlas-' + moment().format('YYYYMMDD-HHmmss') + '.gpx'
              link.href = url
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              window.URL.revokeObjectURL(url)
            })
        } else {
          alert('Draw at least one line or point before saving your drawing.')
        }
      })

      this.map.on('draw.selectionchange', e => {
        this.updateElevationProfile()
      })

      this.map.on('draw.delete', e => {
        this.updateElevationProfile()
      })

      this.map.on('draw.update', e => {
        this.updateElevationProfile(true)
      })
    },
    calcDistance (coordinates) {
      if (coordinates.length < 2) {
        return 0
      }

      let distance = 0
      for (let i = 1; i < coordinates.length; i++) {
        distance += haversineDistance(
          { lng: coordinates[i - 1][0], lat: coordinates[i - 1][1] },
          { lng: coordinates[i][0], lat: coordinates[i][1] }
        )
      }
      return distance
    },
    formatDistance (distance) {
      if (distance === 0) {
        return ''
      }

      if (this.$store.state.altitudeUnits === 'ft') {
        return (distance * 0.000621371).toFixed(2) + ' mi'
      } else {
        if (distance > 1000) {
          return (distance / 1000).toFixed(2) + ' km'
        } else {
          return distance.toFixed(0) + ' m'
        }
      }
    },
    updateElevationProfile (forceUpdate = false) {
      let selectedFeatures = this.draw.getSelected()
      if (selectedFeatures.type !== 'FeatureCollection') {
        return
      }
      selectedFeatures = selectedFeatures.features
      if (selectedFeatures.length === 1 &&
          selectedFeatures[0].type === 'Feature' && selectedFeatures[0].geometry.type === 'LineString') {
        if (forceUpdate || this.selectedFeatureId !== selectedFeatures[0].id) {
          this.selectedFeatureId = selectedFeatures[0].id
          this.showElevationProfile(selectedFeatures[0].geometry.coordinates)
        }
      } else {
        this.selectedFeatureId = null
        this.hideElevationProfile()
      }
    },
    showElevationProfile (coordinates) {
      if (coordinates.length < 2) {
        return
      }

      // Make an elevation profile by sampling the line described by the coordinates at 100 m intervals,
      // or whichever interval size is needed to stay below 300 samples
      let ruler = cheapRuler(this.map.getCenter().lat, 'meters')
      let distance = ruler.lineDistance(coordinates)
      let interval = Math.max(distance / 300, 100)
      let eleCoordinates = []
      let distances = []
      let markerOffset
      for (markerOffset = 0; markerOffset < distance; markerOffset += interval) {
        let intervalCoords = ruler.along(coordinates, markerOffset)
        distances.push(markerOffset)
        eleCoordinates.push([intervalCoords[1], intervalCoords[0]])
      }

      // Ensure final point is added as well
      if ((distance - markerOffset + interval) > 5) {
        let last = coordinates[coordinates.length - 1]
        eleCoordinates.push([last[1], last[0]])
        distances.push(distance)
      }

      this.loading = true
      axios.post('https://ele.sotl.as/api', eleCoordinates)
        .then(result => {
          this.chartData = result.data.map((elevation, i) => {
            return {
              distance: this.renderDistance(distances[i]),
              elevation: this.renderElevation(elevation)
            }
          })
          this.loading = false
        })
        .finally(() => {
          this.loading = false
        })
    },
    hideElevationProfile () {
      this.chartData = null
    },
    renderElevation (elevation) {
      if (this.$store.state.altitudeUnits === 'ft') {
        return Math.round(elevation * 3.28084)
      } else {
        return Math.round(elevation)
      }
    },
    renderDistance (distance) {
      if (this.$store.state.altitudeUnits === 'ft') {
        return (distance * 0.000621371).toFixed(1)
      } else {
        return (distance / 1000).toFixed(1)
      }
    },
    addElevations (obj) {
      if (obj.type !== 'FeatureCollection') {
        return
      }
      return Promise.all(obj.features.map(feature => {
        if (feature.type !== 'Feature' || feature.geometry.type !== 'LineString') {
          return
        }

        let coordsSwapped = feature.geometry.coordinates.map(coord => [coord[1], coord[0]])
        return axios.post('https://ele.sotl.as/api', coordsSwapped)
          .then(result => {
            result.data.forEach((elevation, index) => {
              if (feature.geometry.coordinates[index].length === 2) {
                feature.geometry.coordinates[index].push(Math.round(elevation))
              }
            })
          })
      }))
    }
  },
  data () {
    return {
      chartData: null,
      loading: false,
      selectedFeatureId: null
    }
  }
}
</script>

<style scoped>
.elevation-chart {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 1.5rem;
  width: 800px;
  max-width: 80%;
  height: 250px;
  background: white;
  filter: drop-shadow(10px 10px 16px rgba(0,0,0,0.2));
}
.elevation-controls {
  position: absolute;
  background: white;
  right: 0px;
  z-index: 10;
}
</style>
