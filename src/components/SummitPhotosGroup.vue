<template>
  <div class="photo-group box">
    <div class="photo-group-title">
      <slot name="title"></slot>
    </div>
    <PictureSwipe ref="pictureSwipe" class="photos" :items="swipeItems" :options="swipeOptions" @mouseoverPicture="mouseoverPicture" @mouseleavePicture="mouseleavePicture" @editPicture="onEditPicture" @deletePicture="onDeletePicture" @movePicture="onMovePicture" />
    <b-button v-if="waypointPhotos.length > 0 && !$mq.mobile && showWaypointButton" class="waypoints-button" icon-left="file-download" size="is-small" @click="downloadWaypoints">Photo waypoints (.gpx)</b-button>
  </div>
</template>

<script>
import PictureSwipe from './PictureSwipe.vue'
import utils from '../mixins/utils.js'
import photos from '../mixins/photos.js'
import moment from 'moment'
import togpx from 'togpx'

export default {
  name: 'SummitPhotosGroup',
  props: {
    photos: Array,
    summit: Object,
    editable: Boolean,
    showSummitName: Boolean,
    showWaypointButton: Boolean
  },
  components: {
    PictureSwipe
  },
  mixins: [utils, photos],
  computed: {
    swipeItems () {
      let largeSize = 1600
      return this.photos.map(photo => {
        let largeW = photo.width
        let largeH = photo.height
        if (largeW > largeSize) {
          largeH = Math.round(largeH * largeSize / largeW)
          largeW = largeSize
        }
        if (largeH > largeSize) {
          largeW = Math.round(largeW * largeSize / largeH)
          largeH = largeSize
        }

        return {
          src: this.photoSrc(photo, 'large'),
          msrc: this.photoSrc(photo, 'thumb'),
          osrc: this.photoSrc(photo, 'original'),
          w: largeW,
          h: largeH,
          title: this.makeTitleHtml(photo),
          thumbTitle: photo.title,
          editable: (this.editable && this.$keycloak && this.$keycloak.authenticated && this.$keycloak.tokenParsed.callsign === photo.author),
          filename: photo.filename
        }
      })
    },
    swipeOptions () {
      return {
        bgOpacity: 0.85,
        loop: true,
        history: false,
        closeOnScroll: false
      }
    },
    waypointPhotos () {
      return this.photos.filter(photo => {
        return (photo.coordinates && (!photo.positioningError || photo.positioningError <= 100))
      })
    }
  },
  methods: {
    makeTitleHtml (photo) {
      let html = '<div class="photo-title">' + this.escapeHtml(photo.title).replace('\n', '<br />')
      let authorLine = ''
      if (photo.author) {
        authorLine = this.escapeHtml(photo.author.toUpperCase())
      }
      if (photo.date) {
        authorLine += ' on ' + moment.utc(photo.date).format('DD MMM YYYY HH:mm:ss')
      }
      if (photo.camera) {
        authorLine += ', ' + this.escapeHtml(photo.camera)
      }
      if (photo.coordinates) {
        authorLine += ', Coordinates: <a href="/map/coordinates/' + photo.coordinates.latitude.toFixed(5) + ',' + photo.coordinates.longitude.toFixed(5) + '/16.0?popup=1">' + photo.coordinates.latitude.toFixed(5) + ', ' + photo.coordinates.longitude.toFixed(5) + '</a>'
        if (photo.positioningError) {
          if (photo.positioningError >= 1000) {
            authorLine += ' (± ' + (photo.positioningError / 1000).toFixed(1) + ' km)'
          } else {
            authorLine += ' (± ' + photo.positioningError + ' m)'
          }
        }
      }
      if (authorLine) {
        html += '<div class="author">' + authorLine + '</div>'
      }
      html += '</div>'
      return html
    },
    openPhoto (photo) {
      let photoIndex = this.photos.findIndex(curPhoto => curPhoto.filename === photo.filename)
      if (photoIndex !== -1) {
        this.$refs.pictureSwipe.open(photoIndex, true)
      }
    },
    mouseoverPicture (picture) {
      this.photos.forEach(photo => {
        if (photo.filename === picture.filename && !photo.highlight) {
          this.$set(photo, 'highlight', true)
        } else if (photo.highlight) {
          this.$set(photo, 'highlight', false)
        }
      })
    },
    mouseleavePicture (picture) {
      this.$set(this.photos.find(photo => photo.filename === picture.filename), 'highlight', false)
    },
    onEditPicture (picture) {
      this.$emit('editPhoto', picture)
    },
    onDeletePicture (picture) {
      this.$emit('deletePhoto', picture)
    },
    onMovePicture (newIndex, oldIndex, picture) {
      // Make new array of filenames in desired order
      let filenames = this.photos.map(photo => photo.filename)
      filenames.splice(newIndex, 0, filenames.splice(oldIndex, 1)[0])
      this.$emit('reorderPhotos', filenames)
    },
    downloadWaypoints () {
      let features = this.waypointPhotos.map(photo => {
        let feature = {
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': [photo.coordinates.longitude, photo.coordinates.latitude]
          }
        }
        if (photo.title) {
          feature.properties = {
            'name': photo.title
          }
        }
        return feature
      })

      let gpx = togpx({
        'type': 'FeatureCollection',
        'features': features
      })
      let blob = new Blob([gpx], { type: 'application/gpx+xml' })
      let url = window.URL.createObjectURL(blob)
      let link = document.createElement('a')
      link.download = 'photos-' + this.summit.code.replace('/', '_') + '-' + this.title + '.gpx'
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  }
}
</script>

<style scoped>
.photos >>> figure {
  margin: 0 0.75rem 0.75rem 0;
}
.photos >>> figure img {
  max-height: 128px;
  max-width: 300px;
  background-color: #e7e7e7;
}
>>> .photo-title {
  font-size: 1rem;
}
>>> .photo-title .author {
  font-size: 0.8rem;
  margin-top: 0.2em;
}
.photo-group {
  background: whitesmoke;
  padding: 0.25rem 0 0 0.75rem;
  display: inline-block;
  margin-bottom: 0.75rem;
  margin-right: 0.75rem;
}
.photo-group-title {
  color: #777;
  font-size: 0.8em;
  font-weight: bold;
  margin-bottom: 0.2rem;
  margin-right: 0.75rem;
}
.photo-group-title a {
  color: #777;
}
.photo-group-title a:hover {
  color: #3273dc;
}
@media (max-width: 768px) {
  .photos >>> figure {
    margin: 0 0.5rem 0.5rem 0;
  }
  .photos >>> figure img {
    max-height: 104px;
    max-width: 242px;
  }
  .photo-group {
    padding: 0.25rem 0 0 0.5rem;
  }
}
.waypoints-button {
  margin-bottom: 0.75rem;
  margin-right: 0.75rem;
}
</style>
