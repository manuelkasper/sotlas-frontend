<template>
  <b-modal :active.sync="active" :on-cancel="cancelInfo" :can-cancel="false">
    <div class="box content">
      <div class="has-text-centered">
        <span class="fp ch flag"></span>
      </div>
      <h3>swisstopo-Karte jetzt verfügbar</h3>
      <p>Auf SOTLAS kann man nun auch die moderne swisstopo Vektor-Karte nutzen. Einfach den Kartentyp umstellen, fertig!</p>
      <div class="has-text-centered is-hidden-touch">
        <img class="swisstopo-info" src="../assets/swisstopo-info.png" />
      </div>
      <div>
        <h5>Weitere Funktionen:</h5>
        <ul>
          <li>Skitourenrouten</li>
          <li>Schneeschuhrouten</li>
          <li>Hangneigungsklassen über 30°</li>
          <li>Wildschutzgebiete</li>
        </ul>
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
  name: 'SwisstopoInfo',
  mounted () {
    if (!localStorage.getItem('swisstopoInfoShown')) {
      // Check if we are in Switzerland
      axios.get('https://api.sotl.as/my_country')
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
.swisstopo-info {
  max-width: 20rem;
  max-height: 30vh;
  margin: 0.5rem 0;
}
</style>
