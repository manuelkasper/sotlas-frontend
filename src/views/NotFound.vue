<template>
  <PageLayout>
    <template v-slot:title>Not Found</template>

    <template>
      <section class="section">
        <div class="container">
          <b-message title="Not Found" type="is-danger">
            The page, summit, association or region that you requested cannot be found.
          </b-message>
        </div>
      </section>
    </template>
  </PageLayout>
</template>

<script>
import PageLayout from '../components/PageLayout.vue'

export default {
  name: 'NotFound',
  components: {
    PageLayout
  },
  mounted () {
    document.title = 'Not Found - SOTLAS'
  }
}
</script>
