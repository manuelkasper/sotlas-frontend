<template>
  <footer class="footer">
    <div class="content has-text-centered">
      <div>
        <strong>SOTA Atlas</strong> by Manuel HB9DQM. <router-link to="/about">About</router-link>
      </div>
      <div class="version">
        {{ version }}
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer',
  computed: {
    version () {
      return 'Version ' + COMMITHASH.substring(0, 7)
    }
  }
}
</script>

<style scoped>
.version {
  font-size: 0.8em;
  color: var(--bulma-text-weak);
}
</style>
