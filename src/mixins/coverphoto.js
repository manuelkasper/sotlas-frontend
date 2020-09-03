import photos from '../mixins/photos.js'
import Wikipedia from '../wikipedia.js'

export default {
  mixins: [photos],
  computed: {
    coverPhoto () {
      if (this.summit.photos) {
        let coverPhoto = this.summit.photos.find(photo => photo.isCover)
        if (coverPhoto) {
          return {
            src: this.photoSrc(coverPhoto, 'thumb'),
            mediaLink: this.photoSrc(coverPhoto, 'large'),
            attribution: coverPhoto.author,
            photo: coverPhoto
          }
        }
      }

      if (this.wikipediaPhoto) {
        return this.wikipediaPhoto
      }

      return null
    }
  },
  watch: {
    summit: {
      handler (newSummit, oldSummit) {
        if (!newSummit.code) {
          return
        }
        if (newSummit && oldSummit && newSummit.code === oldSummit.code && this.wikipediaPhoto !== null) {
          return
        }

        this.wikipediaPhoto = null

        if (!this.alwaysLoadWikipedia && this.summit.photos && this.summit.photos.some(photo => photo.isCover)) {
          // We have our own photo; no need to load
          return
        }

        let loadingSummit = this.summit
        Wikipedia.loadSummitPhoto(this.summit, 320)
          .then(photo => {
            if (!photo) {
              return
            }
            let preloadImg = new Image()
            preloadImg.onload = () => {
              if (this.summit && loadingSummit.code === this.summit.code) {
                this.wikipediaPhoto = photo
              }
            }
            preloadImg.src = photo.src
          })
      },
      immediate: true
    }
  },
  data () {
    return {
      wikipediaPhoto: null
    }
  }
}
