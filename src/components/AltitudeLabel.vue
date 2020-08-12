<template>
  <span :class="{ altitude: true }">{{ displayAltitude }}</span>
</template>

<script>
export default {
  name: 'AltitudeLabel',
  props: {
    altitude: Number,
    altitudeFt: Number
  },
  computed: {
    displayAltitude () {
      if (this.$store.state.altitudeUnits === 'ft') {
        if (this.altitudeFt) {
          return this.altitudeFt + ' ft'
        } else {
          return Math.round(this.altitude * 3.28084) + ' ft'
        }
      } else {
        return this.altitude + ' m'
      }
    }
  }
}
</script>
