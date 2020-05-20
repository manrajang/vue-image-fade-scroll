<template>
  <div id="app">
  <!-- <div id="app" style="overflow: auto; height: 800px"> -->
    <div v-for="i in 10" :key="i">{{ i }}</div>
    <div>
      <fade-scroll :imgList="['img/apple-0.png', 'img/apple-1.png', 'img/apple-2.png', 'img/apple-0.png', 'img/apple-1.png']" :width="940" :height="1112"/>
    </div>
    <div v-for="i in 20" :key="`a${i}`">{{ i }}</div>
    <div>
      <fade-scroll :imgList="['img/apple-0.png', 'img/apple-1.png', 'img/apple-2.png', 'img/apple-0.png', 'img/apple-1.png']" :width="640" :height="800"/>
    </div>
    <div v-for="i in 20" :key="`b${i}`">{{ i }}</div>
    <div>
      <fade-scroll :imgList="['img/apple-0.png', 'img/apple-1.png', 'img/apple-2.png', 'img/apple-0.png', 'img/apple-1.png']" :width="1200" :height="2000"/>
    </div>
    <div v-for="i in 20" :key="`c${i}`">{{ i }}</div>
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
