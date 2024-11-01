<template>
  <b-input class="freqinput" :value="value" :disabled="disabled" type="number" inputmode="decimal" placeholder="MHz" lang="en_EN" step="any" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required @input="updateValue" />
</template>

<script>
export default {
  props: {
    value: String,
    disabled: Boolean
  },
  methods: {
    updateValue (value) {
      this.$emit('input', value)
    }
  }
}
</script>

<style scoped>
.freqinput >>> input {
  width: 10em;
}
</style>
