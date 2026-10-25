<script setup>
import { ref } from 'vue'

const menuAbierto = ref(true)
</script>

<template>
  <aside class="sidebar-admin">
    <div class="sidebar-brand">
      <div class="logo-circle">C</div>
    </div>

    <div class="user-info-box">
      <span class="user-badge">nombreUsuario</span>
      <span class="role-badge">Administrador</span>
    </div>

    <div class="nav-section">
      <button class="nav-dropdown-btn" @click="menuAbierto = !menuAbierto">
        Administrar <span class="arrow" :class="{ open: !menuAbierto }">▸</span>
      </button>

      <div v-if="menuAbierto" class="submenu">
        <router-link to="/admin/usuarios" class="submenu-item" active-class="active">
          Usuarios
        </router-link>
        <router-link to="/admin/figuritas" class="submenu-item" active-class="active">
          Figuritas
        </router-link>
      </div>
    </div>

    <div class="sidebar-footer">
      <button class="btn btn-secondary btn-logout">Logout</button>
    </div>
  </aside>
</template>