<template>
  <PageLayout>
    <template v-slot:title><CountryFlag v-if="country" :country="country" class="flag" />{{ callsign }}</template>
    <template v-slot:title-right><CallDatabaseButton :callsign="callsign" /></template>
    <template v-slot:subtitle>
      <div v-if="activator" class="subtitle is-size-7-mobile">
        <div class="activator-info">
          <span><strong>{{ activator.points + activator.bonusPoints }} points</strong><template v-if="activator.bonusPoints > 0"> ({{ activator.bonusPoints }} bonus)</template></span>
          <span v-if="mountainGoats > 0"><b-tooltip class="goat-tooltip" label="mountain goat"><svgicon class="goat-icon" icon="goat" /></b-tooltip> x {{ mountainGoats }}</span>
        </div>
        <div class="activator-info">
          <span><font-awesome-icon :icon="['far', 'chevron-circle-up']" class="faicon" /> {{ activator.summits }} activations<template v-if="activationsThisYear"> ({{ activationsThisYear }} this year)</template></span>
          <span v-if="uniqueSummits"><font-awesome-icon :icon="['far', 'mountains']" class="faicon" /> {{ uniqueSummits }} unique ({{ uniqueSummitsThisYear }} this year)</span>
          <span v-if="numQsos"><font-awesome-icon :icon="['far', 'exchange']" class="faicon" /> {{ numQsos }} QSOs</span>
          <span v-if="associationCount"><font-awesome-icon :icon="['far', 'globe']" class="faicon" /> {{ associationCount }} associations</span>
          <span v-if="activatorSince"><font-awesome-icon :icon="['far', 'history']" class="faicon" /> {{ activatorSince }}</span>
          <LoadingSpinner v-if="activationsLoading" />
        </div>
      </div>
    </template>

    <template>
      <section v-if="recentSpots.length > 0 || $store.state.spots.length === 0" class="section">
        <div class="container">

          <div class="level is-mobile">
            <div class="level-left">
              <h4 class="title is-4">Recent SOTA spots</h4>
            </div>
            <div class="level-right">
              <LiveFeedIndicator />
            </div>
          </div>

          <SpotsList v-if="recentSpots.length > 0" class="auto-width" :data="recentSpots" :callsignLink="false" :paginated="recentSpots.length > 10" />
          <p v-else-if="$store.state.spots.length === 0"><b-loading :active="true" :is-full-page="false" />Loading...</p>
        </div>
      </section>

      <section v-if="(rbnSpots !== null && rbnSpots.length > 0) || rbnSpots === null" class="section">
        <div class="container">
          <div class="level is-mobile">
            <div class="level-left">
              <h4 class="title is-4">Recent RBN spots</h4>
            </div>
            <div class="level-right">
              <LiveFeedIndicator />
            </div>
          </div>

          <RBNSpotsList v-if="rbnSpots !== null && rbnSpots.length > 0" class="auto-width" :data="rbnSpots" :callsignLink="false" :paginated="rbnSpots.length > 10" />
          <p v-else-if="rbnSpots === null"><b-loading :active="true" :is-full-page="false" />Loading...</p>
        </div>
      </section>

      <section v-if="alerts.length > 0" class="section">
        <div class="container">
          <h4 class="title is-4">Alerts</h4>

          <AlertsList v-if="alerts.length > 0" class="auto-width" :data="alerts" :callsignLink="false" :paginated="alerts.length > 10" />
        </div>
      </section>

      <hr v-if="(recentSpots.length > 0 || $store.state.spots.length === 0) || ((rbnSpots !== null && rbnSpots.length > 0) || rbnSpots === null) || alerts.length > 0" />

      <template v-if="activations.length > 0 || activationsLoading">
        <section class="section">
          <div class="container">
            <ActivationCharts v-if="activations.length > 0" :activations="activations" />
            <p class="loading-charts" v-else-if="activationsLoading"><b-loading :active="true" :is-full-page="false" /><font-awesome-icon :icon="['far', 'chart-bar']" /></p>
          </div>
        </section>

        <hr />
      </template>

      <section class="section">
        <div class="container">
          <h4 class="title is-4 logged-act"><span>Logged activations</span><b-button v-if="!notFound" size="is-small" icon-left="map" icon-pack="fas" type="is-info" @click="showMap = !showMap">{{ showMap ? 'Hide' : 'Show' }} Map</b-button></h4>

          <template v-if="activations !== null && activations.length > 0">
            <MiniMap v-if="showMap" class="map" :bounds="activationsMapBounds" :filter="activationsMapFilter" zoom-warning show-inactive-summits />

            <b-field>
              <FilterInput v-model="activationsFilter" :is-regex="true" />
            </b-field>

            <ActivationsList v-if="activations !== null && activations.length > 0" :data="filteredActivations" :infinite="true" :ownCallsign="callsign" />
          </template>

          <b-message v-if="databaseError" type="is-warning" has-icon>
            SOTA database error, try again later.
          </b-message>
          <b-message v-else-if="notFound" type="is-info" has-icon>
            Activator not found in database. Note: new activators (or callsign changes) may take up to 24 hours to propagate to SOTLAS.
          </b-message>
          <b-message v-else-if="!activationsLoading && activations.length === 0" type="is-info" has-icon>
            No activations found.
          </b-message>

          <p v-if="activationsLoading"><b-loading :active="true" :is-full-page="false" />Loading...</p>
        </div>
      </section>
    </template>
  </PageLayout>
</template>

<script>
import moment from 'moment'
import utils from '../mixins/utils.js'
import api from '../mixins/api.js'
import prefix from '../prefix.js'
import EventBus from '../event-bus'
import PageLayout from '../components/PageLayout.vue'
import ActivationsList from '../components/ActivationsList.vue'
import SpotsList from '../components/SpotsList.vue'
import RBNSpotsList from '../components/RBNSpotsList.vue'
import AlertsList from '../components/AlertsList.vue'
import LiveFeedIndicator from '../components/LiveFeedIndicator.vue'
import FilterInput from '../components/FilterInput.vue'
import MiniMap from '../components/MiniMap.vue'
import ActivationCharts from '../components/ActivationCharts.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import CountryFlag from '../components/CountryFlag.vue'
import CallDatabaseButton from '../components/CallDatabaseButton.vue'

export default {
  name: 'Activator',
  props: {
    callsign: String
  },
  delayScroll: true,
  components: {
    PageLayout, ActivationsList, SpotsList, RBNSpotsList, AlertsList, LiveFeedIndicator, FilterInput, MiniMap, ActivationCharts, LoadingSpinner, CountryFlag, CallDatabaseButton
  },
  mixins: [utils, api],
  computed: {
    mountainGoats () {
      if (!this.activator) {
        return 0
      }
      return Math.floor((this.activator.points + this.activator.bonusPoints) / 1000)
    },
    numQsos () {
      if (this.activations.length === 0) {
        return null
      }

      let qsos = 0
      this.activations.forEach(activation => {
        qsos += activation.qsos
      })
      return qsos
    },
    recentSpots () {
      let myCallsign = this.homeCallsign(this.callsign)
      return this.$store.state.spots.filter(spot => {
        return (this.homeCallsign(spot.activatorCallsign) === myCallsign)
      })
    },
    filteredActivations () {
      if (this.filter === '') {
        return this.activations
      }
      try {
        let filterRegex = new RegExp(this.activationsFilter, 'i')
        return this.activations.filter(activation => {
          return filterRegex.test(activation.summit.code) || filterRegex.test(activation.summit.name)
        })
      } catch (e) {
        return []
      }
    },
    alerts () {
      let myCallsign = this.homeCallsign(this.callsign)
      return this.$store.state.alerts.filter(alert => {
        return (this.homeCallsign(alert.activatorCallsign) === myCallsign)
      })
    },
    activatorSince () {
      if (this.activations.length === 0) {
        return null
      }

      let firstActivationDate = this.activations.map(activation => activation.date).reduce((acc, date) => {
        if (date < acc) {
          return date
        }
        return acc
      })
      let now = moment.utc()
      let then = moment.utc(firstActivationDate)
      let months = now.diff(then, 'months')

      if (months < 12) {
        return months + ' months'
      } else {
        let years = Math.floor(months / 12)
        months %= 12
        let since = years + (years > 1 ? ' years' : ' year')
        if (months > 0) {
          since += ', ' + months + (months > 1 ? ' months' : ' month')
        }
        return since
      }
    },
    activationsThisYear () {
      if (this.activations.length === 0) {
        return null
      }

      let now = moment.utc()
      let activations = 0
      this.activations.forEach(activation => {
        if (!now.isSame(activation.date, 'year')) {
          return
        }

        activations++
      })
      return activations
    },
    uniqueSummits () {
      if (this.activations.length === 0) {
        return null
      }

      let summits = new Set()
      this.activations.forEach(activation => {
        summits.add(activation.summit.code)
      })

      return summits.size
    },
    uniqueSummitsThisYear () {
      if (this.activations.length === 0) {
        return null
      }

      let summits = new Set()
      let summitsPreviousYears = new Set()
      let now = moment.utc()
      this.activations.forEach(activation => {
        summits.add(activation.summit.code)
        if (!now.isSame(activation.date, 'year')) {
          summitsPreviousYears.add(activation.summit.code)
        }
      })

      return summits.size - summitsPreviousYears.size
    },
    country () {
      return prefix.isoCodeForCallsign(this.callsign)
    },
    associationCount () {
      if (this.activations.length === 0) {
        return null
      }

      let associations = new Set()
      this.activations.forEach(activation => {
        associations.add(activation.summit.code.substring(0, activation.summit.code.indexOf('/')))
      })
      return associations.size
    },
    activationsMapBounds () {
      let minLat, minLon, maxLat, maxLon
      this.activations.forEach(activation => {
        if (!minLat || activation.summit.coordinates.latitude < minLat) {
          minLat = activation.summit.coordinates.latitude
        }
        if (!maxLat || activation.summit.coordinates.latitude > maxLat) {
          maxLat = activation.summit.coordinates.latitude
        }
        if (!minLon || activation.summit.coordinates.longitude < minLon) {
          minLon = activation.summit.coordinates.longitude
        }
        if (!maxLon || activation.summit.coordinates.longitude > maxLon) {
          maxLon = activation.summit.coordinates.longitude
        }
      })

      // Some padding
      let latDiff = maxLat - minLat
      let lonDiff = maxLon - minLon
      minLat -= (latDiff * 0.05)
      maxLat += (latDiff * 0.05)
      minLon -= (lonDiff * 0.05)
      maxLon += (lonDiff * 0.05)

      minLat = Math.max(Math.min(minLat, 90), -90)
      maxLat = Math.max(Math.min(maxLat, 90), -90)
      minLon = Math.max(Math.min(minLon, 180), -180)
      maxLon = Math.max(Math.min(maxLon, 180), -180)

      return [[minLon, minLat], [maxLon, maxLat]]
    },
    activationsMapFilter () {
      let summits = new Set()
      this.activations.forEach(activation => {
        summits.add(activation.summit.code)
      })
      return ['in', 'code', ...summits]
    }
  },
  watch: {
    callsign () {
      this.updateCallsign()
    }
  },
  methods: {
    receiveRbnSpot (rbnSpot) {
      if (rbnSpot.homeCallsign === this.callsign) {
        if (this.rbnSpots === null) {
          this.rbnSpots = []
        }
        if (!this.rbnSpots.find(oldSpot => { return oldSpot._id === rbnSpot._id })) {
          this.rbnSpots.push(rbnSpot)
        }
      }
    },
    receiveRbnSpotHistory (rbnSpots, viewId) {
      if (viewId === this.viewId) {
        this.rbnSpots = rbnSpots
      }
    },
    updateCallsign () {
      if (this.homeCallsign(this.callsign, false) !== this.callsign) {
        this.$router.replace('/activators/' + this.homeCallsign(this.callsign, false))
        return
      }

      document.title = this.callsign + ' - SOTLAS'
      this.activationsLoading = true
      this.activations = []
      this.rbnSpots = null
      this.activator = null
      this.notFound = false
      this.databaseError = false

      let loads = []
      this.loadActivator(this.callsign)
        .then(activator => {
          if (activator) {
            this.activator = activator
            if (this.activator && this.activator.callsign !== this.callsign) {
              this.$router.replace('/activators/' + this.activator.callsign)
              return
            }

            this.loadActivations(this.callsign)
              .then(activations => {
                this.activations = activations
                this.activationsLoading = false

                if (this.activations && this.activations.length) {
                  // Recalculate points
                  let points = 0
                  let bonusPoints = 0
                  this.activations.forEach(activation => {
                    points += activation.points
                    bonusPoints += activation.bonus
                  })
                  this.activator.points = points
                  this.activator.bonusPoints = bonusPoints
                  this.activator.summits = this.activations.length
                }
              })
              .catch(() => {
                this.databaseError = true
                this.activationsLoading = false
              })
          }
        })
        .catch(error => {
          this.activationsLoading = false
          if (error.response && error.response.status === 404) {
            this.notFound = true
          }
        })

      Promise.all(loads)
        .then(() => {
          this.$root.$emit('triggerScroll')
        })

      this.$store.commit('setRbnFilter', { homeCallsign: this.homeCallsign(this.callsign), maxAge: 86400000, viewId: this.viewId })
    }
  },
  mounted () {
    this.updateCallsign()
    EventBus.$on('rbnSpot', this.receiveRbnSpot)
    EventBus.$on('rbnSpotHistory', this.receiveRbnSpotHistory)
  },
  destroyed () {
    this.$store.commit('setRbnFilter', {})
    EventBus.$off('rbnSpot', this.receiveRbnSpot)
    EventBus.$off('rbnSpotHistory', this.receiveRbnSpotHistory)
  },
  data () {
    return {
      activations: [],
      notFound: false,
      databaseError: false,
      rbnSpots: null,
      activationsLoading: true,
      activationsFilter: '',
      activator: null,
      viewId: new Date().getTime(),
      showMap: false
    }
  }
}
</script>

<style scoped>
.b-table >>> .level {
  padding-bottom: 0;
}
.activator-info > span {
  display: inline-block;
}
.activator-info > span::after {
  content: '|';
  color: #ccc;
  padding: 0 0.4em;
}
.activator-info > span:last-child::after {
  content: '';
}
.activator-info .faicon {
  margin-right: 0.1em;
  opacity: 0.5;
}
.logged-act span {
  margin-right: 0.75em;
}
.loading-charts {
  text-align: center;
}
.loading-charts .fa-chart-bar {
  font-size: 6rem;
  color: #ddd;
}
.goat-tooltip {
  vertical-align: -0.25em;
}
.goat-icon {
  width: 1.25em;
  height: 1.25em;
  opacity: 0.35;
}
.title .flag {
  margin-right: 1.1rem;
}
.map {
  width: 100%;
  height: 70vh;
  border: 1px solid #ccc;
  margin-bottom: 2em;
}
</style>
