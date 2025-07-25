export default {
  methods: {
    photoSrc (photo, size) {
      if (size === 'original') {
        return import.meta.env.VITE_PHOTOS_ORIGINAL_URL + '/' + photo.filename
      } else {
        return import.meta.env.VITE_PHOTOS_URL + '/' + size + '/' + photo.filename
      }
    }
  }
}
