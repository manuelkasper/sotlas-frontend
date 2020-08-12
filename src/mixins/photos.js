export default {
  methods: {
    photoSrc (photo, size) {
      return 'https://images.sotl.as/photos/' + size + '/' + photo.filename.substring(0, 2) + '/' + photo.filename
    }
  }
}
