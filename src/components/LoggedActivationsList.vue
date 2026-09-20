<template>
  <div>
    <b-table :narrowed="true" :paginated="true" :striped="true" :default-sort="['activationDate', 'desc']" :per-page="15" :data="data" :mobile-cards="false">
      <b-table-column field="activationDate" label="Date" sortable v-slot="props">
        {{ formatActivationDate(props.row.activationDate) }}
      </b-table-column>
      <b-table-column field="ownCallsign" label="Activator" sortable v-slot="props">
        <router-link :to="makeActivatorLinkUserId(props.row.userId)">{{ props.row.ownCallsign.toUpperCase() }}</router-link>
      </b-table-column>
      <b-table-column field="qsos" label="QSOs" cell-class="qsos-cell" sortable numeric v-slot="props">
        <button type="button" class="qsos" @click="openQsoList(props.row.id)">
          {{ props.row.qsos }}
          <font-awesome-icon :icon="['far', 'th-list']" class="faicon" />
        </button>
      </b-table-column>
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
  margin-left: 0.2em;
}
/* Buefy attaches a click listener to every <td>, so iOS treats the whole cell
   as the tap target. Taps that miss the tiny number/icon then highlight the
   cell without opening the QSO list. Cover the cell with the button instead.
   :deep() is required because <td> is rendered by <b-table>, not this template. */
:deep(.qsos-cell) {
  position: relative;
  cursor: pointer;
}
.qsos {
  color: #3273dc;
  cursor: pointer;
  appearance: none;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  line-height: inherit;
  white-space: nowrap;
  touch-action: manipulation;
}
.qsos::after {
  content: "";
  position: absolute;
  inset: 0;
}
</style>
