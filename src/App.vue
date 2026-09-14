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
  // Bulma 1.0's .button.is-danger takes its text color from --bulma-button-color-l,
  // which resolves to --bulma-danger-invert-l — a FIXED 5% lightness (near-black),
  // unrelated to --bulma-danger-l above (confirmed in bulma-no-dark-mode.css: every
  // *-invert-l is a constant lookup into the same lightness scale, not a function of
  // the base color). Bulma 0.7 always used white text on danger buttons; pin it back.
  --bulma-danger-invert-l: 100%;
  // Bulma 1.0 tints its whole greyscale (text, borders, backgrounds, shadows) with a
  // blue cast: --bulma-scheme-h/-s = 221deg/14% and the same for --bulma-text-h/-s
  // and --bulma-shadow-h/-s, giving body text rgb(64,70,84) and borders rgb(214,217,224).
  // Bulma 0.7's greys were neutral ($grey-dark #4a4a4a, $grey-lighter #dbdbdb,
  // $background whitesmoke...). The lightness stops already match 0.7 (text 29%,
  // text-strong 21%, text-weak 48%, border 86%, background 96%), so zeroing the
  // saturation is enough to restore the exact 0.7 values site-wide; hue is then moot.
  // Measured on sotl.as (Vue2) vs. this branch before/after, see the PR.
  --bulma-scheme-s: 0%;
  --bulma-text-s: 0%;
  --bulma-shadow-s: 0%;
}

$fp-enable-1x1: false;
$fp-4x3-path: "../node_modules/flagpack/flags/4x3/";

@import "buefy/src/scss/buefy";
@import "flagpack/src/flagpack.scss";
@import '@maptiler/sdk/dist/maptiler-sdk.css';
@import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
</style>
