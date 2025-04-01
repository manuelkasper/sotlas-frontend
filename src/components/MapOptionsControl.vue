<template>
  <div :class="{ 'maplibregl-ctrl-group': true, 'maplibregl-ctrl': true, 'maplibre-gl-map-options-container': true }">
    <b-tooltip class="info-tooltip" type="is-info" position="is-right" :active="!infoTooltipShown" always animated multilined label="Webcams and more available – open map options to see!">
      <button :class="{ 'maplibregl-ctrl-icon': true, 'maplibre-gl-map-options': true }" type="button" title="Map options" @click="openCloseMapOptions" />
    </b-tooltip>
    <div v-if="open" class="map-options-container">
      <div class="map-option">
        <b-field grouped>
          <b-select v-model="mapType" size="is-small">
            <option v-for="(attrs, type) in mapTypes" :key="type" :value="type">{{ attrs.name }}</option>
          </b-select>
        </b-field>
      </div>
      <div class="map-option">
        <b-field grouped>
          <b-checkbox v-model="mapOptions.regions" size="is-small" @input="setMapOption('regions', $event)">Regions</b-checkbox>
        </b-field>
        <b-field v-if="mapTypes[mapType].contours" grouped>
          <b-checkbox v-model="mapOptions.contours" size="is-small" @input="setMapOption('contours', $event)">Contour lines</b-checkbox>
        </b-field>
        <b-field v-if="mapTypes[mapType].hillshading" grouped>
          <b-checkbox v-model="mapOptions.hillshading" size="is-small" @input="setMapOption('hillshading', $event)">Hillshading</b-checkbox>
        </b-field>
        <b-field grouped>
          <b-checkbox v-model="mapOptions.az" size="is-small" @input="setMapOption('az', $event)">
            Activation zones
            <b-icon pack="fas" icon="info-circle" size="is-small" type="is-info" @click.native="showActivationZoneInfo" />
          </b-checkbox>
        </b-field>
        <b-field v-if="mapTypes[mapType].snow_depth" grouped>
          <b-checkbox v-model="mapOptions.snow_depth" size="is-small" @input="setMapOption('snow_depth', $event)">Snow depth</b-checkbox>
        </b-field>
      </div>
      <div class="map-option" v-if="mapTypes[mapType].difficulty">
        <b-field grouped>
          <b-checkbox v-model="mapOptions.difficulty" size="is-small" @input="setMapOption('difficulty', $event)">
            Hiking difficulty
            <b-icon pack="fas" icon="info-circle" size="is-small" type="is-info" @click.native="showHikingDifficultyInfo" />
          </b-checkbox>
        </b-field>
        <b-field v-if="mapTypes[mapType].skiing" grouped>
          <b-checkbox v-model="mapOptions.skiing" size="is-small" @input="setMapOption('skiing', $event)">Ski routes</b-checkbox>
        </b-field>
        <b-field v-if="mapTypes[mapType].snowshoe" grouped>
          <b-checkbox v-model="mapOptions.snowshoe" size="is-small" @input="setMapOption('snowshoe', $event)">Snowshoe routes</b-checkbox>
        </b-field>
        <b-field v-if="mapTypes[mapType].slope_classes" grouped>
          <b-checkbox v-model="mapOptions.slope_classes" size="is-small" @input="setMapOption('slope_classes', $event)">Slope classes over 30°</b-checkbox>
        </b-field>
        <b-field v-if="mapTypes[mapType].wildlife" grouped>
          <b-checkbox v-model="mapOptions.wildlife" size="is-small" @input="setMapOption('wildlife', $event)">Wildlife reserves and areas</b-checkbox>
        </b-field>
      </div>
      <div class="map-option">
        <b-field grouped>
          <b-checkbox v-model="mapOptions.spots" size="is-small" @input="setMapOption('spots', $event)">Recent spots</b-checkbox>
        </b-field>
        <b-field class="alert-days" grouped>
          <b-checkbox v-model="mapOptions.alerts" size="is-small" @input="setMapOption('alerts', $event)">Alerts for next</b-checkbox>
          <b-input v-model="mapOptions.alertDays" size="is-small" type="number" min="1" :disabled="!mapOptions.alerts" @input="setMapOption('alertDays', $event)" />
          <div class="tlabel">day(s)</div>
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
const MAX_ALERT_AGE = 3 * 60 * 60 * 1000

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
    alerts () {
      let now = moment.utc()
      return this.$store.state.alerts.filter(alert => {
        let alertAge = now.diff(alert.dateActivated)
        return (alertAge < MAX_ALERT_AGE && -alertAge <= this.mapOptions.alertDays * 24 * 60 * 60 * 1000)
      }).map(alert => {
        return alert.summit.code
      })
    },
    mapType: {
      get () {
        if (!this.mapTypes[this.$store.state.mapType]) {
          return Object.keys(this.mapTypes)[0]
        } else {
          return this.$store.state.mapType
        }
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
    alerts: {
      handler () {
        this.updateAlerts()
      },
      immediate: true
    },
    mapOptions: {
      handler () {
        this.updateRecentSpots()
        this.updateAlerts()
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
    updateAlerts () {
      if (this.mapOptions.alerts) {
        this.map.setFilter('summits_highlight_alerts', ['in', 'code', ...this.alerts])
      } else {
        this.map.setFilter('summits_highlight_alerts', ['in', 'code'])
      }
    },
    spotsShown () {
      return this.mapOptions.spots
    },
    alertsShown () {
      return this.mapOptions.alerts
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
        message: '<p style="margin-bottom: 0.5em">Activation zone boundaries are currently available for the following associations/regions:</p><ul><li style="margin-bottom: 0.5em"><strong>HB/HB0</strong><br />Calculated using <a href="https://www.swisstopo.admin.ch/de/geodata/height/alti3d.html" target="_blank">swissALTI3D</a> data from swisstopo (spatial resolution 0.5 m, accuracy ± 0.3 – 3 m (1σ) depending on the region).</li><li style="margin-bottom: 0.5em"><strong>OE</strong><br />Calculated using <a href="https://data.bev.gv.at/geonetwork/srv/ger/catalog.search;jsessionid=1F5F6A9D0278E6871FEDB6B87EE0936B#/metadata/eae5f98d-d605-4783-8292-8b913d163cac" target="_blank">BEV ALS DTM</a> data (spatial resolution 1 m, accuracy generally ± 0.5 m, may vary in high altitude).</li><li style="margin-bottom: 0.5em"><strong>W7W</strong><br />Calculated using data from <a href="https://lidarportal.dnr.wa.gov/" target="_blank">Washington State’s Department of Natural Resources public LIDAR portal</a>.</li><li style="margin-bottom: 0.5em"><strong>ZL</strong><br />Based on LiDAR data (generalised to a 4m x 4m grid) where available, or NZSoSDEM 15m contour-derived DEM grid otherwise.</li></ul><hr /><p style="font-size: 0.8em">The activator is always responsible for ensuring that the operation takes place within the activation zone.</p>',
        type: 'is-info',
        hasIcon: true,
        icon: 'info-circle',
        iconPack: 'fas'
      })
    },
    showHikingDifficultyInfo (event) {
      event.preventDefault()
      this.$buefy.dialog.alert({
        title: 'Hiking difficulty',
        message: '<p style="margin-bottom: 0.5em">The hiking difficulty grading uses the <a href="https://www.sac-cas.ch/fileadmin/Ausbildung_und_Wissen/Sicher_unterwegs/Sicher_unterwegs_Wandern/2020_Berg_Alpinwanderskala_EN.pdf" target="_blank">SAC scale</a>. Colors shown are as follows:</p><ul><li><span style="color: #cccc00">Yellow</span>: T1</li><li><span style="color: #cc0000">Red</span>: T2…T3</li><li><span style="color: #3333cc">Blue</span>: T4…T6</li></ul>',
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
.maplibre-gl-map-options {
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
.map-option .field:has(+ .alert-days) {
  margin-bottom: 0.5rem;
}
.map-option .field.alert-days {
  margin-bottom: 0.5rem;
  line-height: 1;
  align-items: center;
}
.map-option div.tlabel {
  display: inline-block;
  font-size: 0.75rem;
}
.map-option .alert-days .control {
  margin-right: 0.5rem !important;
}
.map-option .alert-days .control >>> input {
  width: 5em;
  vertical-align: baseline;
}
.maplibre-gl-map-options-container .map-options-container {
  display: none;
  padding: 0 0.5em 0.5em 0;
  display: inline-block;
}
.maplibre-gl-map-options-container button {
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
