<template>
  <b-input :value="value" ref="filter" :placeholder="placeholder" type="search" icon-pack="far" icon="search" :class="{ filter: true, invalid }" :size="size" rounded @input="updateValue" />
</template>

<script>
export default {
  name: 'FilterInput',
  props: {
    value: String,
    size: String,
    placeholder: {
      type: String,
      default: 'Filter'
    },
    isRegex: Boolean
  },
  computed: {
    invalid () {
      if (!this.isRegex) {
        return false
      }

      try {
        RegExp(this.value)
        return false
      } catch (e) {
        return true
      }
    }
  },
  methods: {
    updateValue (value) {
      this.$emit('input', value)
    },
    focus () {
      this.$refs.filter.focus()
    }
  }
}
</script>

<style scoped>
.filter {
  max-width: 20em;
}
.filter.invalid :deep(input) {
  background-color: #ffeeee;
}
</style>
