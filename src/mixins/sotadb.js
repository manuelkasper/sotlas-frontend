import axios from 'axios'
import ssoauth from './ssoauth.js'

export default {
  mixins: [ssoauth],
  methods: {
    loadActivations (callsign) {
      return axios.get(process.env.VUE_APP_API_URL + '/activations/' + callsign)
        .then(response => {
          return response.data
        })
    },
    loadActivationDetails (activationId) {
      return this.axiosAuth.get('https://api-db2.sota.org.uk/logs/activation/detailed/' + this.activationId)
        .then(response => {
          return response.data[0]
        })
    },
    loadS2SLog (userId, year) {
      return this.axiosAuth.get('https://api-db2.sota.org.uk/logs/s2s/' + userId + '/' + year + '/1')
        .then(response => {
          return response.data
        })
    },
    loadMyChaserUniques () {
      if (this.$store.state.myChasedSummits) {
        return Promise.resolve(this.$store.state.myChasedSummits)
      } else {
        return this._loadMore('https://api-db.sota.org.uk/admin/secure/my_chaser_uniques', [], 1)
          .then(myChaserUniques => {
            let myChasedSummits = new Set()
            myChaserUniques.forEach(ent => {
              myChasedSummits.add(ent.Summit.substring(0, ent.Summit.indexOf(' ')))
            })
            this.$store.commit('setMyChasedSummits', myChasedSummits)
            return myChasedSummits
          })
      }
    },
    loadMyActivatorUniques () {
      if (this.$store.state.myActivatedSummits) {
        return Promise.resolve(this.$store.state.myActivatedSummits)
      } else {
        return this._loadMore('https://api-db.sota.org.uk/admin/secure/my_activator_uniques', [], 1)
          .then(myActivatorUniques => {
            let myActivatedSummits = new Set()
            myActivatorUniques.forEach(ent => {
              myActivatedSummits.add(ent.Summit.substring(0, ent.Summit.indexOf(' ')))
            })
            this.$store.commit('setMyActivatedSummits', myActivatedSummits)
            return myActivatedSummits
          })
      }
    },
    loadMyActivatorUniquesThisYear () {
      if (this.$store.state.myActivatedSummitsThisYear) {
        return Promise.resolve(this.$store.state.myActivatedSummitsThisYear)
      } else {
        return this.axiosAuth.get('https://api-db2.sota.org.uk/logs/activator/8877/' + new Date().getUTCFullYear() + '/1')
          .then(response => {
            let myActivatedSummitsThisYear = new Set()
            response.data.forEach(ent => {
              myActivatedSummitsThisYear.add(ent.Summit.substring(0, ent.Summit.indexOf(' ')))
            })
            this.$store.commit('setMyActivatedSummitsThisYear', myActivatedSummitsThisYear)
            return myActivatedSummitsThisYear
          })
      }
    },
    _loadMore (url, data, start) {
      return this.axiosAuth.get(url, { params: { start } })
        .then(response => {
          data = data.concat(response.data)
          if (response.data.length > 0) {
            // more data to be expected
            return this._loadMore(url, data, start + response.data.length)
          } else {
            return data
          }
        })
    }
  }
}
