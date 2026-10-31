<script setup>
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAlbum } from '@/composables/useAlbum'

const { perfil } = useAuth()
const {
  loading,
  error,
  filtros,
  figuritasProcesadas,
  cargarDatosAlbum
} = useAlbum()

onMounted(() => {
  if (perfil.value?.id) {
    cargarDatosAlbum(perfil.value.id)
  }
})

function limpiarFiltros() {
  filtros.busqueda = ''
  filtros.ordenarPor = 'numero'
}
</script>

<template>
  <div class="user-layout">
    <!-- Encabezado Estandarizado -->
    <div class="header-banner">
      <h1>Mi Álbum de Figuritas</h1>
      <span class="user-greeting">Hola, {{ perfil?.nombre_usuario || 'Coleccionista' }}</span>
    </div>

    <main class="main-content-inner">
      <!-- Barra de Filtros -->
      <section class="search-section">
        <input
          v-model="filtros.busqueda"
          type="text"
          class="form-control search-input"
          placeholder="Buscar por jugador, número o país..."
        />

        <div class="filter-group">
          <label for="ordenar">Ordenar por:</label>
          <select id="ordenar" v-model="filtros.ordenarPor" class="form-control select-orden">
            <option value="numero">Número (#)</option>
            <option value="nombre_jugador">Nombre de Jugador</option>
            <option value="pais">Selección / País</option>
            <option value="posicion">Posición</option>
          </select>
        </div>

        <button
          v-if="filtros.busqueda || filtros.ordenarPor !== 'numero'"
          type="button"
          class="btn btn-secondary"
          @click="limpiarFiltros"
        >
          Limpiar
        </button>
      </section>

      <!-- Estados de Carga y Error -->
      <p v-if="loading">Cargando tu colección...</p>
      <p v-if="error" class="error-msg">{{ error }}</p>

      <!-- Grilla Visual con Reactividad Directa -->
      <section v-if="!loading && figuritasProcesadas.length" class="grid-figuritas">
        <article
          v-for="fig in figuritasProcesadas"
          :key="fig.id"
          class="card-figurita"
          :class="{
            'es-especial': fig.es_especial,
            'modo-faltante': fig.cantidad === 0
          }"
        >
          <div class="card-header">
            <span class="numero">#{{ fig.numero }}</span>
            <span v-if="fig.es_especial" class="badge-especial">★ Especial</span>
          </div>

          <div class="card-image-container">
            <img
              v-if="fig.imagen_url"
              :src="fig.imagen_url"
              :alt="fig.nombre_jugador"
              class="card-img"
            />
            <div v-else class="card-img-placeholder">
              <span>Sin Foto</span>
            </div>
          </div>

          <div class="card-body">
            <h3>{{ fig.nombre_jugador }}</h3>
            <p class="pais">{{ fig.pais }}</p>
            <span class="posicion">Posición: {{ fig.posicion || 'N/A' }}</span>
          </div>

          <!-- Pie de tarjeta leyendo 'fig.cantidad' reactivo -->
          <div class="card-footer-status">
            <span v-if="fig.cantidad === 0" class="status-badge status-faltante">
              Faltante (0)
            </span>
            <span v-else-if="fig.cantidad === 1" class="status-badge status-pegada">
              En Posesión (1)
            </span>
            <span v-else class="status-badge status-repetida">
              Repetida ({{ fig.cantidad }})
            </span>
          </div>
        </article>
      </section>

      <p v-else-if="!loading && figuritasProcesadas.length === 0" class="text-center text-muted pad-empty">
        No se encontraron figuritas que coincidan con la búsqueda.
      </p>
    </main>
  </div>
</template>