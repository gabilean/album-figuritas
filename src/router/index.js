import { createRouter, createWebHistory } from 'vue-router'
import AdminFiguritasView from '@/views/AdminFiguritasView.vue'
import AdminUsuariosView from '@/views/AdminUsuariosView.vue'

const routes = [
  {
    path: '/',
    redirect: '/admin/figuritas'
  },
  {
    path: '/admin/figuritas',
    name: 'admin-figuritas',
    component: AdminFiguritasView
  },
  {
    path: '/admin/usuarios',
    name: 'admin-usuarios',
    component: AdminUsuariosView
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})