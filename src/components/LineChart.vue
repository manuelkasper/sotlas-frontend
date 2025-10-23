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
    valueFieldB: String,
    name: String,
    nameB: String,
    xIsSeries: {
      type: Boolean,
      default: false
    },
    animate: {
      type: Boolean,
      default: true
    },
    suffixX: {
      type: String,
      default: ''
    },
    suffixY: {
      type: String,
      default: ''
    },
    height: {
      type: [String, Number],
      default: 250
    },
    spline: {
      type: [String, Number],
      default: 0
    },
    regionFill: {
      type: Boolean,
      default: true
    }
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
        type: 'line',
        height: parseInt(this.height),
        colors: ['red'],
        axisOptions: {
          xAxisMode: 'tick',
          xIsSeries: this.xIsSeries
        },
        lineOptions: {
          hideDots: true,
          regionFill: this.regionFill,
          spline: parseInt(this.spline)
        },
        tooltipOptions: {
          formatTooltipX: d => d + this.suffixX,
          formatTooltipY: d => d + this.suffixY
        },
        animate: this.animate,
        y_axis_exp_based_on_range: true
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
