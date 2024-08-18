<template>
  <div class="maplibregl-ctrl-group maplibregl-ctrl">
    <button :class="{ 'enlarge-control': true, 'maplibregl-ctrl-fullscreen': !isEnlarged, 'maplibregl-ctrl-shrink': isEnlarged }" type="button" :title="isEnlarged ? 'Shrink' : 'Enlarge'" @click="$emit('enlarge')"><span class="maplibregl-ctrl-icon"></span></button>
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
