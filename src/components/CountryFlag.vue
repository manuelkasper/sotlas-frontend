<template>
  <img
    v-if="src"
    :src="src"
    :alt="label"
    :title="label"
    :class="iconClass"
  >
  <span
    v-else
    :class="iconClass"
    :title="label"
    :aria-label="label"
  />
</template>

<script>
import { flagLabel, flagUrl } from '../flagpack.js'

export default {
  name: 'CountryFlag',
  props: {
    country: {
      type: [String, null],
      default: ''
    },
    rounded: {
      type: Boolean,
      default: true
    },
    shadow: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    src () {
      return flagUrl(this.country)
    },
    iconClass () {
      return { fp: true, 'fp-rounded': this.rounded, 'fp-shadow': this.shadow, unknown: !this.src }
    },
    label () {
      return flagLabel(this.country)
    }
  }
}
</script>

<style scoped>
.fp {
  display: inline-block;
  height: 1em;
  width: calc(4em / 3);
  vertical-align: -0.15em;
  object-fit: cover;
}
.fp-rounded {
  border-radius: 0.166em;
}
.fp-shadow {
  box-shadow: 0 2px 3px 0 rgba(0,0,0,.1);
}
.fp.unknown {
  background-color: var(--bulma-scheme-main-ter);
}
</style>
