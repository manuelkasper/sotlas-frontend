<template>
  <span class="wrapper">
    <span class="coordinates">{{ latitude }}, {{ longitude }}</span>
    <div class="actions">
      <b-field>
        <p class="control">
          <b-dropdown aria-role="list">
            <b-button type="is-info" outlined size="is-small" icon-right="angle-down" slot="trigger">
              Open
            </b-button>

            <b-dropdown-item v-for="action in filteredActions" :key="action.name" :has-link="true" aria-role="listitem"><a :href="action.url()" target="_blank">{{ action.name }}</a></b-dropdown-item>
          </b-dropdown>
        </p>
        <p class="control">
          <b-button type="is-info" outlined size="is-small" v-clipboard:copy="latitude + ',' + longitude" v-clipboard:success="onCopySuccess" v-clipboard:error="onCopyError">Copy</b-button>
        </p>
      </b-field>
    </div>
    <div v-if="showMaidenhead" class="locator">Locator: {{ maidenhead }}</div>
    <div v-if="showElevation" class="elevation">Elevation: <span v-if="elevation"><AltitudeLabel :altitude="elevation" /> (approx.)</span><font-awesome-icon v-else :icon="['far', 'spinner']" spin /></div>
  </span>
</template>

<script>
import Maidenhead from 'maidenhead'
import axios from 'axios'
import AltitudeLabel from './AltitudeLabel.vue'

export default {
  name: 'Coordinates',
  components: { AltitudeLabel },
  props: {
    latitude: Number,
    longitude: Number,
    reference: String,
    showMaidenhead: Boolean,
    showElevation: Boolean
  },
  computed: {
    filteredActions () {
      return this.actions.filter(action => {
        return (action.url() !== null)
      })
    },
    maidenhead () {
      let loc = new Maidenhead(this.latitude, this.longitude, 4)
      return loc.locator
    }
  },
  mounted () {
    this.loadElevation()
  },
  watch: {
    latitude () {
      this.loadElevation()
    },
    longitude () {
      this.loadElevation()
    }
  },
  methods: {
    onCopySuccess () {
      this.$buefy.toast.open({
        message: 'Coordinates copied to clipboard',
        type: 'is-info'
      })
    },
    onCopyError () {
      this.$buefy.toast.open({
        message: 'Could not copy coordinates to clipboard',
        type: 'is-danger'
      })
    },
    loadElevation () {
      this.elevation = null
      if (!this.latitude || !this.longitude || !this.showElevation) {
        return
      }
      axios.post('https://ele.sotl.as/api', [[this.latitude, this.longitude]])
        .then(result => {
          this.elevation = Math.round(result.data[0])
        })
    }
  },
  data () {
    return {
      elevation: null,
      actions: [
        {
          name: 'swisstopo',
          url: () => {
            if (this.latitude >= 45.7 && this.latitude <= 47.85 && this.longitude >= 5.9 && this.longitude <= 10.9) {
              return `https://map.geo.admin.ch/?swisssearch=${this.latitude},${this.longitude}`
            }
            return null
          }
        },
        {
          name: 'BayernAtlas',
          url: () => {
            if (this.latitude >= 47.25 && this.latitude <= 50.6 && this.longitude >= 9.6 && this.longitude <= 13.85) {
              return `https://geoportal.bayern.de/bayernatlas?lon=${this.longitude}&lat=${this.latitude}&zoom=10`
            }
            return null
          }
        },
        {
          name: 'CalTopo',
          url: () => {
            if (this.latitude >= 14 && this.longitude >= -169 && this.longitude <= -52) {
              return `https://caltopo.com/map.html#ll=${this.latitude},${this.longitude}&z=15&b=t&o=f16a%2Cr&n=1,0.25`
            }
            return null
          }
        },
        {
          name: 'OS Maps',
          url: () => {
            if (this.latitude >= 49.8 && this.latitude <= 60 && this.longitude >= -9 && this.longitude <= 2) {
              return `https://osmaps.ordnancesurvey.co.uk/${this.latitude},${this.longitude},15/pin`
            }
            return null
          }
        },
        {
          name: 'Geoportal (HR)',
          url: () => {
            if (this.latitude >= 42.396 && this.latitude <= 46.324 && this.longitude >= 13.789 && this.longitude <= 18.497) {
              return `https://geoportal.dgu.hr/#/?lng={this.longitude}&lat=${this.latitude}&zoom=7`
            }
            return null
          }
        },
        {
          name: 'LocationSA',
          url: () => {
            if (this.latitude >= -38.062 && this.latitude <= -25.957 && this.longitude >= 128.957 && this.longitude <= 140.953) {
              return `http://location.sa.gov.au/viewer/?map=topographic&x=${this.longitude}&y=${this.latitude}&z=17`
            }
            return null
          }
        },
        {
          name: 'SK Geodesy',
          url: () => {
            if (this.latitude >= 47.776 && this.latitude <= 49.534 && this.longitude >= 17.041 && this.longitude <= 22.581) {
              return `https://zbgis.skgeodesy.sk/mkzbgis?bm=zbgis&z=16&c=${this.longitude},${this.latitude}#`
            }
            return null
          }
        },
        {
          name: 'TopoSvalbard',
          url: () => {
            if (this.latitude >= 74.117 && this.latitude <= 80.948 && this.longitude >= 7.338 && this.longitude <= 33.631) {
              return `https://toposvalbard.npolar.no/?lat=${this.latitude}&long={this.longitude}&zoom=8&layer=map`
            }
            return null
          }
        },
        {
          name: 'TopoJanMayen',
          url: () => {
            if (this.latitude >= 70.795 && this.latitude <= 71.175 && this.longitude >= -9.253 && this.longitude <= -7.838) {
              return `https://topojanmayen.npolar.no/?lat=${this.latitude}&long={this.longitude}&zoom=8&layer=map`
            }
            return null
          }
        },
        {
          name: 'Google Maps',
          url: () => {
            return `https://www.google.com/maps/search/?api=1&query=${this.latitude},${this.longitude}`
          }
        },
        {
          name: 'Bing Maps',
          url: () => {
            return `https://www.bing.com/maps?cp=${this.latitude}~${this.longitude}&lvl=15&style=s&v=2`
          }
        },
        {
          name: 'OpenStreetMap',
          url: () => {
            return `https://www.openstreetmap.org/?mlat=${this.latitude}&mlon=${this.longitude}&zoom=16`
          }
        },
        {
          name: 'OpenTopoMap',
          url: () => {
            return `https://www.opentopomap.org/#marker=16/${this.latitude}/${this.longitude}`
          }
        },
        {
          name: 'SummitPost',
          url: () => {
            return `https://www.summitpost.org/object_list.php?object_type=1&distance_lat_1=${this.latitude}&distance_lon_1=${this.longitude}&map_1=1`
          }
        },
        {
          name: 'SOTA Summits',
          url: () => {
            if (this.reference) {
              return `https://summits.sota.org.uk/summit/${this.reference}`
            }
            return null
          }
        },
        {
          name: 'SOTA Map',
          url: () => {
            if (this.reference) {
              return `https://www.sotamaps.org/summit/${this.reference}`
            }
            return null
          }
        },
        {
          name: 'aprs.fi',
          url: () => {
            return `https://aprs.fi/#!lat=${this.latitude}&lng=${this.longitude}&z=14`
          }
        },
        {
          name: 'APRS Direct',
          url: () => {
            return `https://www.aprsdirect.com/center/${this.latitude},${this.longitude}/zoom/14`
          }
        }
      ]
    }
  }
}
</script>

<style scoped>
.wrapper {
  display: inline-block;
}
.coordinates {
  margin-right: 0.75em;
}
.locator {
  color: #777;
}
.actions {
  display: inline-block;
}
</style>
