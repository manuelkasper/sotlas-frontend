<template>
    <section class="section" v-if="activations !== null && activations.length > 0">
      <div class="container">
        <div class="columns is-5 is-variable">
          <div class="column is-half">
            <template v-if="myActivations && myActivations.length > 0">
              <h4 class="title is-4">
                My activations
              </h4>

              <LoggedActivationsList :data="myActivations" />
            </template>

            <template v-if="myChases && myChases.length > 0">
              <h4 class="title is-4">
                My chases
              </h4>

              <ChasesList :data="myChases" />
            </template>

            <div class="level">
              <div class="level-left">
                <h4 class="title is-4">
                  Logged activations
                </h4>
              </div>
              <div class="level-right">
                <b-field>
                  <FilterInput v-model="filter" size="is-small" :is-regex="true" />
                </b-field>
              </div>
            </div>

            <LoggedActivationsList :data="filteredActivations" />
          </div>
          <div class="column stats">
            <h4 class="title is-4">
              QSOs per band
            </h4>

            <BarChart v-if="bands" :data="bands" labelField="band" valueField="qsos" name="QSOs" />

            <h4 class="title is-4">
              Activations per year
            </h4>
            <BarChart v-if="activationsPerYear" :data="activationsPerYear" labelField="year" valueField="activations" :xIsSeries="true" name="Activations" />

            <template v-if="activations.length >= 20">
              <h4 class="title is-4">
                Activations per month
              </h4>
              <BarChart v-if="activationsPerMonth" :data="activationsPerMonth" labelField="month" valueField="activations" :xIsSeries="true" name="Activations" />
            </template>
          </div>
          <div class="column" v-if="enableModes">
            <h4 class="title is-4">
              Modes
            </h4>
            <b-table :default-sort="['qsos', 'desc']" :narrowed="true" :striped="true" :data="modes" :mobile-cards="false">
              <template slot-scope="props">
                <b-table-column field="mode" label="Mode" sortable>
                  {{ props.row.mode.toUpperCase() }}
                </b-table-column>
                <b-table-column field="qsos" label="QSOs" sortable numeric>
                  {{ props.row.qsos }}
                </b-table-column>
              </template>
            </b-table>
          </div>
        </div>
      </div>
    </section>
</template>

<script>
import axios from 'axios'
import utils from '../mixins/utils.js'

import FilterInput from '../components/FilterInput.vue'
import BarChart from '../components/BarChart.vue'
import LoggedActivationsList from '../components/LoggedActivationsList.vue'
import ChasesList from '../components/ChasesList.vue'

export default {
  name: 'Activations',
  components: { FilterInput, BarChart, LoggedActivationsList, ChasesList },
  props: {
    summitCode: String,
    activations: Array,
    myActivations: Array,
    myChases: Array
  },
  mixins: [utils],
  mounted () {
    this.loadBandstats()
  },
  watch: {
    summitCode () {
      this.loadBandstats()
    }
  },
  methods: {
    loadBandstats () {
      axios.get('https://api-db2.sota.org.uk/api/bandstats/' + this.summitCode)
        .then(response => {
          this.bandstats = response.data
        })
    }
  },
  computed: {
    filteredActivations () {
      if (!this.filter) {
        return this.activations
      }
      try {
        let regex = new RegExp(this.filter, 'i')
        return this.activations.filter(activation => {
          return regex.test(activation.ownCallsign)
        })
      } catch (e) {
        return []
      }
    },
    bands () {
      const bandOrder = ['160m', '80m', '60m', '40m', '30m', '20m', '17m', '15m', '12m', '10m', '6m', '4m', '2m', '70cm', 'Microwave']
      let statsPerBand = {}
      for (let band of bandOrder) {
        statsPerBand[band] = { band, qsos: 0 }
      }
      for (let bandstat of this.bandstats) {
        if (!statsPerBand[bandstat.wavelength]) {
          statsPerBand[bandstat.wavelength] = { band: bandstat.wavelength, qsos: 0 }
        }
        statsPerBand[bandstat.wavelength].qsos += bandstat.qsos
      }
      return Object.values(statsPerBand).filter(stat => stat.qsos > 0)
    },
    modes () {
      let modeStats = {}
      this.bandstats.forEach(bandstat => {
        Object.keys(bandstat).forEach(key => {
          if (!key.match(/^(ssb|cw|fm|data|am|dv|other)$/)) {
            return
          }

          if (!modeStats[key]) {
            modeStats[key] = 0
          }
          modeStats[key] += bandstat[key]
        })
      })
      let modeStatsArr = []
      Object.keys(modeStats).sort().forEach(mode => {
        modeStatsArr.push({
          mode, qsos: modeStats[mode]
        })
      })
      return modeStatsArr
    },
    activationsPerYear () {
      if (!this.activations) {
        return null
      }

      let years = {}
      let firstYear, lastYear
      this.activations.forEach(activation => {
        let year = activation.activationDate.substring(0, 4)
        if (!years[year]) {
          years[year] = 0
        }
        years[year]++

        if (!firstYear || year < firstYear) {
          firstYear = year
        }
        if (!lastYear || year > lastYear) {
          lastYear = year
        }
      })

      let yearsArr = []
      for (let year = firstYear; year <= lastYear; year++) {
        yearsArr.push({
          year, activations: years[year] || 0
        })
      }

      return yearsArr
    },
    activationsPerMonth () {
      if (!this.activations) {
        return null
      }

      let months = []
      this.activations.forEach(activation => {
        let month = parseInt(activation.activationDate.substring(5, 7))
        if (!months[month]) {
          months[month] = 0
        }
        months[month]++
      })

      let monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      let monthsArr = []
      for (let i = 1; i <= 12; i++) {
        monthsArr.push({
          month: monthNames[i - 1],
          activations: months[i] || 0
        })
      }

      return monthsArr
    }
  },
  data () {
    return {
      bandstats: [],
      filter: '',
      enableModes: false // currently no data from SOTA API
    }
  }
}
</script>

<style scoped>
.filter {
  width: 10em
}
.stats >>> .chart-container {
  margin-bottom: 1em
}
</style>
