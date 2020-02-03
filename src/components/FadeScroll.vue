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
      isLoaded: false,
      imgListHeight: 0,
    }
  },
  computed: {
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
      const { length } = this.imgList
      this.scrollEl = findScroll(this.$parent.$el)
      this.canvasHeight = getOffsetHeight(this.scrollEl)
      this.imgListHeight = this.canvasHeight * (length - 1) + (this.canvasHeight - this.height)
      for (let i = 0; i < length; i++) {
        if (this.height * (i + 1) > this.canvasHeight) {
          this.cntPerPage = i + 1
          break
        }
      }
    }
    this.isLoaded = true
    this.$nextTick(() => this.initFadeInfo())
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
      this.loadImageList().then(() => this.defaultRender())
      this.scrollEl.addEventListener('scroll', this.onScroll)
    },
    async loadImageList () {
      this.imgObjList = []
      for (let i = 0; i < this.cntPerPage; i++) {
        const img = await loadImage(this.imgList[i])
        this.imgObjList.push({ key: i, img })
      }
      return Promise.resolve()
    },
    render (inc = 0) {
      // this.ctx.clearRect(0, 0, this.width, this.canvasHeight)
      // for (let i = this.curImgIndex, lastIndex = i + 1; i <= lastIndex; i++) {
      // if (diff) {
      // this.ctx.save()
      // this.ctx.beginPath()
      // this.ctx.rect(0, this.height * i + inc, this.width, this.height)
      // this.ctx.clip()
      // this.ctx.drawImage(this.imgObjList[i].img, 0, this.height * i, this.width, this.canvasHeight)
      // this.ctx.restore()
      // const sY1 = this.canvasHeight + inc
      // const sHeight1 = this.height - diff
      // const sY2 = sY1 + sHeight1
      // const sHeight2 = diff
      this.ctx.save()
      this.ctx.beginPath()
      this.ctx.rect(0, 0, this.width, inc)
      this.ctx.clip()
      this.ctx.drawImage(this.imgObjList[this.curImgIndex - 1].img, 0, 0, this.width, this.canvasHeight)
      this.ctx.restore()
      this.ctx.save()
      this.ctx.beginPath()
      this.ctx.rect(0, inc, this.width, this.canvasHeight - inc)
      this.ctx.clip()
      this.ctx.drawImage(this.imgObjList[this.curImgIndex].img, 0, 0, this.width, this.canvasHeight)
      this.ctx.restore()
      // } else {
      //   this.ctx.drawImage(this.imgObjList[i].img, 0, this.height * i - inc, this.width, this.height)
      // }
      // }
      // this.ctx.drawImage(this.imgObjList[i].img, 0, this.height * i - inc, this.width, this.height)
    },
    defaultRender (inc = 0) {
      for (let i = 0; i < this.cntPerPage; i++) {
        this.ctx.save()
        this.ctx.beginPath()
        this.ctx.rect(0, this.height * i + inc, this.width, this.height)
        this.ctx.clip()
        this.ctx.drawImage(this.imgObjList[i].img, 0, this.height * i, this.width, this.canvasHeight)
        this.ctx.restore()
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
            // for (let i = 0, length = this.imgList.length - 1; i < length; i++) {
            //   if (currentHeight < this.height * (i + 1)) {
            //     if (this.curImgIndex !== i) {
            //       this.curImgIndex = i
            //     }
            //     break
            //   }
            // }
            const scrollDiff = Math.min(diff, this.height * this.cntPerPage - this.canvasHeight)
            // if (prevIndex === this.curImgIndex) {
            for (let i = 0, length = this.imgList.length; i < length; i++) {
              if (diff < this.canvasHeight * i + this.canvasHeight - this.height) {
                if (this.curImgIndex !== i) {
                  this.curImgIndex = i
                }
                break
              }
            }
            if (this.curImgIndex === 0) {
              console.log('다시')
              this.defaultRender(diff)
            } else {
              console.log('종료')
              // console.log(diff)
              console.log(diff - (this.canvasHeight * this.curImgIndex - this.height))
              // console.log((this.canvasHeight * this.curImgIndex) + (diff - (this.canvasHeight - this.height)))
              this.render(diff - (this.canvasHeight * this.curImgIndex - this.height))
            }
            // } else {
            // this.loadImageList().then(() => this.render(scrollDiff))
            // }
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
