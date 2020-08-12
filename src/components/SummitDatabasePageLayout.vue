<template>
  <div>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <div class="level">
            <div class="level-left">
              <slot name="title"></slot>
            </div>
            <div class="level-right">
              <Breadcrumb :association="association" :region="region" :summit="summit" />
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
import Breadcrumb from '../components/Breadcrumb.vue'
import Footer from '../components/Footer.vue'

export default {
  name: 'SummitDatabasePageLayout',
  components: {
    Breadcrumb, Footer
  },
  props: {
    association: Object,
    region: Object,
    summit: Object,
    query: String
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
