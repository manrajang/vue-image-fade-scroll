<template>
  <div ref="container" :style="{ width: `${fullWidth}px`, height: `${imgListHeight}px` }" style="display:inline-block;position:relative;">
    <canvas ref="content" style="pointer-events:none;transform-origin:top center;position:absolute;left:0;" :style="canvasStyle" :width="fullWidth" :height="fullHeight"/>
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
function getOffsetWidth (node) {
  return node.innerWidth || node.offsetWidth
}
function getFullHeight () {
  const ruler = document.createElement('div')
  ruler.style.position = 'fixed'
  ruler.style.height = '100vh'
  ruler.style.width = 0
  ruler.style.top = 0
  document.documentElement.appendChild(ruler)
  const height = ruler.offsetHeight
  document.documentElement.removeChild(ruler)
  return height
}
function getOffsetHeight (node) {
  return node.innerHeight ? getFullHeight() : node.offsetHeight
}
function getScrollTop ({ scrollY, scrollTop, offsetTop }) {
  return scrollY || (scrollTop && offsetTop + scrollTop) || 0
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

export default {
  name: 'FadeScroll',
  props: {
    imgList: { type: Array, required: true },
    // width: { type: Number, default: 800 },
    // height: { type: Number, default: 600 },
  },
  data () {
    return {
      scrollEl: null, // 스크롤 있는 Dom
      canvas: null,
      ctx: null,
      fullWidth: 0,
      fullHeight: 0,
      imgHeight: 0,
      imgListHeight: 0,
      canvasStyle: null,
      io: null,
      isShowContent: false, // 이미지가 있는 Conatiner 영역의 보여지는 여부
      isFixed: false, // Container 영역이 스크롤 탑에 붙으면 페이드 효과 시작
      isScrolling: false,
      loadedImgList: [], // 현재 불려진 이미지 목록
      curImgIndex: 0,
    }
  },
  watch: {
    isFixed () {
      this.initCanvasStyle()
    }
  },
  mounted () {
    if (!this.scrollEl) {
      this.scrollEl = findScroll(this.$parent.$el)
    }
    if (!this.canvas) {
      this.canvas = this.$refs.content
    }
    if (!this.ctx) {
      this.ctx = this.canvas.getContext('2d')
    }
    this.init()
    this.initIntersectionObserver()
    this.loadImageList().then(() => this.render())
    this.scrollEl.addEventListener('scroll', this.onScroll)
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy () {
    if (this.io) {
      this.io.disconnect()
    }
    this.scrollEl.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    init () {
      this.fullWidth = getOffsetWidth(this.scrollEl)
      this.fullHeight = getOffsetHeight(this.scrollEl)
      this.imgListHeight = this.fullHeight * this.imgList.length
      // this.scale = this.fullHeight / this.height
      // this.canvasLeft = this.$refs.container.offsetLeft
      this.initCanvasStyle()
    },
    initCanvasStyle () {
      // const defaultStyle = { transform: `matrix(${this.scale}, 0, 0, ${this.scale}, 0, 0)` }
      const { top, bottom } = this.getBounds()
      if (this.isFixed) {
        this.canvasStyle = { position: 'fixed', top: `${this.scrollEl.offsetTop || 0}px`, left: `${this.$refs.container.offsetLeft}px` }
      } else {
        if (top > 0) {
          this.canvasStyle = { top: 0 }
        } else if (bottom < this.fullHeight) {
          this.canvasStyle = { bottom: 0 }
        }
      }
    },
    initIntersectionObserver () {
      if (!this.io) {
        this.io = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
          const { top, bottom } = this.getBounds()
          this.isShowContent = isIntersecting
          this.isFixed = this.isShowContent && top <= 0 && bottom >= this.imgHeight
        }))
      }
      this.io.observe(this.$refs.container)
    },
    async loadImageList () {
      const newImgObjList = []
      for (let i = 0, length = this.imgList.length; i < length; i++) {
        const item = this.loadedImgList.find(findItem(i))
        if (item) {
          newImgObjList.push(item)
        } else {
          const img = await loadImage(this.imgList[i])
          newImgObjList.push({ key: i, img })
        }
      }
      this.loadedImgList = newImgObjList
      return Promise.resolve()
    },
    getBounds () {
      const top = this.$refs.container.offsetTop - getScrollTop(this.scrollEl)
      return { top, bottom: top + this.imgListHeight }
    },
    drawImg (img, sx, sy, sHeight, dy, dHeight) {
      this.ctx.save()
      const { width, height } = img
      const scaleWidth = width * this.fullHeight / height
      this.ctx.drawImage(img, sx, sy, width, sHeight, (this.fullWidth - scaleWidth) / 2, dy, scaleWidth, dHeight)
      this.ctx.restore()
    },
    renderImg (index) {
      let img = this.loadedImgList.find(findItem(index))
      if (img) {
        img = img.img
        this.drawImg(img, 0, 0, img.height, 0, this.fullHeight)
      }
    },
    renderFade (yInc = 0) {
      // const canvasYInc = yInc / this.scale
      let curImg = this.loadedImgList.find(findItem(this.curImgIndex))
      if (curImg) {
        curImg = curImg.img
        const { height } = curImg
        const imageYInc = yInc * height / this.fullHeight
        this.drawImg(curImg, 0, 0, height - imageYInc, 0, this.fullHeight - yInc)
      }
      let nextImg = this.loadedImgList.find(findItem(this.curImgIndex + 1))
      if (nextImg) {
        nextImg = nextImg.img
        const { height } = nextImg
        const imageYInc = yInc * height / this.fullHeight
        this.drawImg(nextImg, 0, height - imageYInc, imageYInc, this.fullHeight - yInc, yInc)
      }
    },
    async render () {
      const { top, bottom } = this.getBounds()
      const scrollY = Math.abs(top)
      const { length } = this.imgList
      this.isFixed = top <= 0 && bottom >= this.fullHeight
      // 스크롤 위치로 현재 이미지 인덱스 찾기
      for (let i = 0; i < length; i++) {
        if (scrollY > this.fullHeight * i) {
          this.curImgIndex = i
        }
      }
      this.ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
      if (this.isFixed) {
        // 이미지 페이드 효과 처리
        this.renderFade(scrollY - this.fullHeight * this.curImgIndex)
      } else {
        // 페이드 영역에 도달 하지 않았을 때에는 이미지 그리기
        if (top > 0) {
          this.renderImg(0)
        } else if (bottom < this.fullHeight) {
          this.renderImg(this.curImgIndex)
        }
      }
    },
    onScroll (event) {
      if (!this.isScrolling) {
        window.requestAnimationFrame(() => {
          if (this.isShowContent) {
            this.render()
          }
          this.isScrolling = false
        })
        this.isScrolling = true
      }
    },
    onResize () {
      this.init()
      this.$nextTick(() => this.render())
    }
  }
}
</script>
