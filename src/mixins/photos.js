export default {
  methods: {
    photoSrc (photo, size) {
      if (size === 'original') {
        return 'https://sotlas.s3.eu-central-003.backblazeb2.com/' + photo.filename
      } else {
        return 'https://images.sotl.as/photos/' + size + '/' + photo.filename.substring(0, 2) + '/' + photo.filename
      }
    }
  }
}
