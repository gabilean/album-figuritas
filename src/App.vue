<script setup>
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AdminSidebar from '@/components/AdminSidebar.vue'

const route = useRoute()
const { estaAutenticado } = useAuth()
</script>

<template>
  <!-- Layout con Sidebar solo si está autenticado y no es ruta de invitado -->
  <div v-if="estaAutenticado && !route.meta.requireGuest" class="admin-layout">
    <AdminSidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>

  <!-- Layout para Login y Registro sin Sidebar -->
  <div v-else class="auth-layout">
    <router-view />
  </div>
</template>