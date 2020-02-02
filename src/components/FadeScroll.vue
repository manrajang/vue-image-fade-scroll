<template>
  <div v-if="isLoaded">
    <template v-if="imgListHeight > canvasHeight">
      <p id="top" ref="top"></p>
      <canvas id="content" style="background: red;" :style="fixedStyle" :width="width" :height="canvasHeight"/>
      <div v-if="isFixed" :style="{ height: `${imgListHeight}px` }"></div>
      <p id="bottom"></p>
    </template>
    <template v-else>
      <img v-for="(item, index) in imgList" :key="index" :src="item" :width="width" :height="height">
    </template>
  </div>
</template>

<script>
import 'intersection-observer'

const regex = /(auto|scroll)/

function getStyleValue (node, prop) {
  return getComputedStyle(node, null).getPropertyValue(prop)
}
function isScroll (node) {
  return regex.test(getStyleValue(node, 'overflow') + getStyleValue(node, 'overflow-y') + getStyleValue(node, 'overflow-x'))
}
function findScroll (node) {
  return (!node || node === document.body) ? window : (isScroll(node) ? node : findScroll(node.parentNode))
}
function getOffsetHeight (node) {
  return node.innerHeight || node.offsetHeight
}
function getScrollTop (node) {
  return node.scrollY || node.scrollTop
}
function loadImage (src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export default {
  name: 'FadeScroll',
  props: {
    imgList: { type: Array, default: () => ['img/a.jpg', 'img/b.jpg', 'img/c.jpg', 'img/d.jpg'] },
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
      canvasHeight: 0,
      canvas: null,
      ctx: null,
      imgObjList: [],
      curImgIndex: 0,
      cntPerPage: 1,
      scrollEl: null,
      isLoaded: false
    }
  },
  computed: {
    imgListHeight () {
      return (this.imgList.length - 1 || 1) * this.height
    },
    isFixed () {
      return !this.isShowTop && this.isShowContent
    },
    fixedStyle () {
      if (this.canvas) {
        return this.isFixed ? { position: 'fixed', top: `${this.scrollEl.offsetTop || 0}px`, left: `${this.canvas.offsetLeft}px`, 'pointer-events': 'none' } : null
      }
      return null
    },
  },
  mounted () {
    if (!this.scrollEl) {
      this.scrollEl = findScroll(this.$parent.$el)
      this.canvasHeight = getOffsetHeight(this.scrollEl)
      for (let i = 0, length = this.imgList.length; i < length; i++) {
        if (this.height * (i + 1) > this.canvasHeight) {
          this.curImgIndex = i
          this.cntPerPage = i + 1
          break
        }
      }
    }
    this.isLoaded = true
    if (this.imgListHeight > this.canvasHeight) {
      this.$nextTick(() => this.initFadeInfo())
    }
  },
  beforeDestroy () {
    if (this.io) {
      this.io.disconnect()
    }
    this.scrollEl.removeEventListener('scroll', this.onScroll)
  },
  methods: {
    initFadeInfo () {
      if (!this.io) {
        this.io = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            const { target, isIntersecting } = entry
            const { id } = target
            if (id === 'top') {
              this.isShowTop = entry.isIntersecting
            } else if (id === 'content') {
              this.isShowContent = entry.isIntersecting
            }
          })
        })
      }
      this.$nextTick(() => {
        this.io.observe(document.getElementById('top'))
        this.io.observe(document.getElementById('content'))
      })
      if (!this.canvas) {
        this.canvas = document.getElementById('content')
      }
      if (!this.ctx) {
        this.ctx = this.canvas.getContext('2d')
      }
      this.loadImageList().then(() => this.render())
      this.scrollEl.addEventListener('scroll', this.onScroll)
    },
    async loadImageList () {
      this.imgObjList = []
      const start = this.curImgIndex + 1
      for (let i = Math.max(start - this.cntPerPage, 0), length = Math.min(start + 1, this.imgList.length); i < length; i++) {
        const img = await loadImage(this.imgList[i])
        this.imgObjList.push({ key: i, img })
      }
      return Promise.resolve()
    },
    render (inc = 0, diff) {
      this.ctx.clearRect(0, 0, this.width, this.canvasHeight)
      for (let i = 0; i < this.cntPerPage; i++) {
        if (diff) {
          const sY1 = this.height * i - inc
          const sHeight1 = this.height - diff
          const sY2 = sY1 + sHeight1
          const sHeight2 = diff
          this.ctx.save()
          this.ctx.beginPath()
          this.ctx.rect(0, sY1, this.width, sHeight1)
          this.ctx.clip()
          this.ctx.drawImage(this.imgObjList[i].img, 0, this.height * i - inc, this.width, this.height)
          this.ctx.restore()
          this.ctx.save()
          this.ctx.beginPath()
          this.ctx.rect(0, sY2, this.width, sHeight2)
          this.ctx.clip()
          this.ctx.drawImage(this.imgObjList[i + 1].img, 0, this.height * i - inc, this.width, this.height)
          this.ctx.restore()
        } else {
          this.ctx.drawImage(this.imgObjList[i].img, 0, this.height * i - inc, this.width, this.height)
        }
      }
    },
    onScroll (event) {
      if (!this.isScrolling) {
        window.requestAnimationFrame(() => {
          if (this.isFixed) {
            // 실제 diff와, 고정 diff 중 작은거
            const scrollTop = getScrollTop(this.scrollEl)
            const diff = scrollTop - this.$refs.top.offsetTop
            const currentHeight = diff + this.canvasHeight
            const prevIndex = this.curImgIndex
            for (let i = 0, length = this.imgList.length - 1; i < length; i++) {
              if (currentHeight < this.height * (i + 1)) {
                if (this.curImgIndex !== i) {
                  this.curImgIndex = i
                }
                break
              }
            }
            const scrollDiff = Math.min(diff, this.height * this.cntPerPage - this.canvasHeight)
            if (prevIndex === this.curImgIndex) {
              if (this.curImgIndex < this.cntPerPage) {
                this.render(scrollDiff)
              } else {
                this.render(scrollDiff, currentHeight - this.height * this.curImgIndex)
              }
            } else {
              this.loadImageList().then(() => this.render(scrollDiff))
            }
          }
          this.isScrolling = false
        })
        this.isScrolling = true
      }
    },
  }
}
</script>

<style lang="scss" scoped>
</style>
