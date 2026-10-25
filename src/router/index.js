import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AdminFiguritasView from '@/views/AdminFiguritasView.vue'
import AdminUsuariosView from '@/views/AdminUsuariosView.vue'
import LoginView from '@/views/LoginView.vue'
import RegistroView from '@/views/RegistroView.vue'

const routes = [
  {
    path: '/',
    redirect: '/admin/figuritas'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requireGuest: true }
  },
  {
    path: '/registro',
    name: 'registro',
    component: RegistroView,
    meta: { requireGuest: true }
  },
  {
    path: '/admin/figuritas',
    name: 'admin-figuritas',
    component: AdminFiguritasView,
    meta: { requireAuth: true, requireAdmin: true }
  },
  {
    path: '/admin/usuarios',
    name: 'admin-usuarios',
    component: AdminUsuariosView,
    meta: { requireAuth: true, requireAdmin: true }
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const { estaAutenticado, esAdmin, inicializarSesion } = useAuth()
  
  await inicializarSesion()

  if (to.meta.requireAuth && !estaAutenticado.value) {
    return { name: 'login' }
  }

  if (to.meta.requireAdmin && !esAdmin.value) {
    return { name: 'login' }
  }

  if (to.meta.requireGuest && estaAutenticado.value) {
    return { name: 'admin-figuritas' }
  }
})