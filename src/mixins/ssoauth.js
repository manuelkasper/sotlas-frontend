import axios from 'axios'

export default {
  computed: {
    axiosAuth () {
      let instance = axios.create()
      instance.interceptors.request.use(config => new Promise((resolve, reject) => {
        if (!this.$keycloak || !this.$keycloak.authenticated) {
          reject(new Error('not logged in'))
        } else {
          this.$keycloak.updateToken(60)
            .success(() => {
              config.headers.Authorization = 'Bearer ' + this.$keycloak.token
              resolve(config)
            })
            .error(e => {
              reject(e)
            })
        }
      }))
      return instance
    },
    axiosAuthId () {
      let instance = axios.create()
      instance.interceptors.request.use(config => new Promise((resolve, reject) => {
        if (!this.$keycloak || !this.$keycloak.authenticated) {
          reject(new Error('not logged in'))
        } else {
          this.$keycloak.updateToken(60)
            .success(() => {
              config.headers.Authorization = 'Bearer ' + this.$keycloak.token
              config.headers.id_token = this.$keycloak.idToken
              resolve(config)
            })
            .error(e => {
              reject(e)
            })
        }
      }))
      return instance
    }
  }
}
