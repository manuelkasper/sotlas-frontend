import moment from 'moment'

let bands = [
  { from: 1.8, to: 2, band: '160m' },
  { from: 3.5, to: 4, band: '80m' },
  { from: 5, to: 5.5, band: '60m' },
  { from: 7, to: 7.3, band: '40m' },
  { from: 10, to: 10.2, band: '30m' },
  { from: 14, to: 14.5, band: '20m' },
  { from: 18, to: 18.2, band: '17m' },
  { from: 21, to: 21.5, band: '15m' },
  { from: 24, to: 25, band: '12m' },
  { from: 28, to: 30, band: '10m' },
  { from: 50, to: 54, band: '6m' },
  { from: 70, to: 71, band: '4m' },
  { from: 144, to: 148, band: '2m' },
  { from: 219, to: 225, band: '1.25m' },
  { from: 430, to: 440, band: '70cm' },
  { from: 900, to: 928, band: '33cm' },
  { from: 1200, to: 1400, band: '23cm' },
  { from: 2300, to: 2450, band: '13cm' },
  { from: 3300, to: 3500, band: '9cm' },
  { from: 5600, to: 5925, band: '5cm' },
  { from: 10000, to: 10500, band: '3cm' },
  { from: 24000, to: 24250, band: '1.2cm' }
]

let continents = {
  'AF': 'Africa',
  'AS': 'Asia',
  'EU': 'Europe',
  'NA': 'North America',
  'OC': 'Oceania',
  'SA': 'South America'
}

let modes = {
  'cw': 'CW',
  'ssb': 'SSB',
  'fm': 'FM',
  'data': 'Data',
  'am': 'AM',
  'dv': 'DV',
  'other': 'Other'
}

export default {
  filters: {
    formatActivationDate (date) {
      return moment.utc(date).format('DD MMM YYYY')
    },
    formatDistance (distance) {
      return (distance / 1000).toFixed(1) + ' km'
    },
    formatDuration (duration) {
      let durationText = ''
      if (duration > 60) {
        durationText += Math.floor(duration / 60) + ' h '
        duration %= 60
      }
      if (duration > 0) {
        durationText += duration + ' m'
      }
      return durationText
    },
    formatFrequency (frequency) {
      if (frequency === null || frequency === undefined) {
        return frequency
      }
      frequency = String(frequency)
      let matches = frequency.match(/^(\d+)(?:\.(\d+))?$/)
      if (matches) {
        let mhz = matches[1]
        let khz = matches[2]
        if (!khz) {
          khz = '0'
        }
        while (khz.length < 3) {
          khz += '0'
        }
        while (khz.length > 3 && khz[khz.length - 1] === '0') {
          khz = khz.substr(0, khz.length - 1)
        }
        return mhz + '.' + khz
      } else {
        return frequency
      }
    }
  },
  computed: {
    authenticated () {
      if (this.$keycloak) {
        return this.$keycloak.authenticated
      } else {
        return undefined
      }
    },
    myCallsign () {
      if (!this.authenticated || !this.$keycloak.tokenParsed.callsign) {
        return null
      }
      return this.homeCallsign(this.$keycloak.tokenParsed.callsign)
    },
    myUserId () {
      if (!this.authenticated || !this.$keycloak.tokenParsed.userid) {
        return null
      }
      return parseInt(this.$keycloak.tokenParsed.userid)
    },
    isTouchDevice () {
      let prefixes = ' -webkit- -moz- -o- -ms- '.split(' ')
      let mq = function (query) {
        return window.matchMedia(query).matches
      }
      if (('ontouchstart' in window) || (window.DocumentTouch && document instanceof window.DocumentTouch)) {
        return true
      }
      let query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('')
      return mq(query)
    }
  },
  methods: {
    formatActivationDate (date) {
      return moment.utc(date).format('DD MMM YYYY')
    },
    formatTime (date) {
      return moment.utc(date).format('HH:mm') + 'z'
    },
    formatTimeDay (date) {
      let mdate = moment.utc(date)
      let format = moment.utc(date).format('HH:mm') + 'z'
      if (!moment.utc().isSame(mdate, 'day')) {
        format += '<span class="time-weekday">' + mdate.format('ddd') + '</span>'
      }
      return format
    },
    formatDateTimeRelative (date) {
      let dmoment = moment.utc(date)
      let dateFormatted
      if (dmoment.diff(moment.utc(), 'days') < 7) {
        dateFormatted = dmoment.format('ddd')
      } else {
        if (dmoment.isSame(moment.utc(), 'year')) {
          dateFormatted = dmoment.format('DD MMM')
        } else {
          dateFormatted = dmoment.format('DD MMM YYYY')
        }
      }
      return '<span class="date-small">' + dateFormatted + '</span>' + dmoment.format('HH:mm') + 'z'
    },
    makeActivatorLink (callsign) {
      let parts = callsign.replace(/ /g, '').split(/\//)
      // Return longest part only
      let longestPart = ''
      parts.forEach(part => {
        if (part.length > longestPart.length) {
          longestPart = part
        }
      })
      return '/activators/' + longestPart
    },
    makeActivatorLinkUserId (userId) {
      return '/activators/' + userId
    },
    makeSummitLink (summitCode) {
      return '/summits/' + summitCode
    },
    isSummitValid (summit) {
      if (!summit.validFrom) {
        return true
      }

      let validFrom = moment(summit.validFrom)
      let validTo = moment(summit.validTo)
      return (moment.utc().isAfter(validFrom) && moment().isBefore(validTo))
    },
    isCallsign (text) {
      return text.match(/^[a-z]+\d+[a-z]+$/i)
    },
    homeCallsign (callsign, normalizeUk = true) {
      let parts = callsign.toUpperCase().replace(/ /g, '').split('/')
      let longestPart = ''
      parts.forEach(part => {
        if (part.length > longestPart.length) {
          longestPart = part
        }
      })

      if (normalizeUk) {
        // For UK callsigns, normalize them all to 2E/G/M for the sake of comparison
        let matches = longestPart.match(/^(2[DEIJMUW]|G[DIJMUW]?|M[DIJMUW]?)(\d[A-Z]{2,3})$/)
        if (matches) {
          longestPart = matches[1].replace(/^2./, '2E').replace(/^G[DIJMUW]/, 'G').replace(/^M[DIJMUW]/, 'M') + matches[2]
        }
      }

      return longestPart
    },
    allBands () {
      return bands.map(band => {
        return band.band
      })
    },
    allContinents () {
      return continents
    },
    allModes () {
      return modes
    },
    bandForFrequency (frequency) {
      frequency = parseFloat(frequency)
      let band = bands.find((element) => {
        return (element.from <= frequency && element.to >= frequency)
      })
      if (band !== undefined) {
        return band.band
      } else {
        return undefined
      }
    },
    bandForDbFrequency (dbFrequency) {
      return this.bandForFrequency(this.dbFrequencyToMHz(dbFrequency))
    },
    dbFrequencyToMHz (dbFrequency) {
      let matches = /^([0-9.]+)([GM]Hz)$/.exec(dbFrequency)
      if (matches) {
        let multiplier = 1
        if (matches[2] === 'GHz') {
          multiplier = 1000
        }
        return parseFloat(matches[1]) * multiplier
      } else {
        return dbFrequency
      }
    },
    escapeHtml (unsafe) {
      if (unsafe === undefined || unsafe === null) {
        return ''
      }
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    }
  }
}
