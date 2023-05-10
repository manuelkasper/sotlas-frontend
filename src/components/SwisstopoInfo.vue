<template>
  <div v-if="inSwitzerland">
    <div class="has-text-centered swisstopo-info">
      <span class="fp ch flag"></span>
      swisstopo-Karte
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'SwisstopoInfo',
  mounted () {
    if (!localStorage.getItem('swisstopoInfoShown')) {
      // Check if we are in Switzerland
      axios.get(process.env.VUE_APP_API_URL + '/my_country')
        .then(response => {
          if (response.data.country === 'CH') {
            this.active = true
          }
        })
    }
  },
  methods: {
    cancelInfo () {
      this.active = false
      localStorage.setItem('swisstopoInfoShown', true)
    },
    switchMap () {
      this.cancelInfo()
      this.$store.commit('setMapType', 'swisstopo')
    }
  },
  data () {
    return {
      inSwitzerland: false
    }
  }
}
</script>

<style scoped>
.swisstopo-info {
  margin-top: 0.5em;
  color: white;
}
.swisstopo-info .flag {
  margin-right: 0.2em;
}
</style>
