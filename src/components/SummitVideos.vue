<template>
  <div class="inline">
    <div v-for="group in groups" :key="group.key" class="video-group-wrapper">
      <SummitVideosGroup :videos="group.videos" :title="group.title" :titleLink="group.titleLink" />
    </div>
  </div>
</template>

<script>
import SummitVideosGroup from './SummitVideosGroup.vue'
import moment from 'moment'

export default {
  name: 'SummitVideos',
  props: {
    videos: Array
  },
  components: {
    SummitVideosGroup
  },
  computed: {
    groups () {
      if (!this.videos) {
        return []
      }

      // Group videos by author
      let authorGroups = new Map()
      this.videos.forEach(video => {
        let authorGroup = authorGroups.get(video.author)
        if (!authorGroup) {
          authorGroup = {
            author: video.author.toUpperCase(),
            title: video.author.toUpperCase(),
            titleLink: '/activators/' + video.author.toUpperCase(),
            videos: []
          }
          authorGroups.set(video.author, authorGroup)
        }
        authorGroup.videos.push(video)
      })

      // Sort groups by latest uploaded video
      return [...authorGroups.values()].sort((a, b) => {
        let reduceFunc = (prev, current) => {
          return (moment(prev.date).isAfter(current.date)) ? prev : current
        }
        let dateA = a.videos.reduce(reduceFunc).date
        let dateB = b.videos.reduce(reduceFunc).date

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
  }
}
</script>

<style scoped>
.video-group-wrapper:not(:last-child) {
  margin-bottom: 0.75rem;
}
.inline, .inline > div {
  display: inline-block;
  vertical-align: top;
}
</style>
