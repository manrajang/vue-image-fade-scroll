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
<vue-image-fade-scroll :imgList="['img/a.jpg', 'img/b.jpg', 'img/c.jpg', 'img/d.jpg']"/>
<vue-image-fade-scroll :imgList="['img/a.jpg', 'img/b.jpg', 'img/c.jpg', 'img/d.jpg']" isHorizontal/>
```
```js
import VueImageFadeScroll from 'vue-image-fade-scroll'

components: {
  VueImageFadeScroll
}
```

### Props
| Prop                          | Type               | Default     | Description                              |
|-------------------------------|--------------------|:-----------:|------------------------------------------|
| imgList                       | Array              | --          | Image List (required)                    |
| isHorizontal                  | Boolean            | false       | Horizontal Mode                          |
