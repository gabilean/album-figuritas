<script setup>
import { useAuth } from '@/composables/useAuth'

const { perfil } = useAuth()
</script>

<template>
  <div class="user-layout">
    <!-- Encabezado de bienvenida de la sección -->
    <div class="header-banner">
      <h1>Álbum de Figuritas</h1>
      <span class="user-greeting">Hola, {{ perfil?.nombre_usuario || 'Usuario' }}</span>
    </div>

    <main class="user-content">
      <section class="form-section">
        <h2>Mi Colección</h2>
        <p>Esta sección se encuentra en desarrollo. Aquí podrás consultar tu álbum personal, abrir sobres e intercambiar figuritas con otros coleccionistas.</p>
      </section>
    </main>
  </div>
</template>