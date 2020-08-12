<template>
  <div>
    <div class="level">
      <div class="level-left">
        <b-field grouped group-multiline>
          <FilterInput class="control" v-model="spotFilter" placeholder="Summit or callsign" :is-regex="true" />
          <b-dropdown class="control" v-model="selectedBands" multiple aria-role="list">
            <b-button icon-right="angle-down" slot="trigger">
                Bands {{ selectedBands.length > 0 ? ('(' + selectedBands.length + ')') : '' }}
            </b-button>
            <b-dropdown-item v-for="band in bands" :key="band" :value="band" aria-role="listitem">
              {{ band }}
            </b-dropdown-item>
          </b-dropdown>
          <b-dropdown class="control" v-model="selectedModes" multiple aria-role="list">
            <b-button icon-right="angle-down" slot="trigger">
                Modes {{ selectedModes.length > 0 ? ('(' + selectedModes.length + ')') : '' }}
            </b-button>
            <b-dropdown-item v-for="(mode, key) in modes" :key="key" :value="key" aria-role="listitem">
              {{ mode }}
            </b-dropdown-item>
          </b-dropdown>
          <b-dropdown class="control" v-model="selectedContinents" multiple aria-role="list">
            <b-button icon-right="angle-down" slot="trigger">
                Continents {{ selectedContinents.length > 0 ? ('(' + selectedContinents.length + ')') : '' }}
            </b-button>
            <b-dropdown-item v-for="(continent, code) in continents" :key="code" :value="code" aria-role="listitem">
              {{ continent }}
            </b-dropdown-item>
          </b-dropdown>
          <b-button class="control" @click="clearFilters" :disabled="spotFilter === '' && selectedBands.length === 0 && selectedModes.length === 0 && selectedContinents.length === 0">Clear</b-button>
          <b-button class="control" :class="unmuted ? 'unmuted' : ''" icon-pack="fas" :icon-right="unmuted ? 'volume' : 'volume-mute'" @click="unmuted = !unmuted" title="Play sound on new spot"></b-button>
        </b-field>
      </div>
      <div v-if="!$mq.mobile" class="level-right">
        <LiveFeedIndicator />
      </div>
    </div>

    <SpotsList v-if="filteredSpots.length > 0" :data="filteredSpots" :infinite="true" />
    <b-loading v-if="$store.state.spots.length === 0" :active="true" :is-full-page="false" />

    <p v-else-if="filteredSpots.length === 0">No matching spots found.</p>
  </div>
</template>

<script>
import utils from '../mixins/utils.js'
import prefs from '../mixins/prefs.js'
import FilterInput from '../components/FilterInput.vue'
import SpotsList from '../components/SpotsList.vue'
import LiveFeedIndicator from '../components/LiveFeedIndicator.vue'
import EventBus from '../event-bus'

export default {
  name: 'SotaSpots',
  components: {
    FilterInput, SpotsList, LiveFeedIndicator
  },
  mixins: [utils, prefs],
  prefs: {
    key: 'spotsPrefs',
    props: ['spotFilter', 'selectedBands', 'selectedModes', 'selectedContinents', 'unmuted']
  },
  mounted () {
    EventBus.$on('sotaSpot', this.receiveSotaSpot)
  },
  destroyed () {
    EventBus.$off('sotaSpot', this.receiveSotaSpot)
  },
  methods: {
    clearFilters () {
      this.spotFilter = ''
      this.selectedBands = []
      this.selectedModes = []
      this.selectedContinents = []
    },
    receiveSotaSpot (spot) {
      if (this.unmuted && !this.soundedSpotIds.has(spot.id) && this.filterSpot(spot)) {
        this.soundedSpotIds.add(spot.id)
        this.spotSound.play()
          .catch(e => {
            console.error(`Cannot play sound: ${e}`)
            if (!this.soundWarningShown) {
              this.$buefy.snackbar.open({
                message: 'Could not play sound on new spot. Make sure auto-play is set to always allowed for this page in browser settings.',
                type: 'is-warning',
                position: 'is-top',
                actionText: 'OK',
                indefinite: true
              })
              this.soundWarningShown = true
            }
          })
      }
    },
    filterSpot (spot) {
      if (this.selectedModes.length > 0 && !this.selectedModes.includes(spot.mode.toLowerCase())) {
        return false
      }
      if (this.selectedBands.length > 0 && !this.selectedBands.includes(this.bandForFrequency(spot.frequency))) {
        return false
      }
      if (this.selectedContinents.length > 0 && !this.selectedContinents.includes(spot.summit.continent)) {
        return false
      }

      if (this.spotFilter === '') {
        return true
      }

      return ((spot.summit.code && this.filterRegex.test(spot.summit.code)) ||
              (spot.summit.name && this.filterRegex.test(spot.summit.name)) ||
              this.filterRegex.test(spot.activatorCallsign))
    }
  },
  computed: {
    filteredSpots () {
      if (this.spotFilter === '' && this.selectedModes.length === 0 && this.selectedBands.length === 0 && this.selectedContinents.length === 0) {
        return this.$store.state.spots
      } else {
        try {
          return this.$store.state.spots.filter(this.filterSpot)
        } catch (e) {
          return []
        }
      }
    },
    bands () {
      return this.allBands()
    },
    continents () {
      return this.allContinents()
    },
    modes () {
      return this.allModes()
    },
    filterRegex () {
      return new RegExp(this.spotFilter, 'i')
    },
    spotSound () {
      return new Audio(require('../assets/sota.mp3'))
    }
  },
  data () {
    return {
      spotFilter: '',
      selectedBands: [],
      selectedModes: [],
      selectedContinents: [],
      soundedSpotIds: new Set(),
      unmuted: false
    }
  }
}
</script>

<style scoped>
.dropdown + .dropdown {
  margin-left: 0;
}
.button.unmuted >>> .icon {
  color: #1496ed;
}
</style>
