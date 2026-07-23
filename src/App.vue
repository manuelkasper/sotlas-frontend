<template>
  <div id="app">
    <NavBar />
    <router-view v-slot="{ Component }">
      <keep-alive include="Map">
        <component :is="Component" />
      </keep-alive>
    </router-view>
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
@use "bulma/versions/bulma-no-dark-mode";

// The Vue2/Bulma 0.7 build overrode $link to $blue (hsl(217, 71%, 53%)). Bulma 1.0's
// prebuilt "no-dark-mode" entry point doesn't support Sass `with()` color overrides
// (see src/mapgl/README.md-style rationale: it's a CSS-custom-property theme, not a
// Sass module we can reconfigure), so the equivalent override is done via the
// --bulma-link-* custom properties instead. Values confirmed against
// node_modules/bulma/{sass/utilities/initial-variables.sass (0.7.5, via `npm pack`),
// css/versions/bulma-no-dark-mode.css (1.0.4)}.
:root {
  --bulma-link-h: 217deg;
  --bulma-link-s: 71%;
  --bulma-link-l: 53%;
  --bulma-link-on-scheme-l: 53%;
  // Bulma 0.7.5's default $red (is-danger) was hsl(348, 100%, 61%); Bulma 1.0's default
  // --bulma-danger-l is 70%, which is what made the Clear button (type="is-danger")
  // look different after the migration. Hue/saturation already match (348deg/100%).
  --bulma-danger-l: 61%;
}

$fp-enable-1x1: false;
$fp-4x3-path: "../node_modules/flagpack/flags/4x3/";

@import "buefy/src/scss/buefy";
@import "flagpack/src/flagpack.scss";
@import '@maptiler/sdk/dist/maptiler-sdk.css';
@import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
</style>
