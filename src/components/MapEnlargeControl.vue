<template>
  <div class="mapboxgl-ctrl-group mapboxgl-ctrl">
    <button :class="{ 'enlarge-control': true, 'mapboxgl-ctrl-fullscreen': !isEnlarged, 'mapboxgl-ctrl-shrink': isEnlarged }" type="button" :title="isEnlarged ? 'Shrink' : 'Enlarge'" @click="$emit('enlarge')"><span class="mapboxgl-ctrl-icon"></span></button>
  </div>
</template>

<script>
export default {
  props: {
    isEnlarged: Boolean
  }
}
</script>

<style scoped>
@media (max-width: 768px) {
  .enlarge-control {
    width: 40px;
    height: 40px;
  }
}
</style>
