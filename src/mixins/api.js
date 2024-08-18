import axios from 'axios'
import ssoauth from './ssoauth.js'

export default {
  mixins: [ssoauth],
  methods: {
    loadActivations (callsign) {
      return axios.get(process.env.VUE_APP_API_URL + '/activations/' + callsign)
        .then(response => {
          return response.data
        })
    },
    uploadPhoto (summitCode, file, progress, cancelToken) {
      let formData = new FormData()
      formData.append('photo', file)
      return this.axiosAuth.post(process.env.VUE_APP_API_URL + '/photos/summits/' + summitCode + '/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: progress,
        cancelToken
      })
    },
    deletePhoto (summitCode, filename) {
      return this.axiosAuth.delete(process.env.VUE_APP_API_URL + '/photos/summits/' + summitCode + '/' + filename)
    },
    editPhoto (summitCode, filename, data) {
      return this.axiosAuth.post(process.env.VUE_APP_API_URL + '/photos/summits/' + summitCode + '/' + filename, data)
    },
    reorderPhotos (summitCode, filenames) {
      return this.axiosAuth.post(process.env.VUE_APP_API_URL + '/photos/summits/' + summitCode + '/reorder', { filenames })
    },
    loadActivator (userIdOrCallsign) {
      return axios.get(process.env.VUE_APP_API_URL + '/activators/' + userIdOrCallsign)
        .then(response => {
          return response.data
        })
    }
  }
}
