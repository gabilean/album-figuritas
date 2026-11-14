<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useAlbumStore } from '@/stores/albumStore'

const router = useRouter()
const { perfil, esAdmin, logout } = useAuth()
const albumStore = useAlbumStore()

const menuAbierto = ref(false)
const menuMovilAbierto = ref(false) // Estado para abrir/cerrar en móvil

async function ejecutarLogout() {
  await logout()
  router.push('/login')
}

async function reclamarSobre() {
  if (perfil.value?.id) {
    await albumStore.abrirSobreDiario(perfil.value.id)
    menuMovilAbierto.value = false // Cerrar al presionar
  }
}
</script>

<template>
  <!-- Botón Hamburguesa Flotante para Móviles -->
  <button 
    type="button" 
    class="btn-hamburger-mobile" 
    @click="menuMovilAbierto = !menuMovilAbierto"
    aria-label="Toggle Menu"
  >
    {{ menuMovilAbierto ? '✕' : '☰' }}
  </button>

  <!-- Overlay para cerrar al hacer clic afuera en móviles -->
  <div 
    v-if="menuMovilAbierto" 
    class="sidebar-overlay" 
    @click="menuMovilAbierto = false"
  ></div>

  <!-- Sidebar Lateral con clase dinámica para mobile -->
  <aside class="sidebar-admin" :class="{ 'is-open-mobile': menuMovilAbierto }">
    <div class="sidebar-brand">
      <div class="logo-circle">C</div>
    </div>

    <div class="user-info-box">
      <span class="user-badge">{{ perfil?.nombre_usuario || 'Usuario' }}</span>
      <span class="role-badge">{{ esAdmin ? 'Administrador' : 'Usuario' }}</span>
    </div>

    <nav class="nav-section">
      <template v-if="esAdmin">
        <button class="nav-dropdown-btn" @click="menuAbierto = !menuAbierto">
          Administrar <span class="arrow" :class="{ open: menuAbierto }">▸</span>
        </button>

        <div v-if="menuAbierto" class="submenu">
          <router-link to="/admin/usuarios" class="submenu-item" active-class="active" @click="menuMovilAbierto = false">
            Usuarios
          </router-link>
          <router-link to="/admin/figuritas" class="submenu-item" active-class="active" @click="menuMovilAbierto = false">
            Figuritas
          </router-link>
        </div>
      </template>

      <template v-else>
        <router-link to="/dashboard" class="sidebar-item" active-class="active" @click="menuMovilAbierto = false">
          Dashboard
        </router-link>
        <router-link to="/mi-album" class="sidebar-item" active-class="active" @click="menuMovilAbierto = false">
          Mi Álbum
        </router-link>
        <router-link to="/intercambios" class="sidebar-item" active-class="active" @click="menuMovilAbierto = false">
          Intercambios
        </router-link>
        <router-link to="/crafteo" class="sidebar-item" active-class="active" @click="menuMovilAbierto = false">
          Crafteo
        </router-link>

        <button
          type="button"
          class="btn-sobre-diario"
          :class="{ 'modo-cooldown': albumStore.cooldownActivo }"
          :disabled="albumStore.loading || albumStore.cooldownActivo"
          @click="reclamarSobre"
        >
          <span class="icono-sobre">{{ albumStore.cooldownActivo ? '⏳' : '🎁' }}</span>
          <span v-if="albumStore.cooldownActivo">
            Disponible en {{ albumStore.cooldownFormateado }}
          </span>
          <span v-else>Abrir Sobre Diario</span>
        </button>
      </template>
    </nav>

    <div class="sidebar-footer">
      <button class="btn btn-secondary btn-logout" @click="ejecutarLogout">Logout</button>
    </div>
  </aside>
</template>