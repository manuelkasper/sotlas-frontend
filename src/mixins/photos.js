export default {
  methods: {
    photoSrc (photo, size) {
      if (size === 'original') {
        return process.env.VUE_APP_PHOTOS_ORIGINAL_URL + '/' + photo.filename
      } else {
        return process.env.VUE_APP_PHOTOS_URL + '/' + size + '/' + photo.filename
      }
    }
  }
}
