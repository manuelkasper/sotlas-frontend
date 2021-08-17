<template>
  <b-dropdown ref="dropdown" aria-role="list" position="is-bottom-left" class="nearby-summits" append-to-body>
    <b-button slot="trigger" icon-right="angle-down" :loading="loading" @click.stop="clickButton">Nearby</b-button>
    <b-dropdown-item v-for="summit in nearbySummits" :key="summit.code" aria-role="listitem" @click="clickSummit(summit)">
      <div class="summit-title"><div class="summit-name">{{ summit.name }}</div><div class="summit-alt"><AltitudeLabel :altitude="summit.altitude" /></div></div>
      <div class="summit-info"><div class="distance"><font-awesome-icon :icon="['far', 'arrows-h']" class="faicon" /><DistanceLabel :distance="summit.distance" :high-precision="true" /></div>{{ summit.code }}</div>
    </b-dropdown-item>
  </b-dropdown>
</template>

<script>
import axios from 'axios'
import haversineDistance from 'haversine-distance'
import DistanceLabel from './DistanceLabel.vue'
import AltitudeLabel from './AltitudeLabel.vue'

export default {
  name: 'NearbySummitsList',
  components: {
    DistanceLabel, AltitudeLabel
  },
  methods: {
    clickButton () {
      if (this.$refs.dropdown.isActive) {
        this.$refs.dropdown.toggle()
      } else {
        if (navigator.geolocation) {
          this.loading = true
          navigator.geolocation.getCurrentPosition(
            position => {
              axios.get('https://api.sotl.as/summits/near', { params: { lat: position.coords.latitude, lon: position.coords.longitude, limit: 5, maxDistance: 100000 } })
                .then(response => {
                  if (response.data.length === 0) {
                    alert('No summits within 100 km.')
                  } else {
                    response.data.forEach(summit => {
                      summit.distance = haversineDistance(summit.coordinates, position.coords)
                    })
                    this.nearbySummits = response.data
                    this.$refs.dropdown.toggle()
                  }
                })
                .finally(() => {
                  this.loading = false
                })
            },
            error => {
              this.loading = false
              alert(error.message)
            }, {
              enableHighAccuracy: true,
              timeout: 10000
            }
          )
        } else {
          alert('Geolocation is not supported by this browser.')
        }
      }
    },
    clickSummit (summit) {
      this.$emit('summitSelected', summit)
    }
  },
  data () {
    return {
      nearbySummits: [],
      loading: false
    }
  }
}
</script>

<style scoped>
.summit-title {
  max-width: 100%;
}
.summit-name {
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: calc(100% - 4em);
  vertical-align: bottom;
}
.summit-alt {
  display: inline-block;
  font-size: 0.9em;
  color: #777;
  margin-left: 0.5em;
}
@media (min-width: 1024px) {
  .summit-name {
    max-width: 16em;
  }
}
.summit-info {
  color: #777;
  font-size: 0.9em;
}
.dropdown-item {
  padding-right: 1rem;
}
.distance .faicon {
  margin-right: 0.3em;
}
.distance {
  float: right;
  margin-left: 0.5em;
}
</style>
