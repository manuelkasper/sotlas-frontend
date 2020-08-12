<template>
  <div>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <div class="level is-mobile">
            <div class="level-left">
              <h1 class="title is-size-1 is-size-3-mobile">
                <slot name="title"></slot>
              </h1>
            </div>
            <div class="level-right">
              <slot name="title-right"></slot>
            </div>
          </div>
        </div>
        <div class="container">
          <slot name="subtitle"></slot>
        </div>
      </div>
    </section>

    <slot></slot>

    <Footer />
  </div>
</template>

<script>
import Footer from '../components/Footer.vue'

export default {
  name: 'PageLayout',
  components: {
    Footer
  },
  computed: {
    query () {
      return this.$route.query.q
    }
  }
}
</script>

<style scoped>
.level {
  align-items: start;
}
@media (max-width: 768px) {
  .level-left + .level-right {
    margin-top: 0;
  }
}
</style>
