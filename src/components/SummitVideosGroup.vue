<template>
  <div class="video-group box">
    <div class="video-group-title">
      <router-link v-if="titleLink" :to="titleLink">{{ title }}</router-link>
      <span v-else>{{ title }}</span>
    </div>
    <LazyYoutubeVideo v-for="video in videos" :key="video.src" :src="video.src" previewImageSize="hqdefault" :webp="false" />
  </div>
</template>

<script>
import LazyYoutubeVideo from 'vue-lazy-youtube-video'
import 'vue-lazy-youtube-video/dist/style.css'

export default {
  name: 'SummitVideosGroup',
  props: {
    videos: Array,
    title: String,
    titleLink: String
  },
  components: {
    LazyYoutubeVideo
  }
}
</script>

<style scoped>
.y-video {
  margin: 0 0.75rem 0.75rem 0;
  width: 30rem;
  display: inline-block;
  vertical-align: bottom;
}
@media (max-width: 768px) {
  .y-video {
    margin: 0 0.5rem 0.5rem 0;
    width: 70vw;
  }
}
>>> .video-title {
  font-size: 1rem;
}
>>> .video-title .author {
  font-size: 0.8rem;
  margin-top: 0.2em;
}
.video-group {
  background: whitesmoke;
  padding: 0.25rem 0 0 0.75rem;
  display: inline-block;
  margin-right: 0.75rem;
}
.video-group-title {
  color: #777;
  font-size: 0.8em;
  font-weight: bold;
  margin-bottom: 0.2rem;
  margin-right: 0.75rem;
}
.video-group-title a {
  color: #777;
}
.video-group-title a:hover {
  color: #3273dc;
}
</style>
