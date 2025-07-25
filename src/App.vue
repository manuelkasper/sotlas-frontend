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
@import "bulma/bulma.sass";

$link: $blue;
$fp-enable-1x1: false;
$fp-4x3-path: "../node_modules/flagpack/flags/4x3/";

@import "buefy/src/scss/buefy";
@import "flagpack/src/flagpack.scss";
@import '@maptiler/sdk/dist/maptiler-sdk.css';
@import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
</style>
