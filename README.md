# vue-image-fade-scroll

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### Install
```js
import Vue from 'vue'
import VueImageFadeScroll from 'vue-image-fade-scroll'

Vue.use(VueImageFadeScroll)
```

### Example
```html
<fade-scroll :imgList="['img/a.jpg', 'img/b.jpg', 'img/c.jpg', 'img/d.jpg']" :width="600" :height="600"/>
```

### Props
imgList: { type: Array, required: true }
width: { type: Number, default: 800 }
height: { type: Number, default: 600 }
