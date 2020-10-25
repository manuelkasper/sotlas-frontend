<template>
  <div>
    <b-table :narrowed="true" :paginated="true" :striped="true" :default-sort="['activationDate', 'desc']" :per-page="15" :data="data" :mobile-cards="false">
      <template slot-scope="props">
        <b-table-column field="activationDate" label="Date" sortable>
          {{ props.row.activationDate | formatActivationDate }}
        </b-table-column>
        <b-table-column field="ownCallsign" label="Activator" sortable>
          <router-link :to="makeActivatorLinkUserId(props.row.userId)">{{ props.row.ownCallsign.toUpperCase() }}</router-link>
        </b-table-column>
        <b-table-column field="qsos" label="QSOs" sortable numeric>
          <span class="qsos" @click="openQsoList(props.row.id)">{{ props.row.qsos }}</span>
          <font-awesome-icon :icon="['far', 'th-list']" class="faicon qsos" @click="openQsoList(props.row.id)" />
        </b-table-column>
      </template>
    </b-table>

    <ModalQSOList :activationId="modalActivationId" @modalClosed="modalActivationId = null" />
  </div>
</template>

<script>
import utils from '../mixins/utils.js'
import sotadb from '../mixins/sotadb.js'
import ModalQSOList from '../components/ModalQSOList.vue'

export default {
  props: {
    data: Array
  },
  mixins: [utils, sotadb],
  components: { ModalQSOList },
  data () {
    return {
      modalActivationId: null
    }
  },
  methods: {
    openQsoList (activationId) {
      if (!this.authenticated) {
        this.$buefy.dialog.alert('Please log in to view QSOs.')
        return
      }
      this.modalActivationId = activationId
    }
  }
}
</script>

<style scoped>
.faicon {
  margin-left: 0.4em;
}
.qsos {
  color: #3273dc;
  cursor: pointer;
}
</style>
