<template>
  <div class="home">
    CONFIGURATION EXAMPLE: <br>
    {{ JSON.stringify(config) }}

    <br><br>
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue';

export default {
  name: 'home',
  computed: {
    config() {
      return __config;
    }
  },
  components: {
    HelloWorld,
  },
};
</script>
