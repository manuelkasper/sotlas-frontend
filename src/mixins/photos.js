export default {
  methods: {
    photoSrc (photo, size) {
      if (size === 'original') {
        return 'https://sotlas-photos.s3.eu-central-003.backblazeb2.com/original/' + photo.filename
      } else {
        return 'https://images.sotl.as/photos/' + size + '/' + photo.filename.substring(0, 2) + '/' + photo.filename
      }
    }
  }
}
