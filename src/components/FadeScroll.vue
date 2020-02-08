<template>
  <div style="position: relative;">
    <canvas id="content" :style="canvasStyle" :width="width" :height="canvasHeight"/>
    <div id="fake" ref="fake" :style="{ display: 'inline-block', width: `${width}px`, height: `${imgListHeight}px` }"></div>
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
function loadImage (src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
function findItem (findIndex) {
  return function ({ key }) {
    return key === findIndex
  }
}

const SCROLL_MODE = { NONE: 0, UP_SCROLLING: 1, DOWN_SCROLLING: 2 }

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
      isFixed: false,
      isShowContent: false,
      scrollEl: null,
      isScrolling: false,
      canvas: null,
      ctx: null,
      canvasHeight: 0,
      loadedImgList: [],
      imgListHeight: 0,
      imgDiff: 0, // 실제 이미지 높이와 캔버스 높이 차이
      curImgIndex: 0,
      cntPerPage: 1,
    }
  },
  computed: {
    canvasStyle () {
      if (this.canvas) {
        const { fake } = this.$refs
        const { top, bottom, left } = fake.getBoundingClientRect()
        if (this.isFixed) {
          return { position: 'fixed', top: `${this.scrollEl.offsetTop || 0}px`, left: `${left}px`, 'pointer-events': 'none' }
        } else {
          const style = { position: 'absolute', left: `${fake.offsetLeft}px`, 'pointer-events': 'none' }
          if (top > 0) {
            style.top = 0
          } else {
            style.bottom = 0
          }
          return style
        }
      }
      return null
    },
  },
  watch: {
    isFixed (value) {
      if (!value) {
        if (this.$refs.fake.getBoundingClientRect().bottom < this.height) {
          this.renderList(this.curImgIndex - 1, this.height - this.imgDiff)
        }
      }
    }
  },
  mounted () {
    if (!this.scrollEl) {
      const { length } = this.imgList
      this.scrollEl = findScroll(this.$parent.$el)
      this.canvasHeight = getOffsetHeight(this.scrollEl)
      this.imgDiff = Math.max(this.canvasHeight - this.height, 0)
      this.imgListHeight = this.canvasHeight * length + this.imgDiff
      for (let i = 0; i < length; i++) {
        if (this.height * (i + 1) > this.canvasHeight) {
          this.cntPerPage = i + 1
          break
        }
      }
    }
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
        this.io = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
          const { top, bottom } = this.$refs.fake.getBoundingClientRect()
          this.isShowContent = isIntersecting
          this.isFixed = this.isShowContent && top <= 0 && bottom >= this.height
        }))
      }
      if (!this.canvas) {
        this.canvas = document.getElementById('content')
      }
      if (!this.ctx) {
        this.ctx = this.canvas.getContext('2d')
      }
      this.io.observe(this.$refs.fake)
      this.loadImageList().then(() => this.renderList(0))
      this.scrollEl.addEventListener('scroll', this.onScroll)
    },
    async loadImageList () {
      const newImgObjList = []
      for (let i = Math.max(this.curImgIndex - 1, 0), length = Math.min(this.curImgIndex + this.cntPerPage, this.imgList.length); i < length; i++) {
        const item = this.loadedImgList.find(findItem(i))
        if (item) {
          newImgObjList.push(item)
        } else {
          const img = await loadImage(this.imgList[i])
          newImgObjList.push({ key: i, img })
        }
        this.loadedImgList = newImgObjList
      }
      return Promise.resolve()
    },
    render ({ img }, y, clipY, clipHeight) {
      this.ctx.save()
      this.ctx.beginPath()
      this.ctx.rect(0, clipY, this.width, clipHeight)
      this.ctx.clip()
      this.ctx.drawImage(img, 0, y, this.width, this.canvasHeight)
      this.ctx.restore()
    },
    renderList (startIndex, yInc = 0, clipYInc = 0) {
      for (let i = startIndex, j = 0, length = i + this.cntPerPage; i < length; i++, j++) {
        const img = this.loadedImgList.find(findItem(i))
        if (img) {
          const y = this.height * j - yInc
          this.render(img, y, y + clipYInc, this.height)
        }
      }
    },
    renderFade (inc = 0) {
      const curImg = this.loadedImgList.find(findItem(this.curImgIndex))
      if (curImg) {
        this.render(curImg, 0, 0, inc)
      }
      const prevImg = this.loadedImgList.find(findItem(this.curImgIndex - 1))
      if (prevImg) {
        this.render(prevImg, 0, inc, this.canvasHeight - inc)
      }
    },
    onScroll (event) {
      if (!this.isScrolling) {
        window.requestAnimationFrame(() => {
          if (this.isShowContent) {
            const { top, bottom } = this.$refs.fake.getBoundingClientRect()
            this.isFixed = top <= 0 && bottom >= this.height
            if (this.isFixed) {
              const scrollX = Math.abs(top) - this.imgDiff
              const prevIndex = this.curImgIndex
              const { length } = this.imgList
              const totalCanvasHeight = this.canvasHeight * (length - 1)
              for (let i = 0; i < length; i++) {
                if (scrollX < this.canvasHeight * i) {
                  if (this.curImgIndex !== i) {
                    this.curImgIndex = i
                    this.loadImageList().then(() => this.renderFade())
                  }
                  break
                }
              }
              if (scrollX < 0) {
                this.renderList(this.curImgIndex, 0, -top)
              } else if (scrollX > totalCanvasHeight) {
                this.ctx.clearRect(0, 0, this.width, this.canvasHeight)
                this.render(this.loadedImgList.find(findItem(this.curImgIndex)), 0, 0, this.canvasHeight + totalCanvasHeight - scrollX)
              } else if (this.curImgIndex === prevIndex) {
                this.renderFade(scrollX - (this.canvasHeight * (this.curImgIndex - 1)))
              }
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
