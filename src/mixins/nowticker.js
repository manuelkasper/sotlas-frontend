import moment from 'moment'

export default {
  created () {
    this.nowticker = setInterval(() => {
      this.now = moment()
    }, 60000)
  },
  destroyed () {
    clearInterval(this.nowticker)
  },
  methods: {
    recentClass (timestamp) {
      let diff = this.now.diff(moment.utc(timestamp))
      if (diff < 30 * 60 * 1000) {
        return { 'recent1': true }
      } else if (diff < 60 * 60 * 1000) {
        return { 'recent2': true }
      } else {
        return {}
      }
    }
  },
  data () {
    return {
      now: moment()
    }
  }
}
