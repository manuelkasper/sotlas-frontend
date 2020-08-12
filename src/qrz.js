import axios from 'axios'
import qs from 'qs'

let sessionKey

export default class QRZInterface {
  static login (force = false) {
    if (sessionKey && !force) {
      return
    }

    let qrzLogin = JSON.parse(localStorage.getItem('qrzLogin'))

    return axios.post('https://xmldata.qrz.com/xml/current/',
      qs.stringify({ username: qrzLogin.qrzUsername, password: qrzLogin.qrzPassword }))
      .then(response => {
        let loginRes = new DOMParser().parseFromString(response.data, 'text/xml')
        console.dir(loginRes.getElementsByTagName('Session'))
      })
  }
  static lookupCallsign (callsign) {
    QRZInterface.login()
  }
}
