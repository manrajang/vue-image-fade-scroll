<template>
  <div id="app" >
  <!-- <div id="app" style="overflow: auto; height: 800px"> -->
    <div v-for="i in 100" :key="i">{{ i }}</div>
    <fade-scroll/>
    <div v-for="i in 100" :key="`a${i}`" style="background: red;">{{ i }}</div>
  </div>
</template>

<script>
import FadeScroll from '@/components/FadeScroll'
export default {
  name: 'app',
  components: {
    FadeScroll
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
