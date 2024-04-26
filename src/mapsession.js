import axios from 'axios'

let mapSessionReported = false

function reportMapSession () {
  if (mapSessionReported) {
    return
  }
  axios.post(process.env.VUE_APP_API_URL + '/mapsession', { type: 'first' })
    .catch(() => {})
  mapSessionReported = true
}

export default reportMapSession
