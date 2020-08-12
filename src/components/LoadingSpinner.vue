<template>
  <div class="lds-dual-ring"></div>
</template>

<style scoped>
.lds-dual-ring {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
}
.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  border: 0.1em solid #a0a0a0;
  border-color: #a0a0a0 transparent #a0a0a0 transparent;
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
