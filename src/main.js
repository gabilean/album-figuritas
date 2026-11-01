import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import '@/assets/css/main.css'
import '@/assets/css/forms.css'
import '@/assets/css/components.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')