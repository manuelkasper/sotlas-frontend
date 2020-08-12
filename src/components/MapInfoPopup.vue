<template>
  <MglPopup :coordinates="[coordinates.longitude, coordinates.latitude]" :showed="true" @close="$emit('close')">
    <div class="popup-content">
      <Coordinates :latitude="latitude" :longitude="longitude" show-maidenhead show-elevation />
    </div>
  </MglPopup>
</template>

<script>
import { MglPopup } from 'vue-mapbox'
import Coordinates from './Coordinates.vue'

export default {
  name: 'MapInfoPopup',
  props: {
    coordinates: Object
  },
  components: {
    MglPopup, Coordinates
  },
  computed: {
    latitude () {
      return parseFloat(this.coordinates.latitude.toFixed(5))
    },
    longitude () {
      return parseFloat(this.coordinates.longitude.toFixed(5))
    }
  }
}
</script>

<style scoped>
.popup-content {
  margin-top: 7px;
}
>>> .coordinates {
  vertical-align: middle;
  font-weight: bold;
  font-size: 1rem;
}
</style>
