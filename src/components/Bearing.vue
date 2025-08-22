<template>
  <span v-if="homeQth" class="wrapper">
    <DistanceLabel :distance="distance" />, {{ bearing }}°
  </span>
  <span v-else-if="homeQth === null" class="has-text-grey">
    Loading...
  </span>
  <span v-else class="has-text-grey">
    Set home QTH in <a @click="doAccountManagement">your account</a>
  </span>
</template>

<script>
import DistanceLabel from './DistanceLabel.vue'
import vincenty from 'node-vincenty'

export default {
  name: 'Bearing',
  components: { DistanceLabel },
  mixins: [utils],
  props: {
    latitude: Number,
    longitude: Number
  },
  computed: {
    homeQth () {
      return this.$store.state.homeQth
    }
  },
  mounted () {
    if (this.homeQth === null && this.authenticated) {
      this.$keycloak.updateToken(60)
        .then(() => {
          this.$keycloak.loadUserProfile()
            .then(profile => {
              if (profile.attributes.Lat && profile.attributes.Lat[0] && profile.attributes.Lon && profile.attributes.Lon[0]) {
                this.$store.commit('setHomeQth', {
                  latitude: parseFloat(profile.attributes.Lat[0]),
                  longitude: parseFloat(profile.attributes.Lon[0])
                })
                this.calculate()
              } else {
                this.$store.commit('setHomeQth', undefined)
              }
            })
        })
    } else {
      this.calculate()
    }
  },
  watch: {
    latitude () {
      this.calculate()
    },
    longitude () {
      this.calculate()
    },
    homeQth () {
      this.calculate()
    }
  },
  methods: {
    calculate () {
      if (!this.homeQth) {
        this.distance = null
        this.bearing = null
        return
      }
      let res = vincenty.distVincenty(this.homeQth.latitude, this.homeQth.longitude, this.latitude, this.longitude)
      this.distance = res.distance
      this.bearing = (Math.round(res.initialBearing) + 360) % 360
    },
    doAccountManagement () {
      this.$keycloak.accountManagement()
    }
  },
  data () {
    return {
      distance: null,
      bearing: null
    }
  }
}
</script>

<style scoped>
.wrapper {
  display: inline-block;
}
</style>
