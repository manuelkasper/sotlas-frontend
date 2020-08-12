<template>
  <div>
    <div class="level">
      <div class="level-left">
        <b-field grouped group-multiline>
          <FilterInput class="filter-input" v-model="spotFilter" placeholder="Callsign" :is-regex="true" />
          <b-dropdown class="control" v-model="selectedBands" multiple aria-role="list">
            <b-button icon-right="angle-down" slot="trigger">
                Bands {{ selectedBands.length > 0 ? ('(' + selectedBands.length + ')') : '' }}
            </b-button>
            <b-dropdown-item v-for="band in bands" :key="band" :value="band" aria-role="listitem">
              {{ band }}
            </b-dropdown-item>
          </b-dropdown>
          <b-dropdown class="control" v-model="selectedContinentsCS" multiple aria-role="list">
            <b-button icon-right="angle-down" slot="trigger">
                Continents {{ selectedContinentsCS.length > 0 ? ('(' + selectedContinentsCS.length + ')') : '' }}
            </b-button>
            <b-dropdown-item :custom="true" :disabled="true"><strong>Callsign</strong></b-dropdown-item>
            <b-dropdown-item v-for="(continent, code) in continents" :key="'callsign_' + code" :value="'callsign_' + code" aria-role="listitem">
              {{ continent }}
            </b-dropdown-item>
            <b-dropdown-item :separator="true" />
            <b-dropdown-item :custom="true" :disabled="true"><strong>Spotter</strong></b-dropdown-item>
            <b-dropdown-item v-for="(continent, code) in continents" :key="'spotter_' + code" :value="'spotter_' + code" aria-role="listitem">
              {{ continent }}
            </b-dropdown-item>
          </b-dropdown>
          <b-button class="control" @click="clearFilters" :disabled="spotFilter === '' && selectedBands.length === 0 && selectedContinentsCS.length === 0">Clear</b-button>

          <b-field class="control">
            <b-select class="control" v-model="type">
              <option value="all">All</option>
              <option value="onlyP">Only /P</option>
              <option value="onlyActivations">Activations</option>
            </b-select>
            <p class="control">
              <b-button type="is-info" icon-left="info-circle" @click="infoClicked"></b-button>
            </p>
          </b-field>
        </b-field>
      </div>
      <div v-if="!$mq.mobile" class="level-right">
        <LiveFeedIndicator />
      </div>
    </div>

    <RBNSpotsList v-if="!loading && filteredSpots.length > 0" :data="filteredSpots" :infinite="true" />
    <b-loading :active="loading" :is-full-page="false" />

    <p v-if="!loading && filteredSpots.length === 0">No matching spots found.</p>

    <p class="filter-hint">Only RBN spots within the last hour from callsigns registered in the SOTA database are considered.</p>
  </div>
</template>

<script>
import moment from 'moment'
import prefix from '../prefix.js'
import utils from '../mixins/utils.js'
import prefs from '../mixins/prefs.js'
import EventBus from '../event-bus'
import FilterInput from '../components/FilterInput.vue'
import RBNSpotsList from '../components/RBNSpotsList.vue'
import LiveFeedIndicator from '../components/LiveFeedIndicator.vue'

const MAX_SPOT_AGE = 3600000

export default {
  name: 'RBNSpots',
  components: {
    FilterInput, RBNSpotsList, LiveFeedIndicator
  },
  delayScroll: true,
  mixins: [utils, prefs],
  prefs: {
    key: 'rbnSpotsPrefs',
    props: ['spotFilter', 'selectedBands', 'selectedContinentsCS', 'type']
  },
  mounted () {
    this.loadPrefs()

    EventBus.$on('rbnSpot', this.receiveRbnSpot)
    EventBus.$on('rbnSpotHistory', this.receiveRbnSpotHistory)
    this.$store.commit('setRbnFilter', { isActivator: true, maxAge: MAX_SPOT_AGE, viewId: this.viewId })
  },
  destroyed () {
    EventBus.$off('rbnSpot', this.receiveRbnSpot)
    EventBus.$off('rbnSpotHistory', this.receiveRbnSpotHistory)
    this.$store.commit('setRbnFilter', {})
  },
  methods: {
    clearFilters () {
      this.spotFilter = ''
      this.selectedBands = []
      this.selectedContinentsCS = []
    },
    receiveRbnSpot (rbnSpot) {
      if (!this.rbnSpots.find(oldSpot => { return oldSpot._id === rbnSpot._id })) {
        this.rbnSpots.push(rbnSpot)
        this.removeExpiredSpots()
      }
    },
    receiveRbnSpotHistory (rbnSpots, viewId) {
      if (viewId === this.viewId) {
        this.loading = false
        this.rbnSpots = rbnSpots
        this.$root.$emit('triggerScroll')
      }
    },
    removeExpiredSpots () {
      let now = new Date()
      while (this.rbnSpots.length > 0) {
        if ((now - new Date(this.rbnSpots[0].timeStamp)) > MAX_SPOT_AGE) {
          this.rbnSpots.shift()
        } else {
          break
        }
      }
    },
    infoClicked () {
      this.$buefy.dialog.alert({
        message: '<ul>' +
          '<li><strong>All</strong>: All RBN spots within the last hour from callsigns registered in the SOTA database</li>' +
          '<li><strong>Only /P</strong>: As above, but only if the spotted callsign ends with /P</li>' +
          '<li><strong>Activations</strong>: Only callsigns for which a SOTA activation has been spotted within the last three hours, or alerted for the next 24 hours</li>' +
          '</ul>',
        type: 'is-info',
        canCancel: ['escape', 'outside']
      })
    }
  },
  computed: {
    filteredSpots () {
      let filterRegex
      try {
        filterRegex = new RegExp(this.spotFilter, 'i')
      } catch (e) {
        return []
      }
      let activatorCallsigns
      if (this.type === 'onlyActivations') {
        // Prepare Set of activator callsigns for spots/alerts for fast access
        activatorCallsigns = new Set()
        let now = moment()
        this.$store.state.spots.forEach(spot => {
          if (now.diff(spot.timeStamp) < 3 * 3600 * 1000) {
            activatorCallsigns.add(this.homeCallsign(spot.activatorCallsign))
          }
        })
        this.$store.state.alerts.forEach(alert => {
          if (now.diff(alert.dateActivated) > -24 * 3600 * 1000) {
            activatorCallsigns.add(this.homeCallsign(alert.activatorCallsign))
          }
        })
      }

      let callsignContinents = []
      let spotterContinents = []
      this.selectedContinentsCS.forEach(continent => {
        let typeContinent = continent.split(/_/)
        if (typeContinent[0] === 'callsign') {
          callsignContinents.push(typeContinent[1])
        } else if (typeContinent[0] === 'spotter') {
          spotterContinents.push(typeContinent[1])
        }
      })

      return this.rbnSpots.filter(spot => {
        if (this.type === 'onlyP' && !spot.callsign.endsWith('/P')) {
          return false
        } else if (this.type === 'onlyActivations' && !activatorCallsigns.has(this.homeCallsign(spot.callsign))) {
          return false
        }

        if (this.selectedBands.length > 0 && !this.selectedBands.includes(this.bandForFrequency(spot.frequency))) {
          return false
        }

        if (callsignContinents.length > 0 && !callsignContinents.includes(prefix.continentForCallsign(spot.callsign))) {
          return false
        }

        if (spotterContinents.length > 0 && !spotterContinents.includes(prefix.continentForCallsign(spot.spotter))) {
          return false
        }

        return filterRegex.test(spot.callsign)
      })
    },
    bands () {
      return this.allBands()
    },
    continents () {
      return this.allContinents()
    }
  },
  watch: {
    spotFilter () {
      this.savePrefs()
    },
    selectedBands () {
      this.savePrefs()
    },
    selectedContinentsCS () {
      this.savePrefs()
    },
    type () {
      this.savePrefs()
    }
  },
  data () {
    return {
      rbnSpots: [],
      spotFilter: '',
      selectedBands: [],
      selectedContinentsCS: [],
      type: 'onlyActivations',
      loading: true,
      viewId: new Date().getTime()
    }
  }
}
</script>

<style scoped>
.dropdown {
  margin-right: 0.5em;
}
.dropdown + .dropdown {
  margin-left: 0;
}
.b-table >>> .level {
  padding-bottom: 0;
}
.filter-hint {
  font-size: 80%;
  color: #777;
  margin-top: 1.5em;
}
.switch-wrapper {
  display: flex;
  align-items: center;
}
@media (max-width: 768px) {
  .filter-input {
    max-width: 10em;
  }
}
</style>
