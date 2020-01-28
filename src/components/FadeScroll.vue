<template>
  <div>
    <p id="top"></p>
    <img id="fadeContent" src="img/a.jpg" alt="front image" :width="width" :height="height">
    <template v-if="isFixed">
      <canvas id="fadeCanvas" class="canvas_fixed" :width="canvasWidth" :height="canvasHeight"/>
      <div class="fixed" @scroll="onScroll">
        <div :style="{ height: `${canvasHeight * 2}px` }"></div>
        <p id="bottom"></p>
      </div>
    </template>
  </div>
</template>

<script>
import 'intersection-observer'

export default {
  name: 'FadeScroll',
  props: {
    width: { type: Number, default: 800 },
    height: { type: Number, default: 600 },
  },
  data () {
    return {
      io: null,
      isShowTop: false,
      isShowContent: false,
      isShowBottom: false,
      isScrolling: false,
      isFull: false,
      incWidth: 0,
      incHeight: 0,
      canvasWidth: window.innerWidth,
      canvasHeight: window.innerHeight,
    }
  },
  computed: {
    isFixed () {
      return !this.isShowTop && this.isShowContent
    },
    containerHeight () {
      return this.height + 2 * this.incHeight + (this.isFull ? 2 * window.innerHeight : 0)
    },
    imgHeight () {
      return this.height + this.incHeight
    },
    fakeHeight () {
      return this.height + this.incHeight
    },
    test () {
      return this.$refs.root.offsetTop
    },
  },
  watch: {
    isFixed (value) {
      window.document.body.style.overflow = value ? 'hidden' : 'auto'
    }
  },
  mounted () {
    if (!this.io) {
      this.io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const { target, isIntersecting } = entry
          const { id } = target
          if (id === 'top') {
            this.isShowTop = entry.isIntersecting
          } else if (id === 'fadeContent') {
            this.isShowContent = entry.isIntersecting
          }
        })
      }, { rootMargin: `-${(window.innerHeight / 2) - (this.height / 2)}px` })
    }
    this.$nextTick(() => {
      this.io.observe(document.getElementById('top'))
      this.io.observe(document.getElementById('fadeContent'))
    })
    // window.addEventListener('scroll', this.onScroll)
  },
  beforeDestroy () {
    if (this.io) {
      this.io.disconnect()
    }
    // window.removeEventListener('scroll', this.onScroll)
  },
  methods: {
    onCanvasScroll () {
      console.log('test')
    },
    onScroll (event) {
      if (!this.isScrolling) {
        window.requestAnimationFrame(() => {
          if (this.isFixed) {
            const canvas = document.getElementById('fadeCanvas')
            const ctx = canvas.getContext('2d')
            const image = document.getElementById('fadeContent')
            const { left, top } = image.getBoundingClientRect()
            ctx.drawImage(image, left, top, this.width, this.height)
            ctx.scale(2, 2)
            ctx.drawImage(image, left, top, this.width, this.height)
            console.log(event)
          }

          //       // window.document.body.style.overflowY = 'hidden'
          //       const { innerWidth, innerHeight } = window
          //       const diffHeight = innerHeight - this.height
          //       const rateHeight = innerHeight / diffHeight
          //       if (this.isShowBottom) {
          //         const incHeight = window.scrollY - (this.$refs.root.offsetTop + this.$refs.bottom.offsetTop)
          //         console.log(incHeight)
          //         console.log(window.scrollY)
          //         console.log(this.$refs.bottom.offsetTop)
          //         // this.isFull = false
          //         // this.isFull = (innerHeight + incHeight) < (diffHeight - 5)
          //         this.changeFakeRect(0, (innerHeight + incHeight) < diffHeight ? diffHeight : incHeight)
          //       } else {
          //         const incHeight = window.scrollY - this.$refs.root.offsetTop
          //         this.isFull = incHeight > (diffHeight + 5)
          //         this.changeFakeRect(0, incHeight > diffHeight ? diffHeight : incHeight)
          //       }

          this.isScrolling = false
        })
        this.isScrolling = true
      }
    },
    changeFakeRect (rateWidth = 0, rateHeight = 0) {
      // console.log(rateHeight)
      const { content, fakeContent, front } = this.$refs
      if (!this.isShowTop && this.isShowContent) {
        // const { offsetWidth, offsetHeight } = content
        // content.style.width = `${offsetWidth}px`
        this.incHeight = rateHeight
        // fakeContent.style.height = `${this.height + 2 * rateHeight}px`
      } else {
        // content.style.width = null
        // fakeContent.style.height = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    overflow: scroll;
  }

  .fixed {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: auto;
  }

  .canvas_fixed {
    position: fixed;
    top: 0;
    left: 0;
  }

  .root {
    position: relative;

    img {
      display: block;
      // vertical-align: bottom;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      margin: 0 auto
    }

    .top {
      margin: 0
    }

    .fake {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }

    .bottom {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      margin: 0;
    }

    .stop-scrolling {
      overflow: hidden;
    }
  }
</style>
