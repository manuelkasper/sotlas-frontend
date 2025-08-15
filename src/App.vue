<template>
  <div id="app">
    <NavBar />
    <keep-alive include="Map">
      <router-view />
    </keep-alive>
    <vue-turnstile v-if="!authenticated" :site-key="siteKey" @verified="turnstileVerified" />
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue'
import VueTurnstile from '@gaviti/vue-turnstile'
import utils from './mixins/utils.js'

// Importing mapstyle mixin here, as it watches turnstileToken on the store and must
// load the mapTilerApiKey from the server, as the token expires after 5 minutes.
// Otherwise if users first visit a non-map page and switch to the map after more
// than 5 minutes, the map will not load.
import mapstyle from './mixins/mapstyle.js'

export default {
  mixins: [utils, mapstyle],
  components: { NavBar, VueTurnstile },
  computed: {
    siteKey () {
      return import.meta.env.VITE_TURNSTILE_SITE_KEY
    }
  },
  methods: {
    turnstileVerified(token) {
      this.$store.commit('setTurnstileToken', token)
    }
  }
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
