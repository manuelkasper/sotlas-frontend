<template>
  <div>
    <div class="columns is-5 is-variable">
      <div class="column is-half">
        <h4 class="title is-4">Activations per year</h4>
        <BarChart v-if="activationsPerYear" :data="activationsPerYear" labelField="year" valueField="activations" valueFieldB="bonusActivations" name="Activations" nameB="with Bonus" :xIsSeries="true" />
      </div>
      <div class="column is-half">
        <h4 class="title is-4">Activations per association</h4>
        <PieChart v-if="activationsPerAssociation" :data="activationsPerAssociation" labelField="association" valueField="activations" name="Activations" />
      </div>
    </div>
    <div v-if="moreStats" class="columns is-5 is-variable">
      <div class="column is-half">
        <h4 class="title is-4">Activations by altitude</h4>
        <BarChart v-if="activationsPerAltitude" :data="activationsPerAltitude" labelField="altitude" valueField="activations" name="Activations" :xIsSeries="true" />
        <h4 class="title is-4">Activations by month</h4>
        <BarChart v-if="activationsPerMonth" :data="activationsPerMonth" labelField="month" valueField="activations" name="Activations" :xIsSeries="true" />
      </div>
      <div class="column is-half">
        <h4 class="title is-4 no-margin-bottom">Number of QSOs per activation</h4>
        <PercentageChart v-if="qsosPerActivation" :data="qsosPerActivation" labelField="qsos" valueField="activations" name="Activations" :maxSlices="11" />

        <template v-if="modes">
          <h4 class="title is-4 no-margin-bottom">Number of QSOs by mode</h4>
          <PercentageChart :data="modes" labelField="mode" valueField="qsos" name="QSOs" />
        </template>

        <template v-if="bands">
          <h4 class="title is-4 no-margin-bottom">Number of QSOs by band</h4>
          <PercentageChart :data="bands" labelField="band" valueField="qsos" name="QSOs" />
        </template>
      </div>
    </div>
    <div class="more-button" v-else>
      <b-button @click="moreStats = true" type="is-info" icon-left="chart-bar">More stats</b-button>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import utils from '../mixins/utils.js'
import BarChart from '../components/BarChart.vue'
import PieChart from '../components/PieChart.vue'
import PercentageChart from '../components/PercentageChart.vue'

export default {
  props: {
    activations: Array
  },
  mixins: [utils],
  components: {
    BarChart, PieChart, PercentageChart
  },
  computed: {
    activationsPerYear () {
      if (this.activations.length === 0) {
        return null
      }

      let years = {}
      let yearsBonus = {}
      this.activations.forEach(activation => {
        let year = moment.utc(activation.date).year()
        if (!years[year]) {
          years[year] = 0
          yearsBonus[year] = 0
        }
        years[year]++
        if (activation.bonus > 0) {
          yearsBonus[year]++
        }
      })

      return Object.keys(years).sort().map(year => {
        return { year, activations: years[year], bonusActivations: yearsBonus[year] }
      })
    },
    activationsPerMonth () {
      if (this.activations.length === 0) {
        return null
      }

      let months = {}
      this.activations.forEach(activation => {
        let month = moment.utc(activation.date).month()
        if (!months[month]) {
          months[month] = 0
        }
        months[month]++
      })

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return Object.keys(months).sort((a, b) => (a - b)).map(month => {
        return { month: monthNames[month], activations: months[month] }
      })
    },
    activationsPerAssociation () {
      if (this.activations.length === 0) {
        return null
      }

      let associations = {}
      this.activations.forEach(activation => {
        let association = activation.summit.code.substring(0, activation.summit.code.indexOf('/'))
        if (!associations[association]) {
          associations[association] = 0
        }
        associations[association]++
      })

      return Object.keys(associations).sort().map(association => {
        return { association, activations: associations[association] }
      })
    },
    activationsPerAltitude () {
      return this.makeBands(this.activations.map(activation => { return activation.summit.altitude }), 500, ' m', 'altitude', 'activations')
    },
    qsosPerActivation () {
      return this.makeBands(this.activations.map(activation => { return activation.qsos }), 10, '', 'qsos', 'activations', true, 110)
    },
    modes () {
      if (this.activations.length === 0) {
        return null
      }

      let modes = {}
      let totalQsos = 0
      this.activations.forEach(activation => {
        if (activation.modeQsos) {
          Object.keys(activation.modeQsos).forEach(mode => {
            if (!modes[mode]) {
              modes[mode] = 0
            }
            modes[mode] += activation.modeQsos[mode]
          })
        }
        totalQsos += activation.qsos
      })

      let modesArr = []
      let modeQsosSum = 0
      Object.keys(modes).forEach(mode => {
        modesArr.push({ mode: mode.toUpperCase(), qsos: modes[mode] })
        modeQsosSum += modes[mode]
      })
      if (modesArr.length > 0) {
        if (modeQsosSum < totalQsos) {
          modesArr.push({ mode: 'Other', qsos: (totalQsos - modeQsosSum) })
        }
        return modesArr
      } else {
        return null
      }
    },
    bands () {
      if (this.activations.length === 0) {
        return null
      }

      let bands = {}
      this.activations.forEach(activation => {
        if (activation.bandQsos) {
          Object.keys(activation.bandQsos).forEach(band => {
            if (!bands[band]) {
              bands[band] = 0
            }
            bands[band] += activation.bandQsos[band]
          })
        }
      })

      let bandsArr = []
      Object.keys(bands).forEach(band => {
        bandsArr.push({ band, qsos: bands[band] })
      })
      if (bandsArr.length > 0) {
        bandsArr.sort((a, b) => {
          return b.qsos - a.qsos
        })
        return bandsArr
      } else {
        return null
      }
    }
  },
  methods: {
    makeBands (data, interval, suffix, bandKey, valueKey, ranges = false, maxBand) {
      if (!data) {
        return null
      }

      let bands = {}
      let maxValue = 0
      data.forEach(value => {
        let band = Math.ceil(value / interval) * interval
        if (maxBand && band > maxBand) {
          band = maxBand
        }
        if (!bands[band]) {
          bands[band] = 0
        }
        bands[band]++
        if (maxValue < band) {
          maxValue = band
        }
      })

      for (let value = interval; value < maxValue; value += interval) {
        if (bands[value] === undefined) {
          bands[value] = 0
        }
      }

      return Object.keys(bands).sort((a, b) => { return parseInt(a) - parseInt(b) }).map(value => {
        value = parseInt(value)
        let label = '< ' + value + suffix
        if (ranges) {
          if (value === maxBand) {
            label = '> ' + (value - interval) + suffix
          } else {
            label = (value - interval + 1) + '-' + value + suffix
          }
        }
        return { [bandKey]: label, [valueKey]: bands[value] }
      })
    }
  },
  data () {
    return {
      moreStats: false
    }
  }
}
</script>

<style scoped>
.more-button {
  text-align: center;
}
.no-margin-bottom {
  margin-bottom: 0;
}
.stats-teaser {
  text-align: center;
  margin-top: 1em;
}
.stats-teaser div {
  font-size: 1.5rem;
  color: #ccc;
  border: 2px dashed #ccc;
  display: inline-block;
  padding: 0.5em 0.75em;
  border-radius: 0.75em;
}
.stats-teaser .fa-chart-bar {
  font-size: 2rem;
  vertical-align: middle;
  margin-right: 0.3em;
}
</style>
