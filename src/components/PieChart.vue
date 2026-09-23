<template>
  <div ref="chart"></div>
</template>

<script>
import { Chart } from 'frappe-charts/src/js/chart'

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
  /* Extra height reveals the association legend that Frappe draws below the
     250px view. Set width too: iOS Safari will otherwise keep the SVG's
     intrinsic aspect ratio and grow wider than the column, which expands
     the page scroll width into blank space on the right. Desktop Safari's
     responsive design mode does not do that. */
  :deep(svg.chart) {
    width: 100%;
    max-width: 100%;
    height: 300px;
  }
}
</style>
