<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAlbumStore } from '@/stores/albumStore'

const { perfil } = useAuth()
const albumStore = useAlbumStore()

const datoModalActivo = ref(null) // { jugador, pais, texto, creditosRestantes }
const errorDatoIA = ref(null)

onMounted(() => {
  if (perfil.value?.id) {
    albumStore.cargarDatosAlbum(perfil.value.id)
  }
})

const mapaRegistrosUsuario = computed(() => {
  const mapa = {}
  albumStore.miColeccion.forEach(item => {
    if (item && item.figurita_id) {
      mapa[String(item.figurita_id)] = item
    }
  })
  return mapa
})

function obtenerInfoIACarta(figuritaId) {
  const reg = mapaRegistrosUsuario.value[String(figuritaId)]
  const cantidad = reg?.cantidad || 0
  const usadas = reg?.consultas_ia_usadas || 0
  const disponibles = Math.max(0, cantidad - usadas)
  return {
    cantidad,
    usadas,
    disponibles,
    ultimoDato: reg?.ultimo_dato_ia || null
  }
}

async function manejarDatoIA(fig) {
  errorDatoIA.value = null
  const info = obtenerInfoIACarta(fig.id)

  // Si no tiene créditos nuevos pero ya había desbloqueado un dato previo, lo mostramos sin gastar API
  if (info.disponibles === 0 && info.ultimoDato) {
    datoModalActivo.value = {
      jugador: fig.nombre_jugador,
      pais: fig.pais,
      texto: info.ultimoDato,
      creditosRestantes: 0
    }
    return
  }

  if (info.disponibles <= 0) return

  try {
    const textoGenerado = await albumStore.consultarDatoJugadorIA(fig)
    const infoActualizada = obtenerInfoIACarta(fig.id)
    datoModalActivo.value = {
      jugador: fig.nombre_jugador,
      pais: fig.pais,
      texto: textoGenerado,
      creditosRestantes: infoActualizada.disponibles
    }
  } catch (err) {
    errorDatoIA.value =
      err.response?.data?.error || err.message || 'No se pudo obtener el dato del jugador.'
  }
}
</script>

<template>
  <div class="user-layout">
    <div class="header-banner">
      <h1>Mi Álbum de Figuritas</h1>
      <span class="user-greeting">Hola, {{ perfil?.nombre_usuario || 'Coleccionista' }}</span>
    </div>

    <main class="main-content-inner">
      <!-- Banner del Sobre -->
      <div v-if="albumStore.sobreMensaje && albumStore.sobreMensaje.length" class="banner-sobre-exito">
        <div class="banner-contenido">
          <h3>🎉 ¡Abriste un sobre con 5 figuritas!</h3>
          <ul>
            <li v-for="fig in albumStore.sobreMensaje" :key="fig.id">
              #{{ fig.numero }} <strong>{{ fig.nombre_jugador }}</strong> ({{ fig.pais }})
            </li>
          </ul>
          <p v-if="albumStore.intercambiosCanceladosAuto?.length" class="aviso-cancelacion-sobre">
            Se canceló el pedido automáticamente porque la obtuviste con este sobre:
            <strong>{{ albumStore.intercambiosCanceladosAuto.join(', ') }}</strong>.
          </p>
          <button type="button" class="btn btn-secondary btn-sm" @click="albumStore.cerrarBanner">
            Cerrar
          </button>
        </div>
      </div>

      <!-- Mensaje de error de Dato IA (si falla la llamada) -->
      <div v-if="errorDatoIA" class="alert-error-box">
        <p>{{ errorDatoIA }}</p>
        <button type="button" class="btn btn-secondary btn-sm" @click="errorDatoIA = null">
          Cerrar
        </button>
      </div>

      <!-- Barra de Filtros -->
      <section class="search-section">
        <input
          v-model="albumStore.filtros.busqueda"
          type="text"
          class="form-control search-input"
          placeholder="Buscar por jugador, número o país..."
        />

        <div class="filter-group">
          <label for="ordenar">Ordenar por:</label>
          <select id="ordenar" v-model="albumStore.filtros.ordenarPor" class="form-control select-orden">
            <option value="numero">Número (#)</option>
            <option value="nombre_jugador">Nombre de Jugador</option>
            <option value="pais">Selección / País</option>
            <option value="posicion">Posición</option>
          </select>
        </div>

        <button
          v-if="albumStore.filtros.busqueda || albumStore.filtros.ordenarPor !== 'numero'"
          type="button"
          class="btn btn-secondary"
          @click="albumStore.limpiarFiltros"
        >
          Limpiar
        </button>
      </section>

      <!-- Grilla de Tarjetas -->
      <section v-if="!albumStore.loading && albumStore.figuritasProcesadas.length" class="grid-figuritas">
        <article
          v-for="fig in albumStore.figuritasProcesadas"
          :key="fig.id"
          class="card-figurita"
          :class="{
            'es-especial': fig.es_especial,
            'modo-faltante': fig.cantidad === 0,
            'primera-posesion': fig.esNueva
          }"
        >
          <div class="card-header">
            <span class="numero">#{{ fig.numero }}</span>
            <span v-if="fig.esNueva" class="badge-nueva">✨ ¡Nueva!</span>
            <span v-else-if="fig.es_especial" class="badge-especial">★ Especial</span>
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

          <div v-if="fig.cantidad > 0" class="card-ia-section">
            <button
              type="button"
              class="btn btn-sm btn-full"
              :class="obtenerInfoIACarta(fig.id).disponibles > 0 ? 'btn-ia-activo' : 'btn-secondary'"
              :disabled="
                albumStore.cargandoDatoCartaId === fig.id ||
                (obtenerInfoIACarta(fig.id).disponibles === 0 && !obtenerInfoIACarta(fig.id).ultimoDato)
              "
              @click="manejarDatoIA(fig)"
            >
              <template v-if="albumStore.cargandoDatoCartaId === fig.id">
                Consultando IA...
              </template>
              <template v-else-if="obtenerInfoIACarta(fig.id).disponibles > 0">
                TrivIA ({{ obtenerInfoIACarta(fig.id).disponibles }} disp.)
              </template>
              <template v-else>
                Ver última TrivIA
              </template>
            </button>

            <span v-if="obtenerInfoIACarta(fig.id).disponibles === 0" class="ia-hint-repetida">
              Conseguí una repetida para desbloquear otro dato
            </span>
          </div>
        </article>
      </section>
    </main>

    <div v-if="datoModalActivo" class="ia-modal-overlay" @click.self="datoModalActivo = null">
      <div class="ia-modal-card">
        <div class="ia-modal-header">
          <h3>Dato Mundialista: {{ datoModalActivo.jugador }}</h3>
          <span class="badge-stock-intercambio">{{ datoModalActivo.pais }}</span>
        </div>
        <p class="ia-modal-texto">{{ datoModalActivo.texto }}</p>
        <p class="posicion">
          {{
            datoModalActivo.creditosRestantes > 0
              ? `Te quedan ${datoModalActivo.creditosRestantes} consulta(s) nueva(s) disponible(s) para esta carta.`
              : 'Conseguí otra copia repetida de este jugador para desbloquear una curiosidad nueva.'
          }}
        </p>
        <div class="ia-modal-footer">
          <button type="button" class="btn btn-primary" @click="datoModalActivo = null">
            Entendido
          </button>
        </div>
      </div>
    </div>
  </div>
</template>