<template>
  <b-modal :active.sync="active" :on-cancel="cancelInfo" :can-cancel="false">
    <div class="box content">
      <div class="has-text-centered">
        <span class="fp at flag"></span>
      </div>
      <h3>basemap.at-Karte jetzt verfügbar</h3>
      <p>Auf SOTLAS kann man auch die detailliertere basemap.at-Karte nutzen, inkl. Aktivierungszonen. Einfach den Kartentyp umstellen, fertig!</p>
      <div class="has-text-centered is-hidden-touch">
        <img class="basemapat-info" src="../assets/basemapat-info.png" />
      </div>
      <div class="action-buttons">
        <div class="has-text-centered">
          <b-button type="is-info" size="is-medium" @click="switchMap">Jetzt umstellen</b-button>
        </div>
        <div class="has-text-centered">
          <b-button size="is-medium" @click="cancelInfo">OK, cool!</b-button>
        </div>
      </div>
    </div>
  </b-modal>
</template>

<script>
import axios from 'axios'

export default {
  name: 'BasemapAtInfo',
  mounted () {
    if (!localStorage.getItem('basemapAtInfoShown')) {
      // Check if we are in Austria
      axios.get(import.meta.env.VITE_API_URL + '/my_country')
        .then(response => {
          if (response.data.country === 'AT') {
            this.active = true
          }
        })
    }
  },
  methods: {
    cancelInfo () {
      this.active = false
      localStorage.setItem('basemapAtInfoShown', true)
    },
    switchMap () {
      this.cancelInfo()
      this.$store.commit('setMapType', 'basemapat')
    }
  },
  data () {
    return {
      active: false
    }
  }
}
</script>

<style scoped>
>>> .modal-content {
  max-width: 40rem !important;
  max-height: calc(100vh - 80px);
}
.button {
  margin: 0.4rem 0.5rem 0.4rem 0.5rem;
  width: 100%;
  max-width: 20rem;
  text-align: center;
}
.action-buttons {
  margin-top: 0.75rem;
}
.flag {
  font-size: 3rem;
}
.basemapat-info {
  max-width: 20rem;
  max-height: 30vh;
  margin: 0.5rem 0;
}
</style>
