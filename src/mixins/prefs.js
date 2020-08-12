export default {
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
    getPrefs (key) {
      if (localStorage.getItem(key)) {
        try {
          return JSON.parse(localStorage.getItem(key))
        } catch (e) {
          localStorage.removeItem(this.$options.prefs.key)
        }
      }
      return undefined
    },
    setPrefs (key, prefs) {
      localStorage.setItem(key, JSON.stringify(prefs))
    }
  }
}
