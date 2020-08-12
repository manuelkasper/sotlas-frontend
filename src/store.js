import Vue from 'vue'
import Vuex from 'vuex'
import VueNativeSock from 'vue-native-websocket'
import EventBus from './event-bus'
import { decompressKeys } from './keyzipper'
import axios from 'axios'

Vue.use(Vuex)

const MAX_SPOT_AGE = 86400000
const ALERT_UPDATE_INTERVAL = 300000

let altitudeUnits = localStorage.getItem('altitudeUnits')
if (altitudeUnits !== 'ft' && altitudeUnits !== 'm') {
  // Default depends on browser language
  if (navigator.language === 'en-US') {
    altitudeUnits = 'ft'
  } else {
    altitudeUnits = 'm'
  }
}

const store = new Vuex.Store({
  state: {
    socket: {
      isConnected: false,
      reconnectError: false
    },
    spots: [],
    alerts: [],
    rbnFilter: {},
    altitudeUnits: altitudeUnits,
    myActivatedSummits: null,
    myChasedSummits: null,
    myActivatedSummitsThisYear: null,
    homeQth: null
  },
  mutations: {
    SOCKET_ONOPEN (state, event) {
      Vue.prototype.$socket = event.currentTarget
      state.socket.isConnected = true
      event.currentTarget.sendObj({ rbnFilter: state.rbnFilter })
    },
    SOCKET_ONCLOSE (state, event) {
      state.socket.isConnected = false
    },
    SOCKET_ONERROR (state, event) {
      console.error(state, event)
      state.socket.isConnected = false
    },
    SOCKET_ONMESSAGE (state, message) {
      if (message.spots) {
        state.spots = decompressKeys(message.spots)
      } else if (message.spot) {
        updateSpot(state, decompressKeys(message.spot))
      } else if (message.deleteSpot) {
        deleteSpotById(state, message.deleteSpot.id)
      } else if (message.rbnSpot) {
        EventBus.$emit('rbnSpot', decompressKeys(message.rbnSpot))
      } else if (message.rbnSpotHistory) {
        EventBus.$emit('rbnSpotHistory', decompressKeys(message.rbnSpotHistory), message.viewId)
      }
    },
    SOCKET_RECONNECT (state, count) {
      console.info(state, count)
    },
    SOCKET_RECONNECT_ERROR (state) {
      state.socket.reconnectError = true
    },
    setRbnFilter (state, newRbnFilter) {
      state.rbnFilter = newRbnFilter
      if (state.socket.isConnected) {
        Vue.prototype.$socket.sendObj({ rbnFilter: state.rbnFilter })
      }
    },
    setAlerts (state, newAlerts) {
      state.alerts = newAlerts
    },
    changeAltitudeUnits (state, newAltitudeUnits) {
      state.altitudeUnits = newAltitudeUnits
      localStorage.setItem('altitudeUnits', newAltitudeUnits)

      // Force a reload now to avoid problems with map layer visibility changing etc.
      window.location.reload()
    },
    updateSpot (state, spot) {
      updateSpot(state, spot)
    },
    deleteSpot (state, spot) {
      deleteSpotById(state, spot.id)
    },
    setMyActivatedSummits (state, newMyActivatedSummits) {
      state.myActivatedSummits = newMyActivatedSummits
    },
    setMyChasedSummits (state, newMyChasedSummits) {
      state.myChasedSummits = newMyChasedSummits
    },
    setMyActivatedSummitsThisYear (state, newMyActivatedSummitsThisYear) {
      state.myActivatedSummitsThisYear = newMyActivatedSummitsThisYear
    },
    setHomeQth (state, newHomeQth) {
      state.homeQth = newHomeQth
    }
  },
  actions: {
    reloadAlerts (context) {
      loadAlerts(true)
    }
  }
})

function updateSpot (state, spot) {
  // Check if we already have a spot with this ID and need to update it
  let existingSpotIndex = state.spots.findIndex(existingSpot => {
    return existingSpot.id === spot.id
  })
  if (existingSpotIndex !== -1) {
    state.spots.splice(existingSpotIndex, 1, spot)
  } else {
    state.spots.push(spot)
    EventBus.$emit('sotaSpot', spot)
  }
  removeExpiredSpots(state)
}

function deleteSpotById (state, spotId) {
  let existingSpotIndex = state.spots.findIndex(existingSpot => {
    return existingSpot.id === spotId
  })
  if (existingSpotIndex !== -1) {
    state.spots.splice(existingSpotIndex, 1)
  }
}

function removeExpiredSpots (state) {
  let now = new Date()
  while (state.spots.length > 0) {
    if ((now - new Date(state.spots[0].timeStamp)) > MAX_SPOT_AGE) {
      state.spots.shift()
    } else {
      break
    }
  }
}

function loadAlerts (noCache) {
  let params = {}
  if (noCache) {
    params.noCache = 1
  }
  axios.get('https://api.sotl.as/alerts', { params })
    .then(response => {
      store.commit('setAlerts', response.data)
    })
}

loadAlerts(false)
setInterval(loadAlerts, ALERT_UPDATE_INTERVAL)

Vue.use(VueNativeSock, 'wss://api.sotl.as/ws', {
  format: 'json',
  store,
  reconnection: true,
  reconnectionDelay: 1000
})

export default store
