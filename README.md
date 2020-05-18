# vue-image-fade-scroll

### DEMO
https://manrajang.github.io/vue-image-fade-scroll/

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
| Prop                          | Type               | Default     | Description                              |
|-------------------------------|--------------------|:-----------:|------------------------------------------|
| imgList                       | Array              | --          | Image List (required)                    |
| width                         | Number             | 800         | Image Width                              |
| height                        | Number             | 600         | Image Height                             |
