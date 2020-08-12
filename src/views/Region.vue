<template>
  <SummitDatabasePageLayout :association="association" :region="region">
    <template v-slot:title>
      <h1 v-if="region" class="title is-size-1 is-size-3-mobile">
        {{ region.name }}

        <DownloadButton :exportUrlPrefix="exportUrlPrefix" :exportUrlParams="exportUrlParams" />
      </h1>
    </template>

    <section class="section">
      <div class="container">
        <b-field grouped group-multiline>
          <FilterInput class="control" v-model="filter" />
          <b-switch class="control" v-model="showInactive">Show inactive</b-switch>
          <b-switch v-if="authenticated" class="control" v-model="showActivatedThisYear">Show <span v-if="$mq.mobile">act.</span><span v-else>activated</span> this year</b-switch>
        </b-field>
        <div class="columns">
          <div class="column">
            <SummitList :data="filteredSummits" :myActivatedSummits="myActivatedSummits" :myActivatedSummitsThisYear="myActivatedSummitsThisYear" :myChasedSummits="myChasedSummits" />
          </div>
          <div class="column">
            <MiniMap v-if="region" class="map" :bounds="region.bounds" :filter="mapFilter" :show-inactive-summits="showInactive" />
          </div>
        </div>
      </div>
    </section>
  </SummitDatabasePageLayout>
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import utils from '../mixins/utils.js'
import prefs from '../mixins/prefs.js'
import sotadb from '../mixins/sotadb.js'

import SummitDatabasePageLayout from '../components/SummitDatabasePageLayout.vue'
import FilterInput from '../components/FilterInput.vue'
import SummitList from '../components/SummitList.vue'
import DownloadButton from '../components/DownloadButton.vue'
import MiniMap from '../components/MiniMap.vue'

export default {
  name: 'Region',
  props: {
    regionCode: String
  },
  components: {
    SummitDatabasePageLayout, FilterInput, SummitList, DownloadButton, MiniMap
  },
  prefs: {
    key: 'regionPrefs',
    props: ['showActivatedThisYear']
  },
  delayScroll: true,
  mixins: [utils, prefs, sotadb],
  computed: {
    regionCodeNoAssoc () {
      return this.regionCode.substr(this.regionCode.indexOf('/') + 1)
    },
    associationCode () {
      return this.regionCode.substr(0, this.regionCode.indexOf('/'))
    },
    region () {
      if (!this.association.regions) {
        return null
      }
      return this.association.regions.find(region => { return region.code === this.regionCodeNoAssoc })
    },
    filteredSummits () {
      return this.summits.filter(summit => {
        return (summit.isValid || this.showInactive) && (this.filter === '' || summit.code.includes(this.filter.toUpperCase()) || summit.name.toLowerCase().includes(this.filter.toLowerCase()))
      })
    },
    exportUrlPrefix () {
      return `https://api.sotl.as/geoexport/regions/${this.regionCode}`
    },
    exportUrlParams () {
      return (this.showInactive ? { inactive: 1 } : {})
    },
    myActivatedSummits () {
      return this.$store.state.myActivatedSummits
    },
    myActivatedSummitsThisYear () {
      if (this.showActivatedThisYear) {
        return this.$store.state.myActivatedSummitsThisYear
      } else {
        return null
      }
    },
    myChasedSummits () {
      return this.$store.state.myChasedSummits
    },
    mapFilter () {
      // Determine lexically next region code so we can compare strings with <= and >=
      let nextRegionCode = this.regionCode + '-'
      nextRegionCode = nextRegionCode.substr(0, nextRegionCode.length - 1) + String.fromCharCode(nextRegionCode.substr(-1).charCodeAt() + 1)
      return ['all', ['>=', 'code', this.regionCode + '-'], ['<', 'code', nextRegionCode]]
    }
  },
  watch: {
    regionCode () {
      this.loadRegion()
    },
    showActivatedThisYear () {
      if (this.showActivatedThisYear) {
        this.loadMyActivatorUniquesThisYear()
      }
    }
  },
  mounted () {
    this.loadRegion()
    if (this.authenticated) {
      this.loadMyActivatorUniques()
      if (this.showActivatedThisYear) {
        this.loadMyActivatorUniquesThisYear()
      }
      this.loadMyChaserUniques()
    }
  },
  methods: {
    loadRegion () {
      let loads = []
      this.loadingComponent = this.$buefy.loading.open({ canCancel: true })
      loads.push(axios.get('https://api.sotl.as/associations/' + this.associationCode)
        .then(response => {
          this.association = response.data
          document.title = this.region.name + ' (' + this.associationCode + '/' + this.region.code + ') - SOTLAS'
        })
        .catch(error => {
          if (error.response && error.response.status === 404) {
            this.$router.replace('/notfound')
          }
        }))

      loads.push(axios.get('https://api.sotl.as/regions/' + this.regionCode)
        .then(response => {
          let now = moment()
          if (response.data.length === 0) {
            this.$router.replace('/notfound')
          } else {
            response.data.forEach(summit => {
              summit.isValid = (moment(summit.validFrom).isBefore(now) && moment(summit.validTo).isAfter(now))
            })
            this.summits = response.data
          }
        })
        .catch(error => {
          if (error.response && error.response.status === 404) {
            this.$router.replace('/notfound')
          }
        }))

      Promise.all(loads)
        .then(() => {
          this.loadingComponent.close()
          this.$root.$emit('triggerScroll')
        })
    }
  },
  data () {
    return {
      association: {},
      summits: [],
      showInactive: false,
      showActivatedThisYear: false,
      filter: ''
    }
  }
}
</script>

<style scoped>
.switch {
  font-size: inherit;
}
.map {
  width: 100%;
  height: 40vh;
  min-height: 20em;
  border: 1px solid #ccc;
}
</style>
