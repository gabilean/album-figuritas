<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useAlbum } from '@/composables/useAlbum'

const router = useRouter()
const { perfil, esAdmin, logout } = useAuth()
const { abrirSobreDiario, loading } = useAlbum()

const menuAbierto = ref(false)

async function ejecutarLogout() {
  await logout()
  router.push('/login')
}

async function reclamarSobre() {
  if (perfil.value?.id) {
    await abrirSobreDiario(perfil.value.id)
  }
}
</script>

<template>
  <aside class="sidebar-admin">
    <div class="sidebar-brand">
      <div class="logo-circle">C</div>
    </div>

    <div class="user-info-box">
      <span class="user-badge">{{ perfil?.nombre_usuario || 'Usuario' }}</span>
      <span class="role-badge">{{ esAdmin ? 'Administrador' : 'Usuario' }}</span>
    </div>

    <nav class="nav-section">
      <!-- Opciones para Administrador -->
      <template v-if="esAdmin">
        <button class="nav-dropdown-btn" @click="menuAbierto = !menuAbierto">
          Administrar <span class="arrow" :class="{ open: menuAbierto }">▸</span>
        </button>

        <div v-if="menuAbierto" class="submenu">
          <router-link to="/admin/usuarios" class="submenu-item" active-class="active">
            Usuarios
          </router-link>
          <router-link to="/admin/figuritas" class="submenu-item" active-class="active">
            Figuritas
          </router-link>
        </div>
      </template>

      <!-- Opciones para Usuario Común -->
      <template v-else>
        <router-link to="/dashboard" class="sidebar-item" active-class="active">
          Dashboard
        </router-link>
        <router-link to="/mi-album" class="sidebar-item" active-class="active">
          Mi Álbum
        </router-link>

        <!-- Botón de Drop de Sobre Diario (Ubicado por debajo de Mi Álbum) -->
        <button
          type="button"
          class="btn-sobre-diario"
          :disabled="loading"
          @click="reclamarSobre"
        >
          <span class="icono-sobre">🎁</span>
          <span>Abrir Sobre Diario</span>
        </button>
      </template>
    </nav>

    <!-- Botón siempre ubicado al fondo del menú lateral -->
    <div class="sidebar-footer">
      <button class="btn btn-secondary btn-logout" @click="ejecutarLogout">Logout</button>
    </div>
  </aside>
</template>