<template>
  <span>{{ displayDistance }}</span>
</template>

<script>
export default {
  name: 'DistanceLabel',
  props: {
    distance: Number,
    highPrecision: Boolean
  },
  computed: {
    displayDistance () {
      if (this.$store.state.altitudeUnits === 'ft') {
        if (this.highPrecision && this.distance < (1000 / 3.28084)) {
          return Math.round(this.distance * 3.28084) + ' ft'
        } else {
          return (this.distance * 0.000621371).toFixed(1) + ' mi'
        }
      } else {
        if (this.highPrecision && this.distance < 1000) {
          return Math.round(this.distance) + ' m'
        } else {
          return (this.distance / 1000).toFixed(1) + ' km'
        }
      }
    }
  }
}
</script>
