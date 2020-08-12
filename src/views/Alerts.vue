<template>
  <PageLayout>
    <template v-slot:title>Alerts</template>
    <template v-slot:title-right>
      <div class="action-button">
        <b-button type="is-info" icon-left="plus" @click="$refs.alertsList.addAlert()" :disabled="!authenticated">Add</b-button>
      </div>
    </template>

    <template>
      <section class="section">
        <div class="container">
          <b-field grouped group-multiline>
            <FilterInput class="control" v-model="alertFilter" placeholder="Summit or callsign" :is-regex="true" />
            <b-dropdown class="control" v-model="selectedModes" multiple aria-role="list">
              <b-button icon-right="angle-down" slot="trigger">
                  Modes {{ selectedModes.length > 0 ? ('(' + selectedModes.length + ')') : '' }}
              </b-button>
              <b-dropdown-item v-for="(mode, key) in modes" :key="key" :value="key" aria-role="listitem">
                {{ mode }}
              </b-dropdown-item>
            </b-dropdown>
            <b-dropdown class="control" v-model="selectedContinents" multiple aria-role="list">
              <b-button icon-right="angle-down" slot="trigger">
                  Continents {{ selectedContinents.length > 0 ? ('(' + selectedContinents.length + ')') : '' }}
              </b-button>
              <b-dropdown-item v-for="(continent, code) in continents" :key="code" :value="code" aria-role="listitem">
                {{ continent }}
              </b-dropdown-item>
            </b-dropdown>
            <b-button class="control" @click="clearFilters" :disabled="alertFilter === '' && selectedModes.length === 0 && selectedContinents.length === 0">Clear</b-button>
            <b-switch class="control" v-model="showOld">Show old</b-switch>
          </b-field>

          <AlertsList :data="filteredAlerts" :infinite="true" ref="alertsList" />
        </div>
      </section>
    </template>
  </PageLayout>
</template>

<script>
import utils from '../mixins/utils.js'
import prefs from '../mixins/prefs.js'
import PageLayout from '../components/PageLayout.vue'
import FilterInput from '../components/FilterInput.vue'
import AlertsList from '../components/AlertsList.vue'
import nowticker from '../mixins/nowticker.js'
import moment from 'moment'

export default {
  name: 'Alerts',
  components: {
    PageLayout, FilterInput, AlertsList
  },
  mixins: [utils, prefs, nowticker],
  prefs: {
    key: 'alertsPrefs',
    props: ['alertFilter', 'selectedModes', 'selectedContinents', 'showOld']
  },
  mounted () {
    document.title = 'Alerts - SOTLAS'
  },
  computed: {
    filteredAlerts () {
      let oneHourAgo = moment.utc(this.now).subtract(1, 'hours')
      try {
        let filterRegex = new RegExp(this.alertFilter, 'i')
        return this.$store.state.alerts.filter(alert => {
          if (!this.showOld && oneHourAgo.isAfter(moment.utc(alert.dateActivated))) {
            return false
          }
          if (this.selectedModes.length > 0 && !this.selectedModes.some(mode => { return alert.frequency.toLowerCase().includes(mode) })) {
            return false
          }
          if (this.selectedContinents.length > 0 && !this.selectedContinents.includes(alert.summit.continent)) {
            return false
          }

          return ((alert.summit.code && filterRegex.test(alert.summit.code)) ||
                  (alert.summit.name && filterRegex.test(alert.summit.name)) ||
                  filterRegex.test(alert.activatorCallsign))
        })
      } catch (e) {
        return []
      }
    },
    continents () {
      return this.allContinents()
    },
    modes () {
      return this.allModes()
    }
  },
  methods: {
    clearFilters () {
      this.alertFilter = ''
      this.selectedModes = []
      this.selectedContinents = []
    }
  },
  data () {
    return {
      alertFilter: '',
      selectedModes: [],
      selectedContinents: [],
      showOld: false
    }
  }
}
</script>

<style scoped>
.dropdown + .dropdown {
  margin-left: 0;
}
</style>
