<template>
  <div>
    <section class="hero" :class="{ 'is-light': !$mq.dark }">
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
  /* Keep stacked (mobile) row-gap at 0; restore space between title and breadcrumb. */
  --bulma-level-item-spacing: 0;
  column-gap: 1rem;
}
.level-left {
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 0;
}
.level-left > :deep(*) {
  min-width: 0;
  max-width: 100%;
}
@media (max-width: 768px) {
  .level-left + .level-right {
    margin-top: 0;
  }
}
</style>
