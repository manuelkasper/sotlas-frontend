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
    name: String,
    maxSlices: {
      type: Number,
      default: 8
    }
  },
  methods: {
    updateChart () {
      let labels = []
      let values = []
      this.data.forEach(row => {
        labels.push(row[this.labelField])
        values.push(row[this.valueField])
      })

      this.chart = new Chart(this.$refs.chart, {
        data: {
          labels,
          datasets: [{
            values,
            name: this.name
          }]
        },
        type: 'percentage',
        height: 150,
        maxSlices: this.maxSlices,
        barOptions: {
          depth: 1
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
:deep(.graph-svg-tip .title) {
  color: #fff;
}
</style>
