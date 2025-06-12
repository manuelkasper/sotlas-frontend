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
    height: {
      type: [String, Number],
      default: 250
    },
    spaceRatio: {
      type: Number,
      default: 0.3
    },
    yMarkers: {
      type: Array
    },
    stacked: Boolean,
    colors: Array,
    yAxisMode: {
      type: String,
      default: 'span'
    }
  },
  methods: {
    updateChart () {
      let labels = []
      let values = []
      let valuesB = []
      this.data.forEach(row => {
        // Note: Frappe Charts needs string labels to correctly deal with the situation when there is not enough space for all labels
        labels.push(row[this.labelField].toString())
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
          datasets: datasets,
          yMarkers: this.yMarkers
        },
        type: 'bar',
        height: parseInt(this.height),
        colors: this.colors,
        barOptions: {
          spaceRatio: this.spaceRatio,
          stacked: this.stacked
        },
        axisOptions: {
          xAxisMode: 'tick',
          xIsSeries: this.xIsSeries,
          yAxisMode: this.yAxisMode
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
