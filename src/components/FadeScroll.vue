<template>
  <div ref="container" style="position: relative; font-size: 0;">
    <canvas id="content" :style="canvasStyle" :width="convertWidth" :height="canvasHeight"/>
    <div ref="fake" :style="{ display: 'inline-block', width: `${convertWidth}px`, height: `${imgListHeight}px` }"></div>
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
function getOffsetHeight (node) {
  return node.innerHeight || node.offsetHeight
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
      imgHeight: 0,
      imgHeightDiff: 0, // 실제 이미지 높이와 캔버스 높이 차이
      imgListHeight: 0,
      cntPerPage: 1, // 받아온 높이로 현재 화면에 표시 할 수 있는 이미지 개수
      canvasStyle: { position: 'absolute' },
      io: null,
      isShowContent: false, // 이미지가 있는 Conatiner 영역의 보여지는 여부
      isFixed: false, // Container 영역이 스크롤 탑에 붙으면 페이드 효과 시작
      isScrolling: false,
      loadedImgList: [], // 현재 불려진 이미지 목록
      curImgIndex: -1,
      convertWidth: this.width,
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
      this.canvas = document.getElementById('content')
    }
    if (!this.ctx) {
      this.ctx = this.canvas.getContext('2d')
    }
    this.initInfo()
    this.initCanvasStyle()
    this.initIntersectionObserver()
    this.$nextTick(() => this.render())
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
      const { length } = this.imgList
      this.canvasWidth = getOffsetWidth(this.scrollEl)
      this.canvasHeight = getOffsetHeight(this.scrollEl)
      if (this.convertWidth > this.canvasWidth) {
        const { left, right } = this.$refs.container.getBoundingClientRect()
        this.convertWidth = right - left
      }
      this.imgHeight = this.canvasHeight > this.height ? this.height : this.canvasHeight
      this.imgHeightDiff = Math.max(this.canvasHeight - this.imgHeight, 0)
      this.imgListHeight = this.canvasHeight * length + this.imgHeightDiff
      for (let i = 0; i < length; i++) {
        if (this.imgHeight * (i + 1) > this.canvasHeight) {
          this.cntPerPage = i + 1
          break
        }
      }
    },
    initCanvasStyle () {
      const { fake } = this.$refs
      if (this.isFixed) {
        this.canvasStyle = { position: 'fixed', top: `${this.scrollEl.offsetTop || 0}px`, left: `${fake.getBoundingClientRect().left}px`, 'pointer-events': 'none' }
      } else {
        const style = { position: 'absolute', left: `${fake.offsetLeft}px`, 'pointer-events': 'none' }
        if (this.getBounds().top > 0) {
          style.top = 0
        } else {
          style.bottom = 0
        }
        this.canvasStyle = style
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
      this.io.observe(this.$refs.fake)
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
    getBounds () {
      const top = this.$refs.container.offsetTop - getScrollTop(this.scrollEl)
      return { top, bottom: top + this.imgListHeight }
    },
    renderImg (img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
      this.ctx.save()
      this.ctx.beginPath()
      this.ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      this.ctx.restore()
    },
    renderTopList (startIndex, yInc = 0) {
      for (let i = startIndex, j = 0, length = i + this.cntPerPage; i < length; i++, j++) {
        const img = this.loadedImgList.find(findItem(i))
        if (img) {
          const imgHeight = this.imgHeight + yInc
          const y = imgHeight * j
          this.renderImg(img.img, 0, y, this.width, imgHeight, 0, y, this.width, imgHeight)
        }
      }
    },
    renderBottomList (startIndex) {
      for (let i = startIndex, j = 0, length = i + this.cntPerPage; i < length; i++, j++) {
        const img = this.loadedImgList.find(findItem(i))
        if (img) {
          const imgHeight = (this.imgHeight - this.imgHeightDiff) * j + this.imgHeightDiff
          this.renderImg(img.img, 0, (this.imgHeight - this.imgHeightDiff) * (1 - j), this.width, imgHeight, 0, this.imgHeightDiff * j, this.width, imgHeight)
        }
      }
    },
    renderFade (yInc = 0) {
      const curImg = this.loadedImgList.find(findItem(this.curImgIndex))
      if (curImg) {
        this.renderImg(curImg.img, 0, 0, this.width, yInc, 0, 0, this.width, yInc)
      }
      const prevImg = this.loadedImgList.find(findItem(this.curImgIndex - 1))
      if (prevImg) {
        const imgHeight = this.canvasHeight - yInc
        this.renderImg(prevImg.img, 0, yInc, this.width, imgHeight, 0, yInc, this.width, imgHeight)
      }
    },
    async render () {
      const { top, bottom } = this.getBounds()
      const scrollY = Math.abs(top) - this.imgHeightDiff
      const { length } = this.imgList
      this.isFixed = top <= 0 && bottom >= this.imgHeight
      // 스크롤 위치로 현재 이미지 인덱스 찾기
      for (let i = 0; i < length; i++) {
        if (scrollY < this.canvasHeight * i) {
          if (this.curImgIndex !== i) {
            this.curImgIndex = i
            await this.loadImageList()
          }
          break
        }
      }
      // 인덱스 못 찾을 경우 마지막 인덱스 처리
      if (this.curImgIndex === -1) {
        this.curImgIndex = length - 1
        await this.loadImageList()
      }
      if (this.isFixed) {
        const totalListHeight = this.canvasHeight * (length - 1)
        if (scrollY < 0) {
          // 현재 위치가 음수이면 아직 페이드 효과 시작 전
          // 이미지를 사이즈에 맞게 리스트 형식으로 그리기
          this.renderTopList(this.curImgIndex, -top)
        } else if (scrollY > totalListHeight) {
          // 총 스크롤 영역보다 크면 마지막 페이드 효과 종료 후
          // 이미지 한장 그리기 (페이드 효과 - 전체 높이에서 점점 줄어들기)
          const imgHeight = this.canvasHeight + totalListHeight - scrollY
          this.ctx.clearRect(0, 0, this.width, this.canvasHeight)
          this.renderImg(this.loadedImgList.find(findItem(this.curImgIndex)).img, 0, 0, this.width, imgHeight, 0, 0, this.width, imgHeight)
        } else {
          // 이미지 페이드 효과 처리
          this.ctx.clearRect(0, 0, this.width, this.canvasHeight)
          this.renderFade(scrollY - (this.canvasHeight * (this.curImgIndex - 1)))
        }
      } else {
        // 페이드 영역에 도달 하지 않았을 때에는 이미지 리스트로 그리기
        if (top > 0) {
          this.renderTopList(0)
        } else if (bottom < this.imgHeight) {
          this.renderBottomList(this.curImgIndex - 1)
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
