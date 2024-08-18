<template>
  <div id="app">
    <NavBar />
    <keep-alive include="Map">
      <router-view />
    </keep-alive>
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue'

export default {
  components: { NavBar }
}
</script>

<style lang="scss">
@import "bulma/sass/utilities/_all";

$link: $blue;

@import "bulma";
@import "buefy/src/scss/buefy";
@import "flagpack/dist/flagpack.css";
@import '@maptiler/sdk/dist/maptiler-sdk.css';
@import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
</style>
