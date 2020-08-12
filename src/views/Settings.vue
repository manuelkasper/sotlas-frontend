<template>
  <PageLayout>
    <template v-slot:title>Settings</template>

    <template>
      <section class="section">
        <div class="container content">
          <b-field label="Units">
            <b-field>
              <b-radio v-model="units" native-value="m">Metric (m)</b-radio>
              <b-radio v-model="units" native-value="ft">Imperial (ft/mi)</b-radio>
            </b-field>
          </b-field>
          <b-field label="Map server" message="Choosing the closest server can help increase map loading performance.">
            <b-select v-model="mapServerSelect">
              <option v-for="(v, k) in mapServers" :value="k" :key="k">{{ v }}</option>
            </b-select>
          </b-field>
          <b-field label="Spot default comments">
            <b-input v-model="spotDefaultComments" type="text" maxlength="60" />
          </b-field>
          <b-field label="Alert default comments">
            <b-input v-model="alertDefaultComments" type="text" maxlength="60" />
          </b-field>
          <b-field label="QRZ.com login">
            <b-input v-model="qrzUsername" class="userpass" type="text" placeholder="Username" />
          </b-field>
          <b-field message="If you supply your QRZ.com login, callsign information (name, QTH etc.) will be shown on detail pages. The login information will only be stored locally in your browser.">
            <b-input v-model="qrzPassword" class="userpass" type="password" placeholder="Password" />
          </b-field>
        </div>
      </section>
    </template>
  </PageLayout>
</template>

<script>
import PageLayout from '../components/PageLayout.vue'
import mapstyle from '../mixins/mapstyle.js'
import prefs from '../mixins/prefs.js'

export default {
  components: { PageLayout },
  mixins: [mapstyle, prefs],
  mounted () {
    document.title = 'Settings - SOTLAS'
  },
  methods: {
    getPreference (prefName, attribute) {
      let prefs = this.getPrefs(prefName)
      if (prefs) {
        return prefs[attribute]
      }
      return ''
    },
    setPreference (prefName, attribute, value) {
      let prefs = this.getPrefs(prefName)
      if (!prefs) {
        prefs = {}
      }
      prefs[attribute] = value
      this.setPrefs(prefName, prefs)
    }
  },
  computed: {
    mapServerSelect: {
      get () {
        return this.mapServer
      },
      set (newMapServer) {
        localStorage.setItem('mapServer', newMapServer)
        location.reload()
      }
    },
    units: {
      get () {
        return this.$store.state.altitudeUnits
      },
      set (newUnits) {
        this.$store.commit('changeAltitudeUnits', newUnits)
      }
    },
    spotDefaultComments: {
      get () {
        return this.getPreference('spotPrefs', 'defaultComments')
      },
      set (newValue) {
        return this.setPreference('spotPrefs', 'defaultComments', newValue)
      }
    },
    alertDefaultComments: {
      get () {
        return this.getPreference('editAlertPrefs', 'defaultComments')
      },
      set (newValue) {
        return this.setPreference('editAlertPrefs', 'defaultComments', newValue)
      }
    },
    qrzUsername: {
      get () {
        return this.getPreference('qrzLogin', 'qrzUsername')
      },
      set (newValue) {
        return this.setPreference('qrzLogin', 'qrzUsername', newValue)
      }
    },
    qrzPassword: {
      get () {
        return this.getPreference('qrzLogin', 'qrzPassword')
      },
      set (newValue) {
        return this.setPreference('qrzLogin', 'qrzPassword', newValue)
      }
    }
  }
}
</script>

<style scoped>
.userpass {
  max-width: 20em;
}
</style>
