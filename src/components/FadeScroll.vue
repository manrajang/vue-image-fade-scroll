<template>
  <div ref="container" :style="{ width: `${width}px`, height: `${imgListHeight}px` }" style="background:red;display:inline-block;position:relative;">
    <canvas ref="content" style="pointer-events:none;" :style="canvasStyle" :width="width" :height="height"/>
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
    width: { type: Number, default: 800 },
    height: { type: Number, default: 600 },
  },
  data () {
    return {
      scrollEl: null, // 스크롤 있는 Dom
      canvas: null,
      ctx: null,
      canvasWidth: 0,
      canvasHeight: 0,
      fullHeight: 0,
      imgHeight: 0,
      imgHeightDiff: 0, // 실제 이미지 높이와 캔버스 높이 차이
      imgListHeight: 0,
      cntPerPage: 1, // 받아온 높이로 현재 화면에 표시 할 수 있는 이미지 개수
      containerStyle: null,
      canvasStyle: { position: 'absolute' },
      io: null,
      isShowContent: false, // 이미지가 있는 Conatiner 영역의 보여지는 여부
      isFixed: false, // Container 영역이 스크롤 탑에 붙으면 페이드 효과 시작
      isScrolling: false,
      loadedImgList: [], // 현재 불려진 이미지 목록
      curImgIndex: 0,
      convertWidth: this.width,
      scale: 1,
      canvasLeft: 0,
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
    this.initInfo()
    this.initCanvasStyle()
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
    initInfo () {
      this.fullHeight = getOffsetHeight(this.scrollEl)
      this.imgListHeight = this.fullHeight * this.imgList.length
      this.scale = this.fullHeight / this.height
      this.canvasLeft = this.$refs.container.offsetLeft
    },
    initCanvasStyle () {
      const { top, bottom } = this.getBounds()
      // console.log(this.$refs.container.offsetLeft)
      // console.log(this.$refs.container.getBoundingClientRect().left)
      const defaultStyle = { transform: `matrix(${this.scale}, 0, 0, ${this.scale}, 0, 0)`, 'transform-origin': 'top center', position: 'absolute', left: 0 }
      // const defaultStyle = {}
      if (this.isFixed) {
        this.canvasStyle = { ...defaultStyle, position: 'fixed', top: `${this.scrollEl.offsetTop || 0}px`, left: `${this.canvasLeft}px` }
      } else {
        if (top > 0) {
          this.canvasStyle = { ...defaultStyle, top: 0 }
        } else if (bottom < this.fullHeight) {
          this.canvasStyle = { ...defaultStyle, bottom: `${this.fullHeight - this.height}px` }
        }
      }
      // this.canvasStyle = this.isFixed ? { ...defaultStyle, position: 'fixed', top: `${this.scrollEl.offsetTop || 0}px`, left: `${this.canvasLeft}px` } : defaultStyle
    },
    initIntersectionObserver () {
      if (!this.io) {
        this.io = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
          const { top, bottom } = this.getBounds()
          // console.log(top, bottom)
          // console.log(isIntersecting)
          this.isShowContent = isIntersecting
          this.isFixed = this.isShowContent && top <= 0 && bottom >= this.imgHeight
        }))
      }
      this.io.observe(this.$refs.container)
    },
    async loadImageList () {
      const newImgObjList = []
      // for (let i = Math.max(this.curImgIndex - 1, 0), length = Math.min(this.curImgIndex + 2, this.imgList.length); i < length; i++) {
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
      console.log(getScrollTop(this.scrollEl))
      const top = this.$refs.container.offsetTop - getScrollTop(this.scrollEl)
      return { top, bottom: top + this.imgListHeight }
    },
    drawImg (img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
      this.ctx.save()
      const { width, height } = img
      const scale = this.height / height
      const scaleCanvasWidth = this.width * scale
      const scaleCanvasHeight = this.height * scale
      const scaleWidth = width * scale
      const scaleHeight = height * scale
      const x = scaleWidth > this.width ? (scaleWidth - this.width) / 2 : (this.width - scaleWidth) / 2
      // if (height < this.canvasHeight) {
      // const scale = this.canvasHeight / height
      // const reverseScale = height / this.canvasHeight
      // this.ctx.drawImage(img, newSx, sy * reverseScale, sWidth, sHeight, dx, dy, dWidth, dHeight * scale)
      // } else {
      this.ctx.drawImage(img, x, sy, scaleWidth, sHeight, dx, dy, scaleWidth, dHeight)
      // }
      this.ctx.restore()
    },
    renderImg (index) {
      const img = this.loadedImgList.find(findItem(index))
      if (img) {
        console.log('tttt')
        this.drawImg(img.img, 0, 0, this.width, this.height, 0, 0, this.width, this.height)
      }
    },
    renderFade (yInc = 0) {
      // console.log(yInc)
      const curImg = this.loadedImgList.find(findItem(this.curImgIndex))
      if (curImg) {
        this.drawImg(curImg.img, 0, 0, this.width, this.height - yInc, 0, 0, this.width, this.height - yInc)
      }
      const nextImg = this.loadedImgList.find(findItem(this.curImgIndex + 1))
      if (nextImg) {
        const imgHeight = this.height - yInc
        this.drawImg(nextImg.img, 0, this.height - yInc, this.width, yInc, 0, this.height - yInc, this.width, yInc)
      }
    },
    async render () {
      const { top, bottom } = this.getBounds()
      // console.log(top, bottom)
      const scrollY = Math.abs(top)
      const { length } = this.imgList
      this.isFixed = top <= 0 && bottom >= this.fullHeight
      // 스크롤 위치로 현재 이미지 인덱스 찾기
      for (let i = 0; i < length; i++) {
        if (scrollY > this.fullHeight * i) {
          this.curImgIndex = i
        }
      }
      // // 인덱스 못 찾을 경우 마지막 인덱스 처리
      // if (this.curImgIndex === -1) {
      //   this.curImgIndex = length - 1
      //   await this.loadImageList()
      // }
      this.ctx.clearRect(0, 0, this.width, this.height)
      if (this.isFixed) {
        console.log('fixed')
        //   const totalListHeight = this.canvasHeight * (length - 1)
        //   if (scrollY < 0) {
        //     // 현재 위치가 음수이면 아직 페이드 효과 시작 전
        //     // 이미지를 사이즈에 맞게 리스트 형식으로 그리기
        //     this.renderTopList(this.curImgIndex, -top)
        //   } else if (scrollY > totalListHeight) {
        //     // 총 스크롤 영역보다 크면 마지막 페이드 효과 종료 후
        //     // 이미지 한장 그리기 (페이드 효과 - 전체 높이에서 점점 줄어들기)
        //     const imgHeight = this.canvasHeight + totalListHeight - scrollY
        //     this.ctx.clearRect(0, 0, this.width, this.canvasHeight)
        //     this.renderImg(this.loadedImgList.find(findItem(this.curImgIndex)).img, 0, 0, this.width, imgHeight, 0, 0, this.width, imgHeight)
        //   } else {
        // 이미지 페이드 효과 처리
        this.renderFade((scrollY - this.fullHeight * this.curImgIndex))
      //   }
      } else {
        console.log('bbbb')
        console.log(bottom)
        // 페이드 영역에 도달 하지 않았을 때에는 이미지 리스트로 그리기
        if (top > 0) {
          this.renderImg(0)
        } else if (bottom < this.fullHeight) {
          console.log('1321')
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
      this.initInfo()
      this.initCanvasStyle()
      this.$nextTick(() => this.render())
    }
  }
}
</script>
