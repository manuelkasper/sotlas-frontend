<template>
  <PageLayout>
    <template v-slot:title>Solar Data</template>
    <template>
      <section class="section">
        <div class="container content">
          <LineChart class="solar-chart" v-if="solarHistory !== null" :data="solarHistory" labelField="dateFormatted" valueField="sfi" valueFieldB="r" name="SFI" nameB="SN" :xIsSeries="true" :regionFill="false" spline="1" height="400" />
          <BarChart class="solar-chart" v-if="solarHistory !== null" :data="solarHistory" labelField="dateFormatted" valueField="k" name="K" :xIsSeries="true" spline="1" height="200" :spaceRatio="0.5" :colors="['blue']" />
        </div>
      </section>
    </template>
  </PageLayout>
</template>

<script>
import axios from 'axios'
import moment from 'moment'

import PageLayout from '../components/PageLayout.vue'
import LineChart from '../components/LineChart.vue'
import BarChart from '../components/BarChart.vue'

export default {
  name: 'SolarHistory',
  components: { PageLayout, LineChart, BarChart },
  methods: {
    loadHistory () {
      // Fetch data from last 30 days
      axios.get('https://api.sotl.as/solardata/history/720')
        .then(response => {
          this.loadingComponent.close()

          // Average data per day
          let dataPerDay = {}
          response.data.forEach(ent => {
            if (!dataPerDay[ent.date]) {
              dataPerDay[ent.date] = {
                sfi: ent.sfi,
                r: ent.r,
                k: ent.k,
                count: 1
              }
            } else {
              dataPerDay[ent.date].sfi += ent.sfi
              dataPerDay[ent.date].r += ent.r
              dataPerDay[ent.date].k += ent.k
              dataPerDay[ent.date].count++
            }
          })

          let chartData = []
          Object.entries(dataPerDay).forEach(([date, ent]) => {
            chartData.push({
              date,
              dateFormatted: moment.utc(date).format('D MMM'),
              sfi: Math.round(ent.sfi / ent.count),
              r: Math.round(ent.r / ent.count),
              k: Math.round(ent.k / ent.count)
            })
          })

          this.solarHistory = chartData.sort((a, b) => {
            if (a.date < b.date) {
              return -1
            } else if (a.date > b.date) {
              return 1
            } else {
              return 0
            }
          })
        })

      this.loadingComponent = this.$buefy.loading.open({ canCancel: true })
    }
  },
  mounted () {
    document.title = 'Solar Data History - SOTLAS'

    this.loadHistory()
  },
  data () {
    return {
      solarHistory: null
    }
  }
}
</script>
