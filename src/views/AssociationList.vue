<template>
  <SummitDatabasePageLayout>
    <template v-slot:title>
      <h1 class="title is-size-1 is-size-3-mobile">
        Associations
      </h1>
    </template>

    <section class="section">
      <div class="container">
        <b-field>
          <FilterInput v-model="filter" ref="filter" />
        </b-field>
        <b-table class="auto-width" default-sort="code" :narrowed="true" :striped="true" :data="filteredAssociations" :mobile-cards="false">
          <template slot-scope="props">
            <b-table-column field="code" label="Identifier" class="nowrap" sortable>
              <router-link :to="associationLink(props.row)">{{ props.row.code }}</router-link>
            </b-table-column>
            <b-table-column field="name" label="Name" sortable>
              <router-link :to="associationLink(props.row)">{{ props.row.name }}</router-link>
            </b-table-column>
            <b-table-column field="summitCount" label="Summits" sortable>
              {{ props.row.summitCount }}
            </b-table-column>
          </template>
        </b-table>
      </div>
    </section>
  </SummitDatabasePageLayout>
</template>

<script>
import axios from 'axios'

import SummitDatabasePageLayout from '../components/SummitDatabasePageLayout.vue'
import FilterInput from '../components/FilterInput.vue'

export default {
  name: 'AssociationList',
  components: {
    SummitDatabasePageLayout, FilterInput
  },
  delayScroll: true,
  methods: {
    associationLink (association) {
      return '/summits/' + association.code
    }
  },
  mounted () {
    document.title = 'Associations - SOTLAS'
    this.loadingComponent = this.$buefy.loading.open({ canCancel: true })
    axios.get(process.env.VUE_APP_API_URL + '/associations/all')
      .then(response => {
        this.associations = response.data
        this.loadingComponent.close()
        this.$root.$emit('triggerScroll')
      })
  },
  computed: {
    filteredAssociations () {
      if (this.filter === '') {
        return this.associations
      }
      return this.associations.filter(association => {
        return association.code.includes(this.filter.toUpperCase()) || association.name.toLowerCase().includes(this.filter.toLowerCase())
      })
    }
  },
  data () {
    return {
      associations: [],
      filter: ''
    }
  }
}
</script>
