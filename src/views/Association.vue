<template>
  <SummitDatabasePageLayout :association="association">
    <template v-slot:title>
      <h1 class="title is-size-1 is-size-3-mobile">
        <CountryFlag v-if="association.isoCode" :country="association.isoCode" class="flag" />{{ association.name }}

        <DownloadButton :exportUrlPrefix="exportUrlPrefix" />
      </h1>
    </template>

    <section class="section">
      <div class="container">
        <b-field>
          <FilterInput v-model="filter" />
        </b-field>
        <div class="columns">
          <div class="column">
            <b-table default-sort="code" :narrowed="true" :striped="true" :data="filteredRegions" :mobile-cards="false">
              <template slot-scope="props">
                <b-table-column field="code" label="Code" class="nowrap" sortable>
                  <router-link :to="regionLink(props.row)">{{ props.row.code }}</router-link>
                </b-table-column>
                <b-table-column field="name" label="Name" sortable>
                  <router-link :to="regionLink(props.row)">{{ props.row.name }}</router-link>
                </b-table-column>
                <b-table-column field="summitCount" label="Summits" sortable numeric>
                  {{ props.row.summitCount }}
                </b-table-column>
                <b-table-column v-if="myActivationsPerRegion" :label="$mq.mobile ? 'Act. by me' : 'Activated by me'" numeric>
                  {{ myActivationsPerRegion[associationCode + '/' + props.row.code] }}
                </b-table-column>
              </template>
            </b-table>
          </div>
          <div class="column">
            <MiniMap v-if="association.code" class="map" :bounds="association.bounds" :filter="mapFilter" :overviewMap="true" />
          </div>
        </div>
      </div>
    </section>
  </SummitDatabasePageLayout>
</template>

<script>
import axios from 'axios'
import utils from '../mixins/utils.js'
import sotadb from '../mixins/sotadb.js'

import SummitDatabasePageLayout from '../components/SummitDatabasePageLayout.vue'
import FilterInput from '../components/FilterInput.vue'
import CountryFlag from '../components/CountryFlag.vue'
import DownloadButton from '../components/DownloadButton.vue'
import MiniMap from '../components/MiniMap.vue'

export default {
  name: 'Association',
  delayScroll: true,
  props: {
    associationCode: String
  },
  mixins: [utils, sotadb],
  components: {
    SummitDatabasePageLayout, FilterInput, CountryFlag, DownloadButton, MiniMap
  },
  watch: {
    associationCode () {
      this.loadAssociation()
    }
  },
  mounted () {
    this.loadAssociation()
    if (this.authenticated) {
      this.loadMyActivatorUniques()
    }
  },
  methods: {
    regionLink (region) {
      return '/summits/' + this.associationCode + '/' + region.code
    },
    loadAssociation () {
      this.loadingComponent = this.$buefy.loading.open({ canCancel: true })
      axios.get('https://api.sotl.as/associations/' + this.associationCode)
        .then(response => {
          this.association = response.data
          document.title = this.association.name + ' (' + this.associationCode + ') - SOTLAS'
          this.loadingComponent.close()
          this.$root.$emit('triggerScroll')
        })
        .catch(error => {
          this.loadingComponent.close()
          if (error.response && error.response.status === 404) {
            this.$router.replace('/notfound')
          }
        })
    }
  },
  computed: {
    filteredRegions () {
      if (this.filter === '') {
        return this.association.regions
      }
      return this.association.regions.filter(region => {
        return region.code.includes(this.filter.toUpperCase()) || region.name.toLowerCase().includes(this.filter.toLowerCase())
      })
    },
    exportUrlPrefix () {
      return `https://api.sotl.as/geoexport/associations/${this.associationCode}`
    },
    myActivationsPerRegion () {
      if (!this.$store.state.myActivatedSummits) {
        return null
      }
      let activationsPerRegion = {}
      this.$store.state.myActivatedSummits.forEach(summitCode => {
        let region = summitCode.substring(0, summitCode.indexOf('-'))
        if (!activationsPerRegion[region]) {
          activationsPerRegion[region] = 1
        } else {
          activationsPerRegion[region]++
        }
      })
      return activationsPerRegion
    },
    mapFilter () {
      // Determine lexically next association code so we can compare strings with <= and >=
      let nextAssociationCode = this.association.code + '/'
      nextAssociationCode = nextAssociationCode.substr(0, nextAssociationCode.length - 1) + String.fromCharCode(nextAssociationCode.substr(-1).charCodeAt() + 1)
      return ['all', ['>=', 'code', this.association.code + '/'], ['<', 'code', nextAssociationCode]]
    }
  },
  data () {
    return {
      association: {},
      filter: ''
    }
  }
}
</script>

<style scoped>
h1 .flag {
  margin-right: 0.4em;
}
.nowrap {
  white-space: nowrap;
}
.map {
  width: 100%;
  height: 40vh;
  min-height: 20em;
  border: 1px solid #ccc;
}
</style>
