<template>
  <div id="app">
  <!-- <div id="app" style="overflow: auto; height: 800px"> -->
    <div v-for="i in 10" :key="i">{{ i }}</div>
    <div>
      <button type="button" @click="isChangeList = !isChangeList">리스트 변경</button>
      <fade-scroll :imagePathList="isChangeList ? ['img/apple-0.png', 'img/apple-1.png', 'img/apple-2.png', 'img/apple-0.png', 'img/apple-1.png'] : ['img/apple-2.png', 'img/apple-1.png', 'img/apple-0.png']"/>
    </div>
    <div v-for="i in 20" :key="`a${i}`">{{ i }}</div>
    <div>
      <fade-scroll :imagePathList="['img/apple-0.png', 'img/apple-1.png', 'img/apple-2.png', 'img/apple-0.png', 'img/apple-1.png']" isHorizontal/>
    </div>
    <div style="height:400px;overflow:auto;">
      <div v-for="i in 20" :key="`b${i}`">{{ i }}</div>
      <fade-scroll :imagePathList="['img/apple-0.png', 'img/apple-1.png', 'img/apple-2.png', 'img/apple-0.png', 'img/apple-1.png']"/>
      <div v-for="i in 20" :key="`c${i}`">{{ i }}</div>
    </div>
  </div>
</template>

<script>
import FadeScroll from '@/components/FadeScroll'

export default {
  name: 'app',
  components: {
    FadeScroll
  },
  data () {
    return {
      isChangeList: false,
    }
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
