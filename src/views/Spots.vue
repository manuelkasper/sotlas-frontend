<template>
  <PageLayout>
    <template v-slot:title>Spots</template>
    <template v-slot:title-right>
      <div class="feed-add-wrapper">
        <LiveFeedIndicator v-if="$mq.mobile" />
        <div class="action-button">
          <b-button type="is-info" icon-left="plus" @click="addSpot()" :disabled="!authenticated">Add</b-button>
        </div>
      </div>
    </template>

    <template v-slot:default>
      <section class="section">
        <div class="container">
          <div class="tabs">
            <ul>
              <li v-for="tab in tabs" :key="tab.path" :class="{ 'is-active': $route.path === tab.path }"><router-link :to="tab.path">{{ tab.title }}</router-link></li>
            </ul>
          </div>

          <router-view />
        </div>

        <b-modal v-model="isEditSpotActive" has-modal-card :can-cancel="['escape']">
          <EditSpot @close="isEditSpotActive = false" />
        </b-modal>
      </section>
    </template>
  </PageLayout>
</template>

<script>
import PageLayout from '../components/PageLayout.vue'
import LiveFeedIndicator from '../components/LiveFeedIndicator.vue'
import EditSpot from '../components/EditSpot.vue'
import utils from '../mixins/utils.js'

export default {
  name: 'Spots',
  components: {
    PageLayout, LiveFeedIndicator, EditSpot
  },
  mixins: [utils],
  mounted () {
    document.title = 'Spots - SOTLAS'
  },
  data () {
    return {
      tabs: [
        { path: '/spots/sotawatch', title: 'SOTAwatch' },
        { path: '/spots/rbn', title: 'RBN' }
      ],
      isEditSpotActive: false
    }
  },
  methods: {
    addSpot () {
      this.isEditSpotActive = true
    }
  }
}
</script>

<style scoped>
.action-button {
  margin-left: 1em;
}
.feed-add-wrapper {
  display: flex;
  flex-direction: row;
  gap: .5em;
  align-items: center;
}
</style>
