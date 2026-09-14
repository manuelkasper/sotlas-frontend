<template>
  <b-tag v-if="!type || type === 'NORMAL'" type="is-dark" :class="tagClass">{{ mode.toUpperCase() }}</b-tag>
  <b-tag v-else-if="type === 'QRT'" type="is-warning">{{ type.toUpperCase() }}</b-tag>
  <b-tag v-else-if="type === 'TEST'" type="is-dark" class="test">{{ type.toUpperCase() }}</b-tag>
</template>

<script>
export default {
  name: 'ModeLabel',
  props: {
    mode: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: false
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
/* In the Vue 2 build Bulma's `.tag.is-warning { color: $warning-invert }` (0,2,0)
   happened to come after this scoped `.tag[data-v-…]` (also 0,2,0) and won, so the
   QRT tag rendered 0.7's rgba(#000, .7) on yellow. The Vue 3 bundle orders the
   stylesheets the other way round and the white above wins — white on #ffdd57 is
   barely legible. Pin the production look for that one variant. */
.tag.is-warning {
  color: rgba(0, 0, 0, 0.7);
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
.tag.test {
  background-color: #aaa;
}
</style>
