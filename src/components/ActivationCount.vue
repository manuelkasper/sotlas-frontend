<template>
  <span :class="activationCountClass" label="activation count" title="activation count">{{ activationCount }}</span>
</template>

<script>
export default {
  name: 'ActivationCount',
  props: {
    activationCount: Number
  },
  computed: {
    activationCountClass () {
      if (this.activationCount !== undefined) {
        return { 'activation-count': true, ['activations-' + this.activationCount]: true }
      } else {
        return null
      }
    }
  }
}
</script>

<style scoped>
.activation-count {
  color: #ccc;
  border-radius: 0.2em;
  padding: 0 0.2em;
  border: 1px solid #ccc;
  margin-left: 0.3em;
}
.activations-0, .activations-1 {
  font-weight: bold;
  color: #ccc124;
  border: 1px solid #ccc124;
}
.activations-2 {
  color: #eaa82b;
  border: 1px solid #eaa82b;
}
.activations-3 {
  color: #a98d59;
  border: 1px solid #a98d59;
}
</style>
