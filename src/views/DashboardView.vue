<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useAlbumStore } from '@/stores/albumStore'

const router = useRouter()
const { perfil } = useAuth()
const albumStore = useAlbumStore()

onMounted(() => {
  if (perfil.value?.id) {
    albumStore.cargarDatosAlbum(perfil.value.id)
  }
})

function irAlAlbum() {
  router.push('/mi-album')
}
</script>

<template>
  <div class="user-layout">
    <!-- Encabezado Estandarizado -->
    <div class="header-banner">
      <h1>Dashboard de Colección</h1>
      <span class="user-greeting">¡Hola, {{ perfil?.nombre_usuario || 'Coleccionista' }}!</span>
    </div>

    <main class="main-content-inner">
      <!-- Estado de Carga -->
      <p v-if="albumStore.loading">Cargando métricas de tu álbum...</p>

      <template v-else>
        <!-- Sección de Progreso General -->
        <section class="dashboard-section card-dashboard-main">
          <h2>Progreso del Álbum</h2>
          <div class="progress-bar-container">
            <div
              class="progress-bar-fill"
              :style="{ width: albumStore.porcentajeCompletado + '%' }"
            ></div>
          </div>
          <p class="progress-text">
            <strong>{{ albumStore.porcentajeCompletado }}%</strong> del álbum completado ({{ albumStore.totalObtenidas }} de {{ albumStore.totalCatalogo }} figuritas)
          </p>
        </section>

        <!-- Grilla de Tarjetas de Resumen (Métricas Clave) -->
        <section class="dashboard-grid">
          <!-- Obtenidas / Pegadas -->
          <div class="metric-card metric-obtenidas">
            <div class="metric-info">
              <span class="metric-number">{{ albumStore.totalObtenidas }}</span>
              <span class="metric-label">En Posesión</span>
            </div>
          </div>

          <!-- Faltantes -->
          <div class="metric-card metric-faltantes">
            <div class="metric-info">
              <span class="metric-number">{{ albumStore.totalFaltantes }}</span>
              <span class="metric-label">Faltantes</span>
            </div>
          </div>

          <!-- Repetidas -->
          <div class="metric-card metric-repetidas">
            <div class="metric-info">
              <span class="metric-number">{{ albumStore.totalRepetidas }}</span>
              <span class="metric-label">Repetidas Totales</span>
            </div>
          </div>
        </section>

        <!-- Accesos Rápidos (Call to Action) -->
        <section class="dashboard-actions">
          <button type="button" class="btn btn-primary btn-lg" @click="irAlAlbum">
            📖 Ver Mi Álbum Completo
          </button>
        </section>
      </template>
    </main>
  </div>
</template>