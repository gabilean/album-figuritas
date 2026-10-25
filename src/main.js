import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

import '@/assets/css/main.css'
import '@/assets/css/components.css'
import '@/assets/css/forms.css'

createApp(App).use(router).mount('#app')
