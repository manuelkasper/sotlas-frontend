<template>
  <div class="inline">
    <div v-for="group in groups" :key="group.key">
      <SummitPhotosGroup ref="photosGroup" :photos="group.photos" :title="group.title" :titleLink="group.titleLink" :summit="summit" :editable="editable" :showSummitName="showSummitName" :showWaypointButton="showWaypointButton" @editPhoto="onEditPhoto" @deletePhoto="onDeletePhoto" @reorderPhotos="onReorderPhotos">
        <template v-slot:title>
          <template v-if="showSummitName">
            <router-link :to="group.titleLink">{{ group.title }}</router-link><span class="has-text-weight-normal"> on </span><router-link :to="'/summits/' + summit.code">{{ summit.name }} <span class="has-text-weight-normal">(<AltitudeLabel :altitude="summit.altitude" />, {{ summit.code }})</span></router-link>
          </template>
          <template v-else>
            <router-link :to="group.titleLink">{{ group.title }}</router-link>
          </template>
        </template>
      </SummitPhotosGroup>
    </div>
    <b-modal :active.sync="isEditorActive" has-modal-card trap-focus aria-role="dialog" aria-modal>
      <EditPhoto v-if="editingPhoto" :photo="editingPhoto" :summitCode="summit.code" @photoEdited="$emit('photoEdited')" />
    </b-modal>
  </div>
</template>

<script>
import SummitPhotosGroup from './SummitPhotosGroup.vue'
import EditPhoto from './EditPhoto.vue'
import AltitudeLabel from './AltitudeLabel.vue'
import utils from '../mixins/utils.js'
import api from '../mixins/api.js'
import moment from 'moment'

export default {
  name: 'SummitPhotos',
  props: {
    summit: Object,
    minDate: Date,
    editable: Boolean,
    showSummitName: Boolean,
    showWaypointButton: Boolean
  },
  components: {
    SummitPhotosGroup, EditPhoto, AltitudeLabel
  },
  mixins: [utils, api],
  computed: {
    groups () {
      if (!this.summit || !this.summit.photos) {
        return []
      }

      // Group photos by author
      let authorGroups = new Map()
      let summitPhotos = this.summit.photos
      if (this.minDate) {
        summitPhotos = summitPhotos.filter(photo => {
          return moment(photo.uploadDate).isSameOrAfter(moment(this.minDate))
        })
      }
      summitPhotos.forEach(photo => {
        let authorGroup = authorGroups.get(photo.author)
        if (!authorGroup) {
          authorGroup = {
            author: photo.author.toUpperCase(),
            title: photo.author.toUpperCase(),
            titleLink: '/activators/' + photo.author.toUpperCase(),
            photos: []
          }
          authorGroups.set(photo.author, authorGroup)
        }
        authorGroup.photos.push(photo)
      })

      // Sort photos within group by sort order, then by photo date, then by upload date
      authorGroups.forEach((authorGroup, author) => {
        authorGroup.photos.sort((a, b) => {
          // No sort order = place at end
          let sa = a.sortOrder || 1000000
          let sb = b.sortOrder || 1000000

          if (sa < sb) {
            return -1
          } else if (sa > sb) {
            return 1
          } else {
            if (!a.date && !b.date) {
              return moment(a.uploadDate).diff(b.uploadDate)
            } else if (a.date && !b.date) {
              return 1
            } else if (!a.date && b.date) {
              return -1
            } else {
              let ma = moment(a.date)
              let mb = moment(b.date)
              if (ma.isBefore(mb)) {
                return -1
              } else if (mb.isBefore(ma)) {
                return 1
              } else {
                return 0
              }
            }
          }
        })
      })

      // Sort groups by latest uploaded photo
      return [...authorGroups.values()].sort((a, b) => {
        let reduceFunc = (prev, current) => {
          return (moment(prev.uploadDate).isAfter(current.uploadDate)) ? prev : current
        }
        let dateA = a.photos.reduce(reduceFunc).uploadDate
        let dateB = b.photos.reduce(reduceFunc).uploadDate

        if (!dateA && !dateB) {
          return 0
        } else if (dateA && !dateB) {
          return -1
        } else if (dateB && !dateA) {
          return 1
        } else {
          return (moment(dateB).diff(dateA))
        }
      })
    }
  },
  methods: {
    openPhoto (photo) {
      this.groups.forEach((group, index) => {
        if (group.photos.some(curPhoto => curPhoto === photo)) {
          this.$refs.photosGroup[index].openPhoto(photo)
        }
      })
    },
    onEditPhoto (photo) {
      this.editingPhoto = this.summit.photos.find(curPhoto => curPhoto.filename === photo.filename)
      this.isEditorActive = true
    },
    onDeletePhoto (photo) {
      this.$buefy.dialog.confirm({
        message: 'Are you sure you want to delete this photo?',
        confirmText: 'Delete',
        type: 'is-danger',
        onConfirm: () => {
          this.deletePhoto(this.summit.code, photo.filename)
            .then(() => {
              this.$emit('photoDeleted')
            })
        }
      })
    },
    onReorderPhotos (filenames) {
      this.reorderPhotos(this.summit.code, filenames)
        .then(() => {
          this.$emit('photosReordered')
        })
    }
  },
  data () {
    return {
      isEditorActive: false,
      editingPhoto: null
    }
  }
}
</script>

<style scoped>
.inline {
  display: inline-block;
  vertical-align: top;
}
.inline > div {
  display: inline-block;
  vertical-align: top;
}
</style>
