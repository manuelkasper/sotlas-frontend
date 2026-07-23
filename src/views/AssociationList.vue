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
          <b-table-column field="code" label="Identifier" cell-class="nowrap" sortable v-slot="props">
            <router-link :to="associationLink(props.row)">{{ props.row.code }}</router-link>
          </b-table-column>
          <b-table-column field="name" label="Name" sortable v-slot="props">
            <router-link :to="associationLink(props.row)">{{ props.row.name }}</router-link>
          </b-table-column>
          <b-table-column field="summitCount" label="Summits" sortable v-slot="props">
            {{ props.row.summitCount }}
          </b-table-column>
          <b-table-column v-if="myActivationsPerAssociation" :label="$mq.mobile ? 'Act. by me' : 'Activated by me'" numeric v-slot="props">
            {{ myActivationsPerAssociation[props.row.code] }}
          </b-table-column>
        </b-table>
      </div>
    </section>
  </SummitDatabasePageLayout>
</template>

<script>
import axios from 'axios'
import sotadb from '../mixins/sotadb.js'
import EventBus from '../event-bus'

import SummitDatabasePageLayout from '../components/SummitDatabasePageLayout.vue'
import FilterInput from '../components/FilterInput.vue'

export default {
  name: 'AssociationList',
  mixins: [sotadb],
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
    axios.get(import.meta.env.VITE_API_URL + '/associations/all')
      .then(response => {
        this.associations = response.data
        this.loadingComponent.close()
        EventBus.emit('triggerScroll')
      })

    if (this.authenticated) {
      this.loadMyActivatorUniques()
    }
  },
  computed: {
    filteredAssociations () {
      if (this.filter === '') {
        return this.associations
      }
      return this.associations.filter(association => {
        return association.code.includes(this.filter.toUpperCase()) || association.name.toLowerCase().includes(this.filter.toLowerCase())
      })
    },
    myActivationsPerAssociation () {
      if (!this.$store.state.myActivatedSummits) {
        return null
      }
      let activationsPerAssociation = {}
      this.$store.state.myActivatedSummits.forEach(summitCode => {
        let association = summitCode.substring(0, summitCode.indexOf('/'))
        if (!activationsPerAssociation[association]) {
          activationsPerAssociation[association] = 1
        } else {
          activationsPerAssociation[association]++
        }
      })
      return activationsPerAssociation
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
