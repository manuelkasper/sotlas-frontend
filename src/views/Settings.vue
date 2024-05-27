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
    }
  }
}
</script>
