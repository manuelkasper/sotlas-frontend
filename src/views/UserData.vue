<template>
  <PageLayout>
    <template v-slot:title>
      <h1 class="title is-size-1 is-size-3-mobile">
        My User Data
      </h1>
    </template>

    <section class="section">
      <div class="container">
        <b-message v-if="!userSummits || userSummits.length === 0" type="is-info" has-icon>
          No bookmarks or tags set, yet.
        </b-message>
      </div>
    </section>

    <div v-if="userSummits && userSummits.length > 0">
      <section class="section">
        <div class="container">
          <h4 class="title is-4 logged-act"><span>Summit Bookmarks</span><b-button size="is-small" icon-left="map" icon-pack="fas" type="is-info" @click="showMap = !showMap">{{ showMap ? 'Hide' : 'Show' }} Map</b-button></h4>
          <template v-if="filteredBookmarks && filteredBookmarks.length > 0">
            <MiniMap v-if="showMap" class="map" :bounds="activationsMapBounds" :filter="activationsMapFilter" zoom-warning show-inactive-summits />

            <b-field>
              <FilterInput v-model="filterString" ref="filter" :is-regex="true" />
            </b-field>

            <SummitList :data="filteredBookmarks" auto-width />
          </template>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <h4 class="title is-4 logged-act"><span>User Tags</span></h4>

          <template v-if="userTags && userTags.length > 0">
            <b-table class="auto-width" default-sort="tag" :narrowed="true" :striped="true" :data="userTags" :mobile-cards="false">
              <template slot-scope="props">
                <b-table-column field="tag" label="User Tag" class="nowrap" sortable>
                  <font-awesome-icon :icon="['far', 'tag']" class="faicon" />
                  <router-link :to="'/search?q=@' + encodeURIComponent(props.row.tag)">{{ props.row.tag }}</router-link>
                </b-table-column>
                <b-table-column field="count" :label="Count" numeric sortable>
                  {{ props.row.count }}
                </b-table-column>
              </template>
            </b-table>
          </template>
        </div>
      </section>
    </div>
  </PageLayout>
</template>

<script>
import FilterInput from '../components/FilterInput.vue'
import PageLayout from '@/components/PageLayout'
import utils from '@/mixins/utils'
import api from '@/mixins/api'

export default {
  name: 'BookmarkList',
  components: {
    PageLayout, FilterInput
  },
  mixins: [api, utils],
  delayScroll: true,
  methods: {
    summitLink (association) {
      return '/summits/' + association.code
    }
  },
  mounted () {
    document.title = 'My User Data - SOTLAS'
    this.loadingComponent = this.$buefy.loading.open({ canCancel: true })
    this.getPersonalData().then(response => {
      this.userSummits = response.userSummits
    })
    this.getPersonalSummitTags().then(response => {
      this.userTags = response
    })
  },
  computed: {
    filteredBookmarks () {
      let filterResult = this.userSummits.map(userSummit => {
        if (userSummit.isBookmarked === true) {
          return userSummit.summit
        }
      })

      if (!this.filterString || this.filterString === '') {
        return filterResult
      }

      return filterResult.filter(userSummit => {
        return userSummit.summit.code.includes(this.filterString.toUpperCase()) || userSummit.name.toLowerCase().includes(this.filterString.toLowerCase())
      })
    }
  },
  data () {
    return {
      userSummits: [],
      showMap: false,
      filterString: '',
      userTags: []
    }
  }
}
</script>
