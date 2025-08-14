<template>
    <div class="map-key-failed-info">
        <div class="info-card">
            <font-awesome-icon :icon="['far', 'exclamation-circle']" class="faicon" />
            <h3 class="title">Anti-bot verification failed</h3>
            <p class="messagex">The automatic verification that you are not a bot failed. Please log in with your SOTA
                account to view the map.</p>
        </div>
    </div>
</template>

<script>
export default {
  name: 'MapKeyFailedInfo'
}
</script>

<style scoped>
.map-key-failed-info {
  width: 100%;
  height: 100%;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.info-card {
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.info-card .faicon {
  color: #f59e0b;
  width: 2.5rem;
  height: 2.5rem;
  margin-bottom: 0.75rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
}

.messagex {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  line-height: 1.6;
}
</style>