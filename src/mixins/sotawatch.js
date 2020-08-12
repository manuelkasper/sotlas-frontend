import ssoauth from './ssoauth.js'

export default {
  mixins: [ssoauth],
  methods: {
    postSotaWatchSpot (params) {
      return this.axiosAuthId.post('https://api2.sota.org.uk/api/spots', params)
    },
    deleteSotaWatchSpot (spotId) {
      return this.axiosAuthId.delete('https://api2.sota.org.uk/api/spots/' + spotId)
    },
    postSotaWatchAlert (params) {
      return this.axiosAuthId.post('https://api2.sota.org.uk/api/alerts', params)
    },
    deleteSotaWatchAlert (alertId) {
      return this.axiosAuthId.delete('https://api2.sota.org.uk/api/alerts/' + alertId)
    }
  }
}
