import axios from 'axios'

function reportMapSession (type, sessionId) {
  axios.post(import.meta.env.VITE_API_URL + '/mapsession', { type, sessionId })
}

export default reportMapSession
