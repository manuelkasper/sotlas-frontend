<template>
  <nav class="breadcrumb is-small" aria-label="breadcrumbs">
    <ul>
      <li v-if="association" :class="{'is-active': !region, association: true}"><CountryFlag v-if="association.isoCode" :country="association.isoCode" /> <router-link :to="'/summits/' + association.code">{{ association.code }} <span class="breadcrumb-label">&nbsp;{{ association.name }}</span></router-link></li>
      <li v-if="region" :class="{'is-active': !summit}"><router-link :to="'/summits/' + association.code + '/' + region.code">{{ region.code }} <span class="breadcrumb-label">&nbsp;{{ region.name }}</span></router-link></li>
      <li v-if="summit &amp;&amp; summit.code" class="is-active summit-number"><router-link :to="'/summits/' + summit.code" aria-current="page">{{ summitNumber }}</router-link></li>
    </ul>
  </nav>
</template>

<script>
import CountryFlag from '../components/CountryFlag.vue'

export default {
  name: 'Breadcrumb',
  components: {
    CountryFlag
  },
  props: {
    association: Object,
    region: Object,
    summit: Object
  },
  computed: {
    summitNumber () {
      if (!this.summit || !this.summit.code) {
        return null
      }
      return this.summit.code.substring(this.summit.code.indexOf('-') + 1)
    }
  }
}
</script>

<style scoped>
.breadcrumb {
  margin-top: 0.3em;
}
.breadcrumb li.summit-number:before {
  content: "–";
}
.breadcrumb .association a {
  padding-left: 0.5em;
}
.breadcrumb-label {
  color: #777;
}
</style>
