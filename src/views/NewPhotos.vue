<template>
  <PageLayout>
    <template v-slot:title>New Photos</template>
    <template v-slot:title-right>
      <b-field>
        <b-dropdown class="control" v-model="selectedAssociations" multiple aria-role="list" position="is-bottom-left" :scrollable="$mq.desktop" @change="loadNewPhotos">
          <b-button icon-left="globe" icon-right="angle-down" slot="trigger">
            <template v-if="$mq.mobile">
              {{ selectedAssociations.length > 0 ? (selectedAssociations.length) : '' }}
            </template>
            <template v-else>
              Associations {{ selectedAssociations.length > 0 ? ('(' + selectedAssociations.length + ')') : '' }}
            </template>
          </b-button>
          <b-dropdown-item v-for="association in associations" :key="association.code" :value="association.code" aria-role="listitem">
            {{ association.code }} – {{ association.name }}
          </b-dropdown-item>
        </b-dropdown>
      </b-field>
    </template>
    <template>
      <section v-if="summits !== null && summits.length > 0" class="section">
        <div class="container">
          <SummitPhotos v-for="summit in summits" :key="summit.code" :summit="summit" :minDate="minDate" :showSummitName="true" />
        </div>
        <div v-if="hasMore" class="has-text-centered">
          <b-button type="is-info" @click="loadMore">Load more</b-button>
        </div>
      </section>
      <section v-else-if="summits != null" class="section">
        <div class="container">
          <b-message type="is-info" has-icon>
            No recently uploaded photos for summits in the selected associations.
          </b-message>
        </div>
      </section>
    </template>
  </PageLayout>
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import prefs from '../mixins/prefs.js'
import utils from '../mixins/utils.js'

import PageLayout from '../components/PageLayout.vue'
import SummitPhotos from '../components/SummitPhotos.vue'

export default {
  name: 'NewPhotos',
  components: { PageLayout, SummitPhotos },
  mixins: [prefs, utils],
  prefs: {
    key: 'newPhotosPrefs',
    props: ['selectedAssociations']
  },
  methods: {
    loadNewPhotos () {
      this.loadingComponent = this.$buefy.loading.open({ canCancel: true })

      let recentPhotosParams = { limit: this.limit + 1 }
      let associations = '*'
      if (this.selectedAssociations.length > 0) {
        associations = this.selectedAssociations.join('|')
      }
      axios.get(import.meta.env.VITE_API_URL + '/summits/recent_photos/' + associations + '/' + this.days, { params: recentPhotosParams })
        .then(response => {
          this.loadingComponent.close()
          this.summits = response.data.slice(0, -1)
          this.hasMore = (this.limit < response.data.length)
        })
    },
    loadAssociations () {
      axios.get(import.meta.env.VITE_API_URL + '/associations/all')
        .then(response => {
          this.associations = response.data
        })
    },
    loadMore () {
      this.limit += 20
      this.loadNewPhotos()
    }
  },
  computed: {
    minDate () {
      return moment().subtract(this.days, 'days').toDate()
    }
  },
  mounted () {
    document.title = 'New Photos - SOTLAS'

    this.loadAssociations()
    this.loadNewPhotos()
  },
  data () {
    return {
      summits: null,
      days: 30,
      limit: 20,
      hasMore: false,
      associations: null,
      selectedAssociations: []
    }
  }
}
</script>

<style scoped>
.dropdown + .dropdown {
  margin-left: 0;
}
@media (max-width: 768px) {
  .dropdown-item {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
