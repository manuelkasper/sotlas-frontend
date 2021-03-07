<template>
  <PageLayout>
    <template v-slot:title>New Photos</template>
    <template v-slot:title-right>
      <b-field>
        <b-dropdown class="control" v-model="selectedAssociations" multiple aria-role="list" position="is-bottom-left" :scrollable="$mq.desktop" @change="loadNewPhotos">
          <b-button icon-right="angle-down" slot="trigger">
            Associations {{ selectedAssociations.length > 0 ? ('(' + selectedAssociations.length + ')') : '' }}
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
          <SummitPhotos v-for="summit in summits" class="inline" :key="summit.code" :summit="summit" :minDate="minDate" :showSummitName="true" />
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

      let recentPhotosParams = { limit: this.limit }
      let associations = '*'
      if (this.selectedAssociations.length > 0) {
        associations = this.selectedAssociations.join('|')
      }
      axios.get('https://api.sotl.as/summits/recent_photos/' + associations + '/' + this.days, { params: recentPhotosParams })
        .then(response => {
          this.loadingComponent.close()
          this.summits = response.data
        })
    },
    loadAssociations () {
      axios.get('https://api.sotl.as/associations/all')
        .then(response => {
          this.associations = response.data
        })
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
      days: 7,
      limit: 20,
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
.inline {
  display: inline-block;
  vertical-align: top;
}
>>> .photo-group {
  margin-right: 0.75rem;
}
</style>
