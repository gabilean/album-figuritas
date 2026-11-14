<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAlbumStore } from '@/stores/albumStore'

const { perfil } = useAuth()
const albumStore = useAlbumStore()

const pestanaActiva = ref('tablon')
const soloDisponiblesParaMi = ref(false)
const busquedaFaltante = ref('')
const busquedaRepetida = ref('')

const buscadaSeleccionada = ref(null)
const ofrecidaSeleccionada = ref(null)
const enviandoPedido = ref(false)
const procesandoId = ref(null)

const mensajeExito = ref(null)
const mensajeError = ref(null)

onMounted(async () => {
  if (perfil.value?.id && albumStore.catalogo.length === 0) {
    await albumStore.cargarDatosAlbum(perfil.value.id)
  }
  await albumStore.cargarIntercambios()
})

const mapaCantidadesUsuario = computed(() => {
  const mapa = {}
  albumStore.miColeccion.forEach(item => {
    if (item && item.figurita_id) {
      mapa[String(item.figurita_id)] = item.cantidad
    }
  })
  return mapa
})

function cantidadEnMiColeccion(figuritaId) {
  return mapaCantidadesUsuario.value[String(figuritaId)] || 0
}

function laTengoFaltante(figuritaId) {
  return cantidadEnMiColeccion(figuritaId) === 0
}

function puedeAceptar(intercambio) {
  return cantidadEnMiColeccion(intercambio.figurita_buscada_id) > 1
}

const ofertasDeOtros = computed(() => {
  return albumStore.intercambiosEnriquecidos.filter(i => i.creador_id !== perfil.value?.id)
})

const ofertasFiltradas = computed(() => {
  if (!soloDisponiblesParaMi.value) return ofertasDeOtros.value
  return ofertasDeOtros.value.filter(i => puedeAceptar(i))
})

const misOfertas = computed(() => {
  return albumStore.intercambiosEnriquecidos.filter(i => i.creador_id === perfil.value?.id)
})

const figuritasFaltantesFiltradas = computed(() => {
  const texto = busquedaFaltante.value.trim().toLowerCase()
  return albumStore.catalogo
    .filter(fig => cantidadEnMiColeccion(fig.id) === 0)
    .filter(fig => {
      if (!texto) return true
      return (
        fig.nombre_jugador.toLowerCase().includes(texto) ||
        fig.numero.toString().includes(texto) ||
        fig.pais.toLowerCase().includes(texto)
      )
    })
    .sort((a, b) => a.numero - b.numero)
})

const figuritasRepetidasFiltradas = computed(() => {
  const texto = busquedaRepetida.value.trim().toLowerCase()
  return albumStore.catalogo
    .map(fig => ({
      ...fig,
      cantidad: cantidadEnMiColeccion(fig.id)
    }))
    .filter(fig => fig.cantidad > 1)
    .filter(fig => {
      if (!texto) return true
      return (
        fig.nombre_jugador.toLowerCase().includes(texto) ||
        fig.numero.toString().includes(texto) ||
        fig.pais.toLowerCase().includes(texto)
      )
    })
    .sort((a, b) => a.numero - b.numero)
})

function seleccionarBuscada(fig) {
  buscadaSeleccionada.value = fig
  ofrecidaSeleccionada.value = null
}

function resetearSeleccion() {
  buscadaSeleccionada.value = null
  ofrecidaSeleccionada.value = null
}

async function publicarIntercambio() {
  if (!buscadaSeleccionada.value || !ofrecidaSeleccionada.value || !perfil.value?.id) return
  enviandoPedido.value = true
  mensajeError.value = null
  mensajeExito.value = null

  try {
    await albumStore.crearPedidoIntercambio(
      perfil.value.id,
      perfil.value.nombre_usuario,
      buscadaSeleccionada.value.id,
      ofrecidaSeleccionada.value.id
    )
    mensajeExito.value = `Pedido publicado: Buscás #${buscadaSeleccionada.value.numero} (${buscadaSeleccionada.value.nombre_jugador}) a cambio de #${ofrecidaSeleccionada.value.numero} (${ofrecidaSeleccionada.value.nombre_jugador}).`
    resetearSeleccion()
    pestanaActiva.value = 'mis_pedidos'
  } catch (err) {
    mensajeError.value = err.response?.data?.message || err.message || 'No se pudo publicar el intercambio.'
  } finally {
    enviandoPedido.value = false
  }
}

async function confirmarAceptar(item) {
  if (!puedeAceptar(item) || !perfil.value?.id) return
  procesandoId.value = item.id
  mensajeError.value = null
  mensajeExito.value = null

  try {
    await albumStore.aceptarIntercambio(item.id, perfil.value.id)
    mensajeExito.value = `Intercambio completado. Recibiste a #${item.figurita_ofrecida?.numero} ${item.figurita_ofrecida?.nombre_jugador} y entregaste a #${item.figurita_buscada?.numero} ${item.figurita_buscada?.nombre_jugador}.`
  } catch (err) {
    mensajeError.value = err.response?.data?.message || err.message || 'No se pudo completar el intercambio.'
    await albumStore.cargarIntercambios()
  } finally {
    procesandoId.value = null
  }
}

async function confirmarCancelar(intercambioId) {
  procesandoId.value = intercambioId
  mensajeError.value = null
  mensajeExito.value = null

  try {
    await albumStore.cancelarIntercambio(intercambioId)
    mensajeExito.value = 'El pedido de intercambio fue cancelado.'
  } catch (err) {
    mensajeError.value = err.response?.data?.message || err.message || 'Error al cancelar el intercambio.'
  } finally {
    procesandoId.value = null
  }
}
</script>

<template>
  <div class="user-layout">
    <div class="header-banner">
      <h1>Intercambios 1x1</h1>
      <span class="user-greeting">Tablón Global de Canjes</span>
    </div>

    <main class="main-content-inner">
      <!-- Mensajes de Estado -->
      <div v-if="mensajeExito" class="banner-sobre-exito">
        <div class="banner-contenido">
          <p>{{ mensajeExito }}</p>
          <button type="button" class="btn btn-secondary btn-sm" @click="mensajeExito = null">
            Cerrar
          </button>
        </div>
      </div>

      <div v-if="mensajeError" class="alert-error-box">
        <p>{{ mensajeError }}</p>
        <button type="button" class="btn btn-secondary btn-sm" @click="mensajeError = null">
          Cerrar
        </button>
      </div>

      <!-- Pestañas de Navegación -->
      <div class="intercambios-tabs">
        <button
          type="button"
          class="btn"
          :class="pestanaActiva === 'tablon' ? 'btn-primary' : 'btn-secondary'"
          @click="pestanaActiva = 'tablon'"
        >
          Tablón Global ({{ ofertasDeOtros.length }})
        </button>
        <button
          type="button"
          class="btn"
          :class="pestanaActiva === 'publicar' ? 'btn-primary' : 'btn-secondary'"
          @click="pestanaActiva = 'publicar'"
        >
          Publicar Pedido
        </button>
        <button
          type="button"
          class="btn"
          :class="pestanaActiva === 'mis_pedidos' ? 'btn-primary' : 'btn-secondary'"
          @click="pestanaActiva = 'mis_pedidos'"
        >
          Mis Pedidos ({{ misOfertas.length }})
        </button>
      </div>

      <!-- PESTAÑA 1: TABLÓN GLOBAL -->
      <section v-if="pestanaActiva === 'tablon'">
        <div class="search-section">
          <label class="checkbox-filter">
            <input type="checkbox" v-model="soloDisponiblesParaMi" />
            Mostrar solo intercambios que puedo aceptar ahora (tengo su buscada repetida)
          </label>
        </div>

        <div v-if="albumStore.cargandoIntercambios" class="empty-message">
          Cargando ofertas del tablón global...
        </div>

        <div v-else-if="ofertasFiltradas.length === 0" class="empty-message">
          <p>No hay ofertas disponibles con el filtro actual.</p>
          <button type="button" class="btn btn-primary" @click="pestanaActiva = 'publicar'">
            Publicar mi primer pedido
          </button>
        </div>

        <div v-else class="grid-intercambios">
          <article
            v-for="item in ofertasFiltradas"
            :key="item.id"
            class="card-intercambio"
            :class="{ 'intercambio-disponible': puedeAceptar(item) }"
          >
            <div class="intercambio-header">
            <span>De: <strong>{{ item.creador_nombre || 'Coleccionista' }}</strong></span>
            <span v-if="puedeAceptar(item)" class="status-badge status-pegada">Disponible</span>
            <span v-else class="status-badge status-faltante">Sin repetida</span>
            </div>

            <div class="intercambio-cuerpo">
              <!-- Recibís -->
              <div class="intercambio-slot">
                <span class="slot-titulo">Recibís</span>
                <div class="card-image-container mini-slot-img">
                  <img
                    v-if="item.figurita_ofrecida?.imagen_url"
                    :src="item.figurita_ofrecida.imagen_url"
                    :alt="item.figurita_ofrecida.nombre_jugador"
                    class="card-img"
                  />
                  <div v-else class="card-img-placeholder"><span>Sin Foto</span></div>
                </div>
                <strong>#{{ item.figurita_ofrecida?.numero }} {{ item.figurita_ofrecida?.nombre_jugador }}</strong>
                <span class="pais">{{ item.figurita_ofrecida?.pais }}</span>
                <span v-if="laTengoFaltante(item.figurita_ofrecida_id)" class="status-badge badge-stock-intercambio">
                  Te falta
                </span>
              </div>

              <div class="intercambio-separador">1x1</div>

              <!-- Entregás -->
              <div class="intercambio-slot">
                <span class="slot-titulo">Entregás</span>
                <div class="card-image-container mini-slot-img">
                  <img
                    v-if="item.figurita_buscada?.imagen_url"
                    :src="item.figurita_buscada.imagen_url"
                    :alt="item.figurita_buscada.nombre_jugador"
                    class="card-img"
                  />
                  <div v-else class="card-img-placeholder"><span>Sin Foto</span></div>
                </div>
                <strong>#{{ item.figurita_buscada?.numero }} {{ item.figurita_buscada?.nombre_jugador }}</strong>
                <span class="pais">{{ item.figurita_buscada?.pais }}</span>
                <span class="posicion">Tenés: {{ cantidadEnMiColeccion(item.figurita_buscada_id) }}</span>
              </div>
            </div>

            <div class="card-footer-status">
              <button
                type="button"
                class="btn btn-primary btn-full"
                :disabled="!puedeAceptar(item) || procesandoId === item.id"
                @click="confirmarAceptar(item)"
              >
                {{ procesandoId === item.id ? 'Procesando...' : 'Aceptar Intercambio' }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- PESTAÑA 2: PUBLICAR PEDIDO (2 PASOS) -->
      <section v-if="pestanaActiva === 'publicar'">
        <div class="intercambio-resumen-bar">
          <div class="resumen-paso">
            <span class="slot-titulo">1. Figurita Buscada (Faltante)</span>
            <p v-if="buscadaSeleccionada">
              <strong>#{{ buscadaSeleccionada.numero }} {{ buscadaSeleccionada.nombre_jugador }}</strong> ({{ buscadaSeleccionada.pais }})
            </p>
            <p v-else class="posicion">Seleccioná una figurita faltante abajo</p>
          </div>

          <div class="resumen-paso">
            <span class="slot-titulo">2. Figurita a Entregar (Repetida)</span>
            <p v-if="ofrecidaSeleccionada">
              <strong>#{{ ofrecidaSeleccionada.numero }} {{ ofrecidaSeleccionada.nombre_jugador }}</strong> (Tenés {{ ofrecidaSeleccionada.cantidad }})
            </p>
            <p v-else class="posicion">
              {{ buscadaSeleccionada ? 'Elegí cuál repetida entregás' : 'Completá primero el paso 1' }}
            </p>
          </div>

          <div class="resumen-acciones">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!buscadaSeleccionada || !ofrecidaSeleccionada || enviandoPedido"
              @click="publicarIntercambio"
            >
              {{ enviandoPedido ? 'Publicando...' : 'Publicar en Tablón' }}
            </button>
            <button
              v-if="buscadaSeleccionada || ofrecidaSeleccionada"
              type="button"
              class="btn btn-secondary btn-sm"
              @click="resetearSeleccion"
            >
              Reiniciar
            </button>
          </div>
        </div>

        <!-- PASO 1: FALTANTES -->
        <div v-if="!buscadaSeleccionada">
          <div class="search-section">
            <h2>Paso 1: Elegí la figurita que te falta</h2>
            <input
              v-model="busquedaFaltante"
              type="text"
              class="form-control search-input"
              placeholder="Buscar faltante por jugador, número o país..."
            />
          </div>

          <div v-if="figuritasFaltantesFiltradas.length === 0" class="empty-message">
            No se encontraron figuritas faltantes con ese criterio.
          </div>

          <div v-else class="grid-figuritas">
            <article
              v-for="fig in figuritasFaltantesFiltradas"
              :key="fig.id"
              class="card-figurita card-seleccionable"
              @click="seleccionarBuscada(fig)"
            >
              <div class="card-header">
                <span class="numero">#{{ fig.numero }}</span>
                <span class="status-badge status-faltante">Faltante</span>
              </div>

              <div class="card-image-container">
                <img v-if="fig.imagen_url" :src="fig.imagen_url" :alt="fig.nombre_jugador" class="card-img" />
                <div v-else class="card-img-placeholder"><span>Sin Foto</span></div>
              </div>

              <div class="card-body">
                <h3>{{ fig.nombre_jugador }}</h3>
                <p class="pais">{{ fig.pais }}</p>
              </div>

              <div class="card-footer-status">
                <button type="button" class="btn btn-primary btn-sm btn-full">Seleccionar</button>
              </div>
            </article>
          </div>
        </div>

        <!-- PASO 2: REPETIDAS -->
        <div v-else>
          <div class="search-section">
            <div>
              <h2>Paso 2: Elegí cuál de tus repetidas ofrecés</h2>
              <button type="button" class="btn btn-secondary btn-sm" @click="resetearSeleccion">
                Cambiar figurita buscada
              </button>
            </div>
            <input
              v-model="busquedaRepetida"
              type="text"
              class="form-control search-input"
              placeholder="Buscar en tus repetidas..."
            />
          </div>

          <div v-if="figuritasRepetidasFiltradas.length === 0" class="empty-message">
            No tenés figuritas repetidas disponibles para ofrecer (necesitás tener más de 1).
          </div>

          <div v-else class="grid-figuritas">
            <article
              v-for="fig in figuritasRepetidasFiltradas"
              :key="fig.id"
              class="card-figurita card-seleccionable"
              :class="{ 'carta-seleccionada': ofrecidaSeleccionada?.id === fig.id }"
              @click="ofrecidaSeleccionada = fig"
            >
              <div class="card-header">
                <span class="numero">#{{ fig.numero }}</span>
                <span class="status-badge badge-stock-intercambio">Repetida ({{ fig.cantidad }})</span>
              </div>

              <div class="card-image-container">
                <img v-if="fig.imagen_url" :src="fig.imagen_url" :alt="fig.nombre_jugador" class="card-img" />
                <div v-else class="card-img-placeholder"><span>Sin Foto</span></div>
              </div>

              <div class="card-body">
                <h3>{{ fig.nombre_jugador }}</h3>
                <p class="pais">{{ fig.pais }}</p>
              </div>

              <div class="card-footer-status">
                <button type="button" class="btn btn-primary btn-sm btn-full">
                  {{ ofrecidaSeleccionada?.id === fig.id ? 'Seleccionada' : 'Ofrecer esta' }}
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- PESTAÑA 3: MIS PEDIDOS -->
      <section v-if="pestanaActiva === 'mis_pedidos'">
        <div v-if="misOfertas.length === 0" class="empty-message">
          No tenés pedidos de intercambio pendientes.
        </div>

        <div v-else class="grid-intercambios">
          <article v-for="item in misOfertas" :key="item.id" class="card-intercambio">
            <div class="intercambio-header">
              <span>Estado: <strong>Pendiente en tablón</strong></span>
            </div>

            <div class="intercambio-cuerpo">
              <div class="intercambio-slot">
                <span class="slot-titulo">Ofrecés</span>
                <div class="card-image-container mini-slot-img">
                  <img
                    v-if="item.figurita_ofrecida?.imagen_url"
                    :src="item.figurita_ofrecida.imagen_url"
                    :alt="item.figurita_ofrecida.nombre_jugador"
                    class="card-img"
                  />
                  <div v-else class="card-img-placeholder"><span>Sin Foto</span></div>
                </div>
                <strong>#{{ item.figurita_ofrecida?.numero }} {{ item.figurita_ofrecida?.nombre_jugador }}</strong>
                <span class="pais">{{ item.figurita_ofrecida?.pais }}</span>
              </div>

              <div class="intercambio-separador">1x1</div>

              <div class="intercambio-slot">
                <span class="slot-titulo">Buscás</span>
                <div class="card-image-container mini-slot-img">
                  <img
                    v-if="item.figurita_buscada?.imagen_url"
                    :src="item.figurita_buscada.imagen_url"
                    :alt="item.figurita_buscada.nombre_jugador"
                    class="card-img"
                  />
                  <div v-else class="card-img-placeholder"><span>Sin Foto</span></div>
                </div>
                <strong>#{{ item.figurita_buscada?.numero }} {{ item.figurita_buscada?.nombre_jugador }}</strong>
                <span class="pais">{{ item.figurita_buscada?.pais }}</span>
              </div>
            </div>

            <div class="card-footer-status">
              <button
                type="button"
                class="btn btn-danger btn-full"
                :disabled="procesandoId === item.id"
                @click="confirmarCancelar(item.id)"
              >
                {{ procesandoId === item.id ? 'Cancelando...' : 'Cancelar Pedido' }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>