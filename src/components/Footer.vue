<template>
  <footer class="footer">
    <div class="content has-text-centered">
      <p>
        <strong>SOTA Atlas</strong> by Manuel HB9DQM. <router-link to="/about">About</router-link>
      </p>
      <p class="version">
        {{ version }}
      </p>
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
  color: #777;
}
.content p {
  margin-bottom: 0;
}
</style>
