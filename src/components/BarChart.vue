<template>
  <div ref="chart"></div>
</template>

<script>
import { Chart } from 'frappe-charts/dist/frappe-charts.min.esm'

export default {
  props: {
    data: Array,
    labelField: String,
    valueField: String,
    valueFieldB: String,
    name: String,
    nameB: String,
    xIsSeries: {
      type: Boolean,
      default: false
    },
    stacked: Boolean
  },
  methods: {
    updateChart () {
      let labels = []
      let values = []
      let valuesB = []
      this.data.forEach(row => {
        labels.push(row[this.labelField])
        values.push(row[this.valueField])
      })

      let datasets = [{
        values,
        name: this.name
      }]

      if (this.valueFieldB) {
        this.data.forEach(row => {
          valuesB.push(row[this.valueFieldB])
        })
        datasets.push({
          values: valuesB,
          name: this.nameB
        })
      }

      this.chart = new Chart(this.$refs.chart, {
        data: {
          labels,
          datasets: datasets
        },
        type: 'bar',
        height: 250,
        barOptions: {
          spaceRatio: 0.3,
          stacked: this.stacked
        },
        axisOptions: {
          xAxisMode: 'tick',
          xIsSeries: this.xIsSeries
        }
      })
    }
  },
  watch: {
    data () {
      this.updateChart()
    }
  },
  mounted () {
    this.updateChart()
  }
}
</script>

<style scoped>
>>> .graph-svg-tip .title {
  color: #fff;
}
</style>
