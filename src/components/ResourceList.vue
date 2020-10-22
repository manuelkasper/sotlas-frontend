<template>
  <div class="content">
    <ul class="resources">
      <li v-for="resource in resources" :key="resource.id"><b-icon v-if="resource.icon" :icon="resource.icon" :pack="resource.iconPack" size="is-small" /><svgicon v-if="resource.svgicon" class="icon" :icon="resource.svgicon" color="#555" /><img v-if="resource.iconImg" class="icon" :src="resource.iconImg" />{{ resource.prefix ? resource.prefix + ': ' : '' }}<a :href="resource.url" target="_blank">{{ resource.title }}</a><span class="subdued author" v-if="resource.author">(by {{ resource.author }} on {{ resource.date | formatSubmittedDate }})</span><span v-if="resource.suffix" class="subdued details">{{ resource.suffix }}</span></li>
    </ul>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  name: 'ResourceList',
  props: {
    resources: Array
  },
  filters: {
    formatSubmittedDate (date) {
      return moment.unix(date).format('DD MMM YYYY')
    }
  }
}
</script>

<style scoped>
.resources {
  margin-top: 0.5em;
  list-style: none;
  margin-left: 1em;
}
.resources .icon {
  width: 1.5em;
  height: 1.5em;
  vertical-align: bottom;
  margin-right: 0.3em;
  opacity: 0.5;
}
.author, .details {
  margin-left: 0.5em;
}
</style>
