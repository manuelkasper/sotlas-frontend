<template>
  <b-tag type="is-dark" :class="tagClass">{{ mode.toUpperCase() }}</b-tag>
</template>

<script>
export default {
  name: 'ModeLabel',
  props: {
    mode: {
      type: String,
      required: true
    }
  },
  computed: {
    tagClass () {
      return { ['mode-' + this.mode.toLowerCase()]: true }
    }
  }
}
</script>

<style scoped>
.tag {
  min-width: 3em;
  padding: 0.4em 0.5em;
  color: #fff;
  line-height: 1em;
  height: auto;
}
.tag.mode-cw {
  background-color: #2b4970;
}
.tag.mode-ssb {
  background-color: #a19a36;
}
.tag.mode-fm {
  background-color: #a7385a;
}
</style>
