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
