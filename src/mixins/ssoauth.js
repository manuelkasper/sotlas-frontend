import axios from 'axios'

export default {
  computed: {
    axiosAuth () {
      return this.createAxiosAuth(false)
    },
    axiosAuthId () {
      return this.createAxiosAuth(true)
    },
    axiosAuthOptional () {
      return this.createAxiosAuth(false, true)
    }
  },
  methods: {
    createAxiosAuth (includeId = false, optional = false) {
      let instance = axios.create()
      instance.interceptors.request.use(config => new Promise((resolve, reject) => {
        if (!this.$keycloak || !this.$keycloak.authenticated) {
          if (optional) {
            resolve(config)
          } else {
            reject(new Error('not logged in'))
          }
        } else {
          this.$keycloak.updateToken(60)
            .then(() => {
              config.headers.Authorization = 'Bearer ' + this.$keycloak.token
              if (includeId) {
                config.headers.id_token = this.$keycloak.idToken
              }
              resolve(config)
            })
            .catch(e => {
              reject(e)
            })
        }
      }))
      return instance
    }
  }
}
