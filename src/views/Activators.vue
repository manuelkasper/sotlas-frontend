<template>
  <PageLayout>
    <template v-slot:title>Activators</template>

    <template>
      <section class="section">
        <div class="container">
          <b-field>
            <FilterInput v-model="filter" ref="filter" v-debounce:500ms="onFilterChanged" />
          </b-field>

          <b-table class="auto-width" :narrowed="true" :striped="true" :data="activators" :loading="loading" paginated backend-pagination :total="total" :per-page="perPage" :current-page.sync="curPage" backend-sorting :default-sort="[sortField, sortDirection]" @sort="onSort" :mobile-cards="false">
            <template slot-scope="props">
              <b-table-column field="callsign" label="Callsign" class="nowrap" sortable>
                <CountryFlag :country="country(props.row.callsign)" class="flag" />
                <router-link :to="makeActivatorLink(props.row.callsign)">{{ props.row.callsign }}</router-link>
              </b-table-column>
              <b-table-column field="summits" :label="$mq.mobile ? 'Act.' : 'Activations'" numeric sortable>
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
            <template v-slot:bottom-left>
              <b-select v-model="perPage">
                <option v-for="option in perPageOptions" :key="option" :value="option">{{ option }} per page</option>
              </b-select>
            </template>
          </b-table>
        </div>
      </section>
    </template>
  </PageLayout>
</template>

<script>
import axios from 'axios'
import utils from '../mixins/utils.js'
import prefix from '../prefix.js'
import prefs from '../mixins/prefs.js'
import PageLayout from '../components/PageLayout.vue'
import FilterInput from '../components/FilterInput.vue'
import CountryFlag from '../components/CountryFlag.vue'

export default {
  name: 'Activators',
  components: { PageLayout, FilterInput, CountryFlag },
  mixins: [utils, prefs],
  prefs: {
    key: 'activatorsPrefs',
    props: ['perPage', 'filter']
  },
  methods: {
    loadData () {
      this.loading = true
      axios.get(process.env.VUE_APP_API_URL + '/activators/search', { params: { q: this.filter, skip: (this.curPage - 1) * this.perPage, limit: this.perPage, sort: this.sortField, sortDirection: this.sortDirection } })
        .then(response => {
          this.activators = response.data.activators
          this.total = response.data.total
          this.loading = false
        })
    },
    onSort (field, direction) {
      this.sortField = field
      this.sortDirection = direction
      this.loadData()
    },
    onFilterChanged () {
      this.loadData()
    },
    country (callsign) {
      return prefix.isoCodeForCallsign(callsign)
    }
  },
  watch: {
    perPage (newPerPage) {
      this.loadData()
    }
  },
  computed: {
    curPage: {
      get () {
        return this.$store.state.activatorPage
      },
      set (val) {
        this.$store.commit('setActivatorPage', val)
        this.loadData()
      }
    }
  },
  mounted () {
    document.title = 'Activators - SOTLAS'
    this.loadData()
  },
  data () {
    return {
      activators: [],
      filter: '',
      perPage: 15,
      perPageOptions: [10, 15, 20, 30, 50, 100],
      loading: false,
      total: 0,
      sortField: 'score',
      sortDirection: 'desc'
    }
  }
}
</script>

<style scoped>
.flag {
  margin-right: 0.4em;
}
</style>
