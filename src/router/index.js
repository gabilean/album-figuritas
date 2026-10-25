import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AdminFiguritasView from '@/views/AdminFiguritasView.vue'
import AdminUsuariosView from '@/views/AdminUsuariosView.vue'
import MiAlbumView from '@/views/MiAlbumView.vue'
import LoginView from '@/views/LoginView.vue'
import RegistroView from '@/views/RegistroView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    redirect: () => {
      const { esAdmin } = useAuth()
      return esAdmin.value ? '/admin/figuritas' : '/mi-album'
    }
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
    path: '/mi-album',
    name: 'mi-album',
    component: MiAlbumView,
    meta: { requireAuth: true }
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
    return { name: 'mi-album' }
  }

  if (to.meta.requireGuest && estaAutenticado.value) {
    return esAdmin.value ? { name: 'admin-figuritas' } : { name: 'mi-album' }
  }
})