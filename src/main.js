import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn' // 组件中文文案
import * as Icons from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

// 把 Element Plus 的全部图标注册成全局组件（模板里可直接 <el-icon><User/></el-icon>）
for (const [name, comp] of Object.entries(Icons)) {
  app.component(name, comp)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')
