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
          <b-field label="Spot default comments">
            <b-input v-model="spotDefaultComments" type="text" maxlength="60" />
          </b-field>
          <b-field label="Alert default comments">
            <b-input v-model="alertDefaultComments" type="text" maxlength="60" />
          </b-field>
          <b-field label="QTH Logging Latitude">
            <b-input v-model="loggingLatitude" type="number" step="0.0001" />
          </b-field>
          <b-field label="QTH Logging Longitude">
            <b-input v-model="loggingLongitude" type="number" step="0.0001" />
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
  computed: {
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
        let prefs = this.getPrefs('spotPrefs')
        if (prefs) {
          return prefs.defaultComments
        }
        return ''
      },
      set (newSpotDefaultComments) {
        let prefs = this.getPrefs('spotPrefs')
        if (!prefs) {
          prefs = {}
        }
        prefs.defaultComments = newSpotDefaultComments
        this.setPrefs('spotPrefs', prefs)
      }
    },
    alertDefaultComments: {
      get () {
        let prefs = this.getPrefs('editAlertPrefs')
        if (prefs) {
          return prefs.defaultComments
        }
        return ''
      },
      set (newSpotDefaultComments) {
        let prefs = this.getPrefs('editAlertPrefs')
        if (!prefs) {
          prefs = {}
        }
        prefs.defaultComments = newSpotDefaultComments
        this.setPrefs('editAlertPrefs', prefs)
      }
    },
    loggingLatitude: {
      get () {
        let prefs = this.getPrefs('loggingPrefs')
        if (prefs) {
          return prefs.qth_latitude
        }
        return ''
      },
      set (newLoggingLatitude) {
        let prefs = this.getPrefs('loggingPrefs')
        if (!prefs) {
          prefs = {}
        }
        prefs.qth_latitude = newLoggingLatitude
        this.setPrefs('loggingPrefs', prefs)
        console.log('Set logging latitude to ', newLoggingLatitude)
      }
    },
    loggingLongitude: {
      get () {
        let prefs = this.getPrefs('loggingPrefs')
        if (prefs) {
          return prefs.qth_longitude
        }
        return ''
      },
      set (newLoggingLongitude) {
        let prefs = this.getPrefs('loggingPrefs')
        if (!prefs) {
          prefs = {}
        }
        prefs.qth_longitude = newLoggingLongitude
        this.setPrefs('loggingPrefs', prefs)
      }
    }
  }
}
</script>
