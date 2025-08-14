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
        type: 'pie',
        height: 250,
        maxSlices: this.maxSlices
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
@media (max-width: 1216px) {
  :deep(svg.chart) {
    height: 300px;
  }
}
</style>
