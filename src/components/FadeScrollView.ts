const regex = /(auto|scroll)/
const isStickySupport = (function () {
  const el = document.createElement('a')
  el.setAttribute('style', 'position:sticky;position:-webkit-sticky;position:-ms-sticky;')
  return el.style.position.indexOf('sticky') !== -1
}())

function getStyleValue (node: HTMLElement, prop: string) {
  return getComputedStyle(node, null).getPropertyValue(prop)
}
function isScroll (node: HTMLElement) {
  return regex.test(getStyleValue(node, 'overflow') + getStyleValue(node, 'overflow-y') + getStyleValue(node, 'overflow-x'))
}
function findScroll (node: HTMLElement | null): Window | HTMLElement {
  return (!node || node === document.body) ? window : (isScroll(node) ? node : findScroll(node.parentElement))
}
function getFullHeight () {
  // IOS 때문에
  const ruler = document.createElement('div')
  ruler.setAttribute('style', 'position:fixed;height:100vh;width:0;top:0;')
  document.documentElement.appendChild(ruler)
  const height = ruler.offsetHeight
  document.documentElement.removeChild(ruler)
  return height
}
function getOffsetWidth (node: Window | HTMLElement) {
  if (node instanceof Window) {
    return node.innerWidth
  }
  return node.offsetWidth
}
function getOffsetHeight (node: Window | HTMLElement) {
  if (node instanceof Window) {
    return getFullHeight()
  }
  return node.offsetHeight
}
function getScrollTop (node: Window | HTMLElement) {
  if (node instanceof Window) {
    return node.scrollY || 0
  }
  const { offsetTop, scrollTop } = node
  return (scrollTop && offsetTop + scrollTop) || 0
}
function loadImage (src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
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
async function loadImageList (imagePathList: string[]) {
  const imageList = []
  for (let i = 0, length = imagePathList.length; i < length; i++) {
    const image = await loadImage(imagePathList[i])
    imageList.push(image)
  }
  return Promise.resolve(imageList)
}

export default class FadeScrollView {
  private scrollEl: Window | HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null
  private fullWidth = 0
  private fullHeight = 0
  private containerHeight = 0
  private isScrolling = false
  private imageList: HTMLImageElement[] = [] // 현재 불려진 이미지 목록
  private imageIndex = 0
  private isHorizontal = false

  private onScroll = () => {
    if (!this.isScrolling) {
      window.requestAnimationFrame(() => {
        const { top } = this.getBounds()
        if (top < this.fullHeight) {
          this.draw()
        }
        this.isScrolling = false
      })
      this.isScrolling = true
    }
  }

  private onResize = () => {
    this.initSize()
    this.initDomStyle()
    this.draw()
  }

  constructor (public el: HTMLElement, public imagePathList: string[] = []) {
    this.scrollEl = findScroll(el) // 스크롤 있는 Dom
    this.canvas = createCanvas()
    this.ctx = this.canvas.getContext('2d')
    this.addEventListener()
  }

  init () {
    if (this.imageList.length) {
      this.initRender()
    } else {
      this.loadImageList()
    }
  }

  addEventListener () {
    this.scrollEl.addEventListener('scroll', this.onScroll)
    window.addEventListener('resize', this.onResize)
  }

  removeEventListener () {
    this.scrollEl.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.onResize)
  }

  getOffsetWidth () {
    return getOffsetWidth(this.scrollEl)
  }

  getOffsetHeight () {
    return getOffsetHeight(this.scrollEl)
  }

  loadImageList () {
    loadImageList(this.imagePathList).then(imageList => {
      this.imageList = imageList
      this.initRender()
    })
  }

  initSize () {
    this.fullWidth = this.getOffsetWidth()
    this.fullHeight = this.getOffsetHeight()
    this.containerHeight = isStickySupport ? this.fullHeight * this.imageList.length : this.fullHeight
  }

  initDom () {
    if (!this.el.contains(this.canvas)) {
      this.el.appendChild(this.canvas)
    }
  }

  initDomStyle () {
    this.el.setAttribute('style', `${this.el.getAttribute('style')}display:inline-block;width:${this.fullWidth}px;height:${this.containerHeight}px;`)
    this.canvas.width = this.fullWidth
    this.canvas.height = this.fullHeight
  }

  initRender () {
    this.initSize()
    this.initDomStyle()
    this.initDom()
    this.draw()
  }

  setImagePathList (imagePathList: string[]) {
    this.imagePathList = imagePathList
    this.loadImageList()
  }

  getBounds () {
    const top = this.el.offsetTop - getScrollTop(this.scrollEl)
    return { top, bottom: top + this.containerHeight }
  }

  drawImage (image: HTMLImageElement, sy: number, sHeight: number, dy: number, dHeight: number) {
    if (!this.ctx) {
      return
    }
    this.ctx.save()
    const { width, height } = image
    const scaleWidth = width * this.fullHeight / height
    this.ctx.drawImage(image, 0, sy, width, sHeight, (this.fullWidth - scaleWidth) / 2, dy, scaleWidth, dHeight)
    this.ctx.restore()
  }

  drawStaticImage (index: number) {
    const image = this.imageList[index]
    if (image) {
      this.drawImage(image, 0, image.height, 0, this.fullHeight)
    }
  }

  drawHorizontalFadeImage (inc: number) {
    if (!this.ctx) {
      return
    }
    this.drawStaticImage(this.imageIndex + 1)
    const curImage = this.imageList[this.imageIndex]
    if (curImage) {
      this.ctx.save()
      const { width, height } = curImage
      const scaleWidth = width * this.fullHeight / height
      const xInc = inc * scaleWidth / this.fullHeight // 스크롤은 Y 축이지만 수평이동일 때, X 축 증가로 변경
      const imageInc = xInc * width / scaleWidth
      this.ctx.drawImage(curImage, imageInc, 0, width - imageInc, height, (this.fullWidth - scaleWidth) / 2 + xInc, 0, scaleWidth - xInc, this.fullHeight)
      this.ctx.restore()
    }
  }

  drawVerticalFadeImage (inc: number) {
    const curImage = this.imageList[this.imageIndex]
    if (curImage) {
      const { height } = curImage
      const imageInc = inc * height / this.fullHeight
      this.drawImage(curImage, 0, height - imageInc, 0, this.fullHeight - inc)
    }
    const nextImage = this.imageList[this.imageIndex + 1]
    if (nextImage) {
      const { height } = nextImage
      const imageInc = inc * height / this.fullHeight
      this.drawImage(nextImage, height - imageInc, imageInc, this.fullHeight - inc, inc)
    }
  }

  draw () {
    if (!this.ctx) {
      return
    }
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
      const inc = scrollY - this.fullHeight * this.imageIndex
      if (this.isHorizontal) {
        this.drawHorizontalFadeImage(inc)
      } else {
        this.drawVerticalFadeImage(inc)
      }
    } else {
      // 페이드 영역에 도달 하지 않았을 때에는 이미지 그리기
      if (top > 0) {
        this.drawStaticImage(0)
      } else if (bottom < this.fullHeight) {
        this.drawStaticImage(length - 1)
      }
    }
  }
}
