<template>
  <b-input :value="value" type="number" inputmode="decimal" lang="en_EN" step="any" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required @input="updateValue" />
</template>

<script>
export default {
  props: {
    value: String
  },
  methods: {
    updateValue (value) {
      this.$emit('input', value)
    }
  }
}
</script>
