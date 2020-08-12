export default {
  methods: {
    trackUrl (track, size = 'simple') {
      return 'https://sotl.as/tracks/' + size + '/' + track.filename.substring(0, 2) + '/' + track.filename
    }
  }
}
