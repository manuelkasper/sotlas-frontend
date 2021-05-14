<template>
  <PageLayout>
    <template v-slot:title>
      <h1 class="title is-size-1 is-size-3-mobile">
        My User Data
      </h1>
    </template>

    <div v-if="userSummits && userSummits.length > 0">
      <section class="section">
        <div class="container">
          <h4 class="title is-4"><span>Summit Bookmarks</span></h4>
          <b-field>
            <FilterInput v-model="filterString" ref="filter" :is-regex="true" />
          </b-field>
          <template v-if="filteredBookmarks && filteredBookmarks.length > 0">
            <SummitList :data="filteredBookmarks" auto-width ignore-validity />
          </template>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <h4 class="title is-4"><span>User Tags</span></h4>

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
    <div v-else-if="!authenticated">
      <section class="section">
        <div class="container">
          <b-message type="is-info" has-icon>
            Log in to view your summits and tags.
          </b-message>
        </div>
      </section>
    </div>
    <div v-else>
      <section class="section">
        <div class="container">
          <b-message type="is-info" has-icon>
            No bookmarks or tags set, yet.
          </b-message>
        </div>
      </section>
    </div>
  </PageLayout>
</template>

<script>
import FilterInput from '../components/FilterInput.vue'
import SummitList from '../components/SummitList.vue'
import PageLayout from '@/components/PageLayout'
import utils from '@/mixins/utils'
import api from '@/mixins/api'

export default {
  name: 'BookmarkList',
  components: {
    PageLayout, FilterInput, SummitList
  },
  mixins: [api, utils],
  mounted () {
    document.title = 'My User Data - SOTLAS'
    this.loadingComponent = this.$buefy.loading.open({ canCancel: true })

    let loads = []
    loads.push(this.getPersonalData().then(response => {
      this.userSummits = response.data.userSummits
    }))
    loads.push(this.getPersonalSummitTags().then(response => {
      this.userTags = response.data
    }))

    Promise.all(loads)
      .finally(() => {
        this.loadingComponent.close()
      })
  },
  computed: {
    filteredBookmarks () {
      return this.userSummits.filter(userSummit => {
        if (!userSummit.isBookmarked) {
          return false
        }

        if (this.filterString) {
          return userSummit.summit.code.includes(this.filterString.toUpperCase()) || userSummit.summit.name.toLowerCase().includes(this.filterString.toLowerCase())
        } else {
          return true
        }
      }).map(userSummit => {
        return userSummit.summit
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

<style scoped>
.faicon {
  margin-right: 0.5em;
}
</style>
