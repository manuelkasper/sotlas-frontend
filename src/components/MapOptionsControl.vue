<template>
  <div :class="{ 'mapboxgl-ctrl-group': true, 'mapboxgl-ctrl': true, 'mapbox-gl-map-options-container': true }">
    <b-tooltip class="info-tooltip" type="is-info" position="is-right" :active="!infoTooltipShown" always animated multilined label="Webcams and more available – open map options to see!">
      <button :class="{ 'mapboxgl-ctrl-icon': true, 'mapbox-gl-map-options': true }" type="button" title="Map options" @click="openCloseMapOptions" />
    </b-tooltip>
    <div v-if="open" class="map-options-container">
      <div class="map-option">
        <b-field grouped>
          <b-select v-model="mapType" size="is-small">
            <option v-for="(desc, type) in mapTypes" :key="type" :value="type">{{ desc }}</option>
          </b-select>
        </b-field>
      </div>
      <div class="map-option">
        <b-field grouped>
          <b-checkbox v-model="mapOptions.regions" size="is-small" @input="setMapOption('regions', $event)">Regions</b-checkbox>
        </b-field>
        <b-field v-if="mapType !== 'swisstopo_raster' && mapType !== 'swisstopo_aerial' && mapType != 'toposvalbard'" grouped>
          <b-checkbox v-model="mapOptions.contours" size="is-small" @input="setMapOption('contours', $event)">Contour lines</b-checkbox>
        </b-field>
        <b-field v-if="mapType !== 'swisstopo_raster' && mapType !== 'swisstopo_aerial' && mapType != 'toposvalbard'" grouped>
          <b-checkbox v-model="mapOptions.hillshading" size="is-small" @input="setMapOption('hillshading', $event)">Hillshading</b-checkbox>
        </b-field>
        <b-field v-if="mapType.startsWith('swisstopo')" grouped>
          <b-checkbox v-model="mapOptions.az" size="is-small" @input="setMapOption('az', $event)">
            Activation zones
            <b-icon pack="fas" icon="info-circle" size="is-small" type="is-info" @click.native="showActivationZoneInfo" />
          </b-checkbox>
        </b-field>
      </div>
      <div class="map-option" v-if="mapType != 'toposvalbard'">
        <b-field grouped>
          <b-checkbox v-model="mapOptions.difficulty" size="is-small" @input="setMapOption('difficulty', $event)">Hiking difficulty</b-checkbox>
        </b-field>
        <template v-if="mapType.startsWith('swisstopo')">
          <b-field grouped>
            <b-checkbox v-model="mapOptions.skiing" size="is-small" @input="setMapOption('skiing', $event)">Ski routes</b-checkbox>
          </b-field>
          <b-field grouped>
            <b-checkbox v-model="mapOptions.snowshoe" size="is-small" @input="setMapOption('snowshoe', $event)">Snowshoe routes</b-checkbox>
          </b-field>
          <b-field grouped>
            <b-checkbox v-model="mapOptions.slope_classes" size="is-small" @input="setMapOption('slope_classes', $event)">Slope classes over 30°</b-checkbox>
          </b-field>
          <b-field grouped>
            <b-checkbox v-model="mapOptions.wildlife" size="is-small" @input="setMapOption('wildlife', $event)">Wildlife reserves and areas</b-checkbox>
          </b-field>
        </template>
      </div>
      <div class="map-option">
        <b-field grouped>
          <b-checkbox v-model="mapOptions.spots" size="is-small" @input="setMapOption('spots', $event)">Recent spots</b-checkbox>
        </b-field>
        <b-field grouped>
          <b-checkbox v-model="mapOptions.inactive" size="is-small" @input="setMapOption('inactive', $event)">Inactive summits</b-checkbox>
        </b-field>
      </div>
      <div class="map-option">
        <b-field grouped>
          <b-checkbox v-model="mapOptions.webcams" size="is-small" @input="setMapOption('webcams', $event)"><b-icon pack="fas" icon="camera-home" size="is-small" /> Webcams</b-checkbox>
        </b-field>
        <b-field grouped>
          <b-radio v-model="mapOptions.webcamsType" size="is-small" native-value="daylight" :disabled="!mapOptions.webcams" @input="setMapOption('webcamsType', $event)">Daylight</b-radio>
          <b-radio v-model="mapOptions.webcamsType" size="is-small" native-value="current" :disabled="!mapOptions.webcams" @input="setMapOption('webcamsType', $event)">Current</b-radio>
        </b-field>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import mapstyle from '../mixins/mapstyle.js'
import prefs from '../mixins/prefs.js'

const RECENT_SPOT_AGE = 30 * 60 * 1000

export default {
  name: 'MapOptionsControl',
  inject: ['map'],
  mixins: [mapstyle, prefs],
  prefs: {
    key: 'mapOptionsControl',
    props: ['infoTooltipShown']
  },
  data () {
    return {
      open: false,
      infoTooltipShown: false
    }
  },
  mounted () {
    if (sessionStorage.getItem('mapReloaded')) {
      sessionStorage.removeItem('mapReloaded')
      this.open = true
    }
  },
  computed: {
    recentSpots () {
      let now = moment.utc()
      return this.$store.state.spots.filter(spot => {
        return (now.diff(spot.timeStamp) < RECENT_SPOT_AGE)
      }).map(spot => {
        return spot.summit.code
      })
    },
    mapType: {
      get () {
        return this.$store.state.mapType
      },
      set (newMapType) {
        this.$store.commit('setMapType', newMapType)
      }
    },
    mapOptions () {
      return this.$store.state.mapOptions
    }
  },
  watch: {
    recentSpots: {
      handler () {
        this.updateRecentSpots()
      },
      immediate: true
    },
    mapOptions: {
      handler () {
        this.updateRecentSpots()
      },
      deep: true
    },
    open () {
      if (this.open) {
        this.infoTooltipShown = true
      }
    }
  },
  methods: {
    showInactive () {
      this.$store.commit('setMapOption', { option: 'inactive', value: true })
    },
    close () {
      this.open = false
    },
    updateRecentSpots () {
      if (this.mapOptions.spots) {
        this.map.setFilter('summits_highlight', ['in', 'code', ...this.recentSpots])
      } else {
        this.map.setFilter('summits_highlight', ['in', 'code'])
      }
    },
    spotsShown () {
      return this.mapOptions.spots
    },
    openCloseMapOptions () {
      this.open = !this.open
    },
    setMapOption (option, value) {
      this.$store.commit('setMapOption', { option, value })
    },
    showActivationZoneInfo (event) {
      event.preventDefault()
      this.$buefy.dialog.alert({
        title: 'Activation zones',
        message: '<p style="margin-bottom: 0.5em">The activation zones for HB/HB0 have been calculated using <a href="https://www.swisstopo.admin.ch/de/geodata/height/alti3d.html" target="_blank">swissALTI3D</a> data from swisstopo (spatial resolution 0.5 m, accuracy ± 0.3 – 3 m (1σ) depending on the region).</p><p style="font-size: 0.8em">The activator is always responsible for ensuring that the operation takes place within the activation zone.</p>',
        type: 'is-info',
        hasIcon: true,
        icon: 'info-circle',
        iconPack: 'fas'
      })
    }
  }
}
</script>

<style scoped>
.mapbox-gl-map-options {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' stroke-linejoin='round' stroke-miterlimit='2'%3E%3Cpath d='M16.847 2.863c-.049 0-.1.009-.15.029l-4.28 1.582-4.33-1.529a1.602 1.602 0 00-1.008-.003L3.257 4.271a.808.808 0 00-.507.748v8.718a.404.404 0 00.553.374l4.28-1.582 4.33 1.528c.327.109.681.11 1.008.004l3.822-1.33a.807.807 0 00.507-.747V3.266a.403.403 0 00-.403-.403zm-8.458 1.47l3.222 1.138v7.198l-3.222-1.137V4.333zm-4.43 8.247V5.306l3.222-1.121v7.204l-.016.006-3.206 1.185zm12.082-.884l-3.222 1.121V5.613l.016-.006 3.206-1.185v7.274zM16.975 15.625H7.7v-.412a.276.276 0 00-.275-.275h-.55a.275.275 0 00-.275.275v.412H3.025a.276.276 0 00-.275.275v.275c0 .151.124.275.275.275H6.6v.412c0 .152.123.275.275.275h.55a.275.275 0 00.275-.275v-.412h9.275a.276.276 0 00.275-.275V15.9a.276.276 0 00-.275-.275z' /%3E%3C/svg%3E");
}
.map-option {
  margin: 0.3em 0 0.3em 0.5em;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0.4em;
  background-color: #eee;
  font-size: 0.8rem;
}
.mapbox-gl-map-options-container .map-options-container {
  display: none;
  padding: 0 0.5em 0.5em 0;
  display: inline-block;
}
.mapbox-gl-map-options-container button {
  display: inline-block;
  vertical-align: top;
}
.icon {
  vertical-align: bottom;
}
.b-tooltip {
  vertical-align: bottom;
}
</style>
