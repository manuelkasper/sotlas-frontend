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
    getPersonalData () {
      return this.axiosAuth.get('https://api.sotl.as/users/me')
    },
    postPersonalSettings (key, value) {
      return this.axiosAuth.post('https://api.sotl.as/users/me/settings', { [key]: value })
    },
    getPersonalSummitData (summitCode) {
      return this.axiosAuth.get('https://api.sotl.as/users/me/summit/' + summitCode)
    },
    postPersonalSummitData (summitCode, isBookmarked, notes, tags) {
      return this.axiosAuth.post('https://api.sotl.as/users/me/summit/' + summitCode, {
        isBookmarked: isBookmarked,
        notes: notes,
        tags: tags })
    },
    getPersonalSummitTags () {
      return this.axiosAuth.get('https://api.sotl.as/users/me/tags')
    },
    getPersonalSummitsFromTag (tagName) {
      return this.axiosAuth.get('https://api.sotl.as/users/me/summits/tags', { params: { q: tagName } })
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
    }
  }
}
