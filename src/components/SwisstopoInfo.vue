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
    // Check if we are in Switzerland
    axios.get('https://api.sotl.as/my_country')
      .then(response => {
        if (response.data.country === 'CH') {
          this.inSwitzerland = true
        }
      })
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
