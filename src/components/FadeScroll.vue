<template>
  <div :style="{ width: `${fullWidth}px`, height: `${fullHeight}px` }"></div>
</template>

<script>
import FadeScrollView from '@/components/FadeScrollView'

export default {
  name: 'FadeScroll',
  props: {
    imagePathList: { type: Array, required: true },
    isHorizontal: { type: Boolean, default: false },
  },
  data () {
    return {
      fadeScrollView: null,
      fullWidth: 0,
      fullHeight: 0,
    }
  },
  watch: {
    imagePathList (value) {
      if (this.fadeScrollView) {
        this.fadeScrollView.setImagePathList(value)
      }
    },
    isHorizontal: {
      immediate: true,
      handler (value) {
        if (this.fadeScrollView) {
          this.fadeScrollView.isHorizontal = value
        }
      }
    }
  },
  mounted () {
    if (!this.fadeScrollView) {
      this.fadeScrollView = new FadeScrollView(this.$el, this.imagePathList)
      // 초기 SPA 렌더링 할 때, 영역 생성
      this.fullWidth = this.fadeScrollView.getOffsetWidth()
      this.fullHeight = this.fadeScrollView.getOffsetHeight()
    }
    this.fadeScrollView.init()
  },
  beforeDestroy () {
    if (this.fadeScrollView) {
      this.fadeScrollView.removeEventListener()
    }
  },
}
</script>
