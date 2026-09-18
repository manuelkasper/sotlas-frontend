<template>
  <MglPopup :coordinates="[coordinates.longitude, coordinates.latitude]" max-width="none" @close="$emit('close')">
    <div class="popup-content" data-theme="light">
      <Coordinates :latitude="latitude" :longitude="longitude" show-maidenhead show-elevation />
    </div>
  </MglPopup>
</template>

<script>
import { MglPopup } from '../mapgl'
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
/* Overlay sits on the always-light map; keep native widgets (and Bulma via
   data-theme="light" on the root) on the light scheme so they stay readable. */
.popup-content {
  margin-top: 7px;
  color-scheme: light;
  color: var(--bulma-text);
}
:deep(.coordinates) {
  vertical-align: middle;
  font-weight: bold;
  font-size: 1rem;
}
</style>
