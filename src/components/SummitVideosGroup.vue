<template>
  <div class="video-group box">
    <div class="video-group-title">
      <router-link v-if="titleLink" :to="titleLink">{{ title }}</router-link>
      <span v-else>{{ title }}</span>
    </div>
    <LazyYoutubeVideo v-for="video in videos" :key="video.src" :src="video.src" previewImageSize="hqdefault" />
  </div>
</template>

<script>
import LazyYoutubeVideo from './LazyYoutubeVideo.vue'

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
/* This targets LazyYoutubeVideo.vue's root element by class (Vue's scoped CSS applies a
   parent's scoped attribute to a child component's root element too, so a plain class
   selector here reaches across the component boundary without :deep()). It used to read
   `.y-video` to match vue-lazy-youtube-video's root element class, but LazyYoutubeVideo.vue
   (our Vue 3-native replacement, see its own file) renders `.lazy-youtube` at the root and
   `.y-video` only on its <iframe> once playback starts. The stale selector matched nothing
   before playback, so this width never applied and the preview shrank to its smallest
   child (the 68x48px play button) inside SummitVideos.vue's inline-block layout. */
.lazy-youtube {
  margin: 0 0.75rem 0.75rem 0;
  width: 30rem;
  display: inline-block;
  vertical-align: bottom;
}
@media (max-width: 768px) {
  .lazy-youtube {
    margin: 0 0.5rem 0.5rem 0;
    width: 70vw;
  }
}
:deep(.video-title) {
  font-size: 1rem;
}
:deep(.video-title .author) {
  font-size: 0.8rem;
  margin-top: 0.2em;
}
.video-group {
  background: var(--bulma-scheme-main-ter);
  padding: 0.25rem 0 0 0.75rem;
  display: inline-block;
  margin-right: 0.75rem;
}
.video-group-title {
  color: var(--bulma-text-weak);
  font-size: 0.8em;
  font-weight: bold;
  margin-bottom: 0.2rem;
  margin-right: 0.75rem;
}
.video-group-title a {
  color: var(--bulma-text-weak);
}
.video-group-title a:hover {
  color: #3273dc;
}
</style>
