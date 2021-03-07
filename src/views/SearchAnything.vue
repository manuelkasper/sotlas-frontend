<template>
  <PageLayout>
    <template v-slot:title>Search results</template>
    <template>
      <section v-if="summits !== null && summits.length > 0" class="section">
        <div class="container">
          <h4 class="title is-4"><b-icon icon="mountains" />Summits</h4>
          <b-field v-if="inactiveCount > 0" grouped>
            <b-switch v-model="showInactive">Show inactive ({{ inactiveCount }})</b-switch>
          </b-field>

          <SummitList :data="filteredSummits" auto-width />

          <b-message v-if="summits !== null && summits.length === this.limit" type="is-warning" has-icon>
            More than {{ this.limit }} summits found, so not all summits may be shown. Please make your search input more specific.
          </b-message>
        </div>
      </section>

      <section v-if="activators !== null && activators.length > 0" class="section">
        <div class="container">
          <h4 class="title is-4"><b-icon icon="user" />Activators</h4>

          <b-table class="auto-width" default-sort="callsign" :narrowed="true" :striped="true" :data="activators" :mobile-cards="false">
            <template slot-scope="props">
              <b-table-column field="callsign" label="Callsign" sortable>
                <router-link :to="makeActivatorLink(props.row.callsign)">{{ props.row.callsign }}</router-link>
              </b-table-column>
              <b-table-column field="summits" label="Summits" numeric sortable>
                {{ props.row.summits }}
              </b-table-column>
              <b-table-column field="points" :label="$mq.mobile ? 'Pts.' : 'Points'" numeric sortable>
                {{ props.row.points }}
              </b-table-column>
              <b-table-column field="bonusPoints" :label="$mq.mobile ? 'Bonus' : 'Bonus points'" numeric sortable>
                {{ props.row.bonusPoints }}
              </b-table-column>
              <b-table-column field="score" label="Score" numeric sortable>
                {{ props.row.score }}
              </b-table-column>
              <b-table-column v-if="!$mq.mobile" field="avgPoints" label="Avg. points" numeric sortable>
                {{ props.row.avgPoints }}
              </b-table-column>
            </template>
          </b-table>

          <b-message v-if="activators !== null && activators.length === this.limit" type="is-warning" has-icon>
            More than {{ this.limit }} activators found, so not all activators may be shown. Please make your search input more specific.
          </b-message>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <b-message v-if="activators !== null && activators.length === 0 && summits !== null && summits.length === 0" type="is-info" has-icon>
            No matching summits or activators for '{{ $route.query.q }}' found.
          </b-message>
        </div>
      </section>
    </template>
  </PageLayout>
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import utils from '../mixins/utils.js'

import PageLayout from '../components/PageLayout.vue'
import SummitList from '../components/SummitList.vue'

export default {
  name: 'SearchAnything',
  components: { PageLayout, SummitList },
  mixins: [utils],
  methods: {
    doSearch () {
      let loads = []
      let q = this.$route.query.q.trim()
      this.loadingComponent = this.$buefy.loading.open({ canCancel: true })
      loads.push(axios.get('https://api.sotl.as/activators/search', { params: { q, limit: this.limit } })
        .then(response => {
          this.activators = response.data.activators
        }))

      loads.push(axios.get('https://api.sotl.as/summits/search', { params: { q, limit: this.limit } })
        .then(response => {
          let now = moment()
          response.data.forEach(summit => {
            summit.isValid = (moment(summit.validFrom).isBefore(now) && moment(summit.validTo).isAfter(now))
          })
          this.summits = response.data
        }))

      Promise.all(loads)
        .then(() => {
          this.loadingComponent.close()

          if (this.activators.length === 1 && this.summits.length === 0) {
            this.$router.replace('/activators/' + this.activators[0].callsign)
          } else if (this.summits.length === 1 && this.activators.length === 0) {
            this.$router.replace('/summits/' + this.summits[0].code)
          }
        })
    }
  },
  watch: {
    '$route' (to, from) {
      this.doSearch()
    }
  },
  computed: {
    filteredSummits () {
      return this.summits.filter(summit => {
        return (summit.isValid || this.showInactive)
      })
    },
    inactiveCount () {
      if (this.summits === null) {
        return 0
      }
      let inactiveCount = 0
      this.summits.forEach(summit => {
        if (!summit.isValid) {
          inactiveCount++
        }
      })
      return inactiveCount
    }
  },
  mounted () {
    document.title = 'Search results - SOTLAS'

    this.doSearch()
  },
  data () {
    return {
      activators: null,
      limit: 100,
      summits: null,
      showInactive: false
    }
  }
}
</script>

<style scoped>
.summits >>> .is-invalid {
  opacity: 0.5;
}
@media (max-width: 768px) {
  .points {
    padding: 0.2em;
    min-width: 2em;
  }
}
@media (max-width: 414px) {
  .table .summit-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 10em;
  }
}
@media (max-width: 414px) {
  .table td, .table th {
    padding: 0.25em 0.3em;
  }
  .table .summit-name {
    max-width: 8em;
  }
}
.message.is-warning {
  margin-top: 1rem;
}
</style>
