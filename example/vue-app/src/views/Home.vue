<template>
  <div class="home">
    CONFIGURATION EXAMPLE: <br>
    <pre>{{ JSON.stringify(config, null, 2) }}</pre>
    <br><br>
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue';

export default {
  name: 'Home',
  computed: {
    config() {
      return __config;
    },
  },
  components: {
    HelloWorld,
  },
};
</script>

<style>
  pre {
    text-align: left;
    white-space: pre;
    font-family: monospace;
  }
</style>
