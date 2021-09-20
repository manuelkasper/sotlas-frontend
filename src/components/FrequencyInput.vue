<template>
  <b-input :value="value" type="number" inputmode="decimal" lang="en_EN" step="any" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required @keydown.native="frequencyKeydown" @input="updateValue" />
</template>

<script>
export default {
  props: {
    value: String
  },
  methods: {
    updateValue (value) {
      this.$emit('input', value)
    },
    frequencyKeydown (event) {
      if (event.keyCode === 188) {
        event.target.value += '.'
        event.preventDefault()
        return false
      }
    }
  }
}
</script>
