import 'intersection-observer'

const regex = /(auto|scroll)/
const isStickySupport = (function () {
  const el = document.createElement('a')
  el.setAttribute('style', 'position:sticky;position:-webkit-sticky;position:-ms-sticky;')
  return el.style.position.indexOf('sticky') !== -1
}())

function getStyleValue (node, prop) {
  return getComputedStyle(node, null).getPropertyValue(prop)
}
function isScroll (node) {
  return regex.test(getStyleValue(node, 'overflow') + getStyleValue(node, 'overflow-y') + getStyleValue(node, 'overflow-x'))
}
function findScroll (node) {
  return (!node || node === document.body) ? window : (isScroll(node) ? node : findScroll(node.parentNode))
}
function getFullHeight () {
  const ruler = document.createElement('div')
  ruler.setAttribute('style', 'position:fixed;height:100vh;width:0;top:0;')
  document.documentElement.appendChild(ruler)
  const height = ruler.offsetHeight
  document.documentElement.removeChild(ruler)
  return height
}
function getOffsetWidth (node) {
  return node.innerWidth || node.offsetWidth
}
function getOffsetHeight (node) {
  return node.innerHeight ? getFullHeight() : node.offsetHeight
}
function getScrollTop ({ scrollY, scrollTop, offsetTop }) {
  return scrollY || (scrollTop && offsetTop + scrollTop) || 0
}
function loadImage (src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}
function createCanvas () {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('style', 'pointer-events:none;position:sticky;transform-origin:top center;top:0px;')
  return canvas
}
async function loadImageList (imagePathList) {
  const imageList = []
  for (let i = 0, length = imagePathList.length; i < length; i++) {
    const image = await loadImage(imagePathList[i])
    imageList.push(image)
  }
  return Promise.resolve(imageList)
}

export default class FadeScrollView {
  constructor (el, imagePathList = []) {
    this.el = el
    this.imagePathList = imagePathList
    this.scrollEl = findScroll(el) // 스크롤 있는 Dom
    this.canvas = createCanvas(el)
    this.ctx = this.canvas.getContext('2d')
    this.fullWidth = 0
    this.fullHeight = 0
    this.containerHeight = 0
    this.intersectionObserver = null
    this.isShowContent = false // 이미지가 있는 Conatiner 영역의 보여지는 여부
    this.isScrolling = false
    this.imageList = [] // 현재 불려진 이미지 목록
    this.imageIndex = 0
    this.onScroll = null
    this.onResize = null
    this.addEventListener()
  }
  init () {
    this.initIntersectionObserver()
    if (this.imageList.length) {
      this.render()
    } else {
      this.loadImageList()
    }
  }
  initIntersectionObserver () {
    if (!this.intersectionObserver) {
      this.intersectionObserver = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => this.isShowContent = isIntersecting))
    }
    this.intersectionObserver.observe(this.el)
  }
  addEventListener () {
    this.onScroll = () => this._onScroll()
    this.onResize = () => this._onResize()
    this.scrollEl.addEventListener('scroll', this.onScroll)
    window.addEventListener('resize', this.onResize)
  }
  removeEventListener () {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
    if (this.onScroll) {
      this.onScroll = null
      this.scrollEl.removeEventListener('scroll', this.onScroll)
    }
    if (this.onResize) {
      this.onResize = null
      window.removeEventListener('resize', this.onResize)
    }
  }
  getOffsetWidth () {
    return getOffsetWidth(this.scrollEl)
  }
  getOffsetHeight () {
    return getOffsetHeight(this.scrollEl)
  }
  initSize () {
    this.fullWidth = this.getOffsetWidth()
    this.fullHeight = this.getOffsetHeight()
    this.containerHeight = isStickySupport ? this.fullHeight * this.imageList.length : this.fullHeight
  }
  loadImageList () {
    loadImageList(this.imagePathList, this.imageList).then(imageList => {
      this.imageList = imageList
      this.render()
    })
  }
  initDom () {
    if (this.el.hasChildNodes()) {
      this.el.removeChild(this.canvas)
    }
    this.el.appendChild(this.canvas)
  }
  initDomStyle () {
    this.el.setAttribute('style', `display:inline-block;width:${this.fullWidth}px;height:${this.containerHeight}px;`)
    this.canvas.width = this.fullWidth
    this.canvas.height = this.fullHeight
  }
  render () {
    this.initSize()
    this.initDom()
    this.initDomStyle()
    this.draw()
  }
  setImagePathList (imagePathList) {
    this.imagePathList = imagePathList
    this.loadImageList()
  }
  getBounds () {
    const top = this.el.offsetTop - getScrollTop(this.scrollEl)
    return { top, bottom: top + this.containerHeight }
  }
  drawImage (image, sx, sy, sHeight, dy, dHeight) {
    this.ctx.save()
    const { width, height } = image
    const scaleWidth = width * this.fullHeight / height
    this.ctx.drawImage(image, sx, sy, width, sHeight, (this.fullWidth - scaleWidth) / 2, dy, scaleWidth, dHeight)
    this.ctx.restore()
  }
  drawStaticImage (index) {
    const image = this.imageList[index]
    if (image) {
      this.drawImage(image, 0, 0, image.height, 0, this.fullHeight)
    }
  }
  drawFadeImage (yInc) {
    const curImage = this.imageList[this.imageIndex]
    if (curImage) {
      const { height } = curImage
      const imageYInc = yInc * height / this.fullHeight
      this.drawImage(curImage, 0, 0, height - imageYInc, 0, this.fullHeight - yInc)
    }
    const nextImage = this.imageList[this.imageIndex + 1]
    if (nextImage) {
      const { height } = nextImage
      const imageYInc = yInc * height / this.fullHeight
      this.drawImage(nextImage, 0, height - imageYInc, imageYInc, this.fullHeight - yInc, yInc)
    }
  }
  draw () {
    const { top, bottom } = this.getBounds()
    const scrollY = Math.abs(top)
    const { length } = this.imageList
    // 스크롤 위치로 현재 이미지 인덱스 찾기
    for (let i = 0; i < length; i++) {
      if (scrollY > this.fullHeight * i) {
        this.imageIndex = i
      }
    }
    this.ctx.clearRect(0, 0, this.fullWidth, this.fullHeight)
    if (top <= 0 && bottom >= this.fullHeight) {
      // 이미지 페이드 효과 처리
      this.drawFadeImage(scrollY - this.fullHeight * this.imageIndex)
    } else {
      // 페이드 영역에 도달 하지 않았을 때에는 이미지 그리기
      if (top > 0) {
        this.drawStaticImage(0)
      } else if (bottom < this.fullHeight) {
        this.drawStaticImage(length - 1)
      }
    }
  }
  _onScroll () {
    if (!this.isScrolling) {
      window.requestAnimationFrame(() => {
        if (this.isShowContent) {
          this.draw()
        }
        this.isScrolling = false
      })
      this.isScrolling = true
    }
  }
  _onResize () {
    this.initSize()
    this.initDomStyle()
    this.draw()
  }
}
