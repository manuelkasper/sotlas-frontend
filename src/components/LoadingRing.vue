<template>
  <div class="lds-dual-ring"></div>
</template>

<script>
export default {
  name: 'LoadingRing'
}
</script>

<style scoped>
.lds-dual-ring {
  display: inline-block;
  width: 46px;
  height: 46px;
}
.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 46px;
  height: 46px;
  margin: 1px;
  border-radius: 50%;
  border: 5px solid #aaa;
  border-color: #aaa transparent #aaa transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
