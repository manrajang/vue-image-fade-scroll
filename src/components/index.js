import FadeScroll from '@/components/FadeScroll'

export default function install (Vue) {
  if (install.installed) {
    return
  }
  install.installed = true
  Vue.component('image-fade-scroll', FadeScroll)
}

let GlobalVue = null
if (typeof window !== 'undefined') {
  GlobalVue = window.Vue
} else if (typeof global !== 'undefined') {
  GlobalVue = global.Vue
}
if (GlobalVue) {
  GlobalVue.use({ install })
}

export { FadeScroll }
