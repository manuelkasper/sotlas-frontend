import api from '@/mixins/api'
import utils from '@/mixins/utils'

export default {
  mixins: [api, utils],
  mounted () {
    if (this.$options.prefs) {
      this.loadPrefs()

      this.$options.prefs.props.forEach(key => {
        this.$watch(key, () => {
          this.savePrefs()
        })
      })
    }
  },
  methods: {
    loadPrefs () {
      let prefs = this.getPrefs(this.$options.prefs.key)

      if (prefs) {
        this.$options.prefs.props.forEach(key => {
          this[key] = prefs[key]
        })
      }
    },
    savePrefs () {
      let prefs = {}
      this.$options.prefs.props.forEach(key => {
        prefs[key] = this[key]
      })
      this.setPrefs(this.$options.prefs.key, prefs)
    },
    getPrefsFromLocalStorage (key) {
      if (localStorage.getItem(key)) {
        try {
          return JSON.parse(localStorage.getItem(key))
        } catch (e) {
          localStorage.removeItem(this.$options.prefs.key)
        }
      }
      return undefined
    },
    getPrefs (key) {
      if (!this.authenticated) {
        return this.getPrefsFromLocalStorage(key)
      }

      this.getPersonalData().then(response => {
        if (response[key]) {
          this.setPrefsToLocalStorage(key, response[key])
          return JSON.parse(response[key])
        }
        return this.getPrefsFromLocalStorage(key)
      }).catch(() => {
        return this.getPrefsFromLocalStorage(key)
      })
    },
    setPrefsToLocalStorage (key, prefs) {
      localStorage.setItem(key, JSON.stringify(prefs))
    },
    setPrefs (key, prefs) {
      if (this.authenticated) {
        this.postPersonalSettings(key, prefs)
      }
      this.setPrefsToLocalStorage(key, prefs)
    }
  }
}
