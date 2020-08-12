<template>
  <PageLayout>
    <template v-slot:title>Activation</template>
    <template v-if="activationDetails" v-slot:subtitle><router-link :to="makeActivatorLink(activationDetails.OwnCallsign)">{{ activationDetails.OwnCallsign }}</router-link> on <router-link :to="makeSummitLink(summitCode)">{{ activationDetails.Summit }}</router-link>, <span class="activation-date">{{ niceActivationDate }}</span></template>

    <template>
      <section class="section">
        <div class="container">
          <QSOList v-if="activationDetails" :data="activationDetails.ActivatorLogs" />
        </div>
      </section>
    </template>
  </PageLayout>
</template>

<script>
import moment from 'moment'

import sotadb from '../mixins/sotadb.js'
import utils from '../mixins/utils.js'

import PageLayout from '../components/PageLayout.vue'
import QSOList from '../components/QSOList.vue'

export default {
  name: 'Activation',
  props: {
    activationId: [Number, String]
  },
  mixins: [utils, sotadb],
  components: {
    PageLayout, QSOList
  },
  watch: {
    activationId: {
      immediate: true,
      handler () {
        let loadingComponent = this.$buefy.loading.open({ canCancel: true })
        this.loadActivationDetails(this.activationId)
          .then(activationDetails => {
            this.activationDetails = activationDetails
            document.title = activationDetails.OwnCallsign + ' on ' + this.summitCode + ' (' + this.niceActivationDate + ') - SOTLAS'
            loadingComponent.close()
          })
      }
    }
  },
  computed: {
    niceActivationDate () {
      return moment(this.activationDetails.ActivationDate, 'DD/MM/YYYY').format('DD MMM YYYY')
    },
    summitCode () {
      return this.activationDetails.Summit.substring(0, this.activationDetails.Summit.indexOf(' '))
    }
  },
  mounted () {
    if (!this.authenticated) {
      this.$keycloak.login()
    }
  },
  data () {
    return {
      activationDetails: null
    }
  }
}
</script>

<style scoped>
.activation-date {
  color: #777;
}
.hero a {
  color: #3273dc !important;
}
</style>
