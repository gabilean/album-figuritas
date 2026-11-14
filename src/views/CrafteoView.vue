<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useAlbumStore } from '@/stores/albumStore'

const { perfil } = useAuth()
const albumStore = useAlbumStore()

const pestanaActiva = ref('reciclar')
const busquedaRepetida = ref('')
const busquedaFaltante = ref('')
const seleccionReciclaje = ref({}) // { [figuritaId]: cantidadSeleccionada }
const cartasSobreCanjeado = ref([])

const mensajeExito = ref(null)
const mensajeError = ref(null)

onMounted(async () => {
  if (perfil.value?.id && albumStore.catalogo.length === 0) {
    await albumStore.cargarDatosAlbum(perfil.value.id)
  }
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

// Listado de repetidas disponibles para reciclar (cantidad - 1)
const repetidasDisponibles = computed(() => {
  const texto = busquedaRepetida.value.trim().toLowerCase()
  return albumStore.catalogo
    .map(fig => {
      const total = cantidadEnMiColeccion(fig.id)
      const disponibles = Math.max(0, total - 1)
      return {
        ...fig,
        total,
        disponibles,
        valorUnitario: fig.es_especial ? 40 : 10
      }
    })
    .filter(fig => fig.disponibles > 0)
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

// Listado de faltantes disponibles para fabricar (cantidad === 0)
const faltantesDisponibles = computed(() => {
  const texto = busquedaFaltante.value.trim().toLowerCase()
  return albumStore.catalogo
    .filter(fig => cantidadEnMiColeccion(fig.id) === 0)
    .map(fig => ({
      ...fig,
      costoFabricacion: fig.es_especial ? 250 : 100
    }))
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

function obtenerSeleccionada(figId) {
  return seleccionReciclaje.value[String(figId)] || 0
}

function ajustarCantidadReciclaje(fig, delta) {
  const key = String(fig.id)
  const actual = obtenerSeleccionada(key)
  const nueva = Math.min(fig.disponibles, Math.max(0, actual + delta))
  if (nueva === 0) {
    const copia = { ...seleccionReciclaje.value }
    delete copia[key]
    seleccionReciclaje.value = copia
  } else {
    seleccionReciclaje.value = {
      ...seleccionReciclaje.value,
      [key]: nueva
    }
  }
}

function seleccionarTodasLasRepetidas() {
  const nuevaSeleccion = {}
  repetidasDisponibles.value.forEach(fig => {
    nuevaSeleccion[String(fig.id)] = fig.disponibles
  })
  seleccionReciclaje.value = nuevaSeleccion
}

function limpiarSeleccionReciclaje() {
  seleccionReciclaje.value = {}
}

const resumenReciclaje = computed(() => {
  let totalUnidades = 0
  let totalPuntos = 0
  const items = []

  Object.entries(seleccionReciclaje.value).forEach(([figId, cant]) => {
    if (cant > 0) {
      const fig = albumStore.catalogo.find(c => String(c.id) === figId)
      if (fig) {
        const valor = fig.es_especial ? 40 : 10
        totalUnidades += cant
        totalPuntos += cant * valor
        items.push({ figurita_id: fig.id, cantidad: cant })
      }
    }
  })

  return { totalUnidades, totalPuntos, items }
})

async function ejecutarReciclaje() {
  if (!perfil.value?.id || resumenReciclaje.value.items.length === 0) return
  mensajeError.value = null
  mensajeExito.value = null

  const { totalUnidades, totalPuntos, items } = resumenReciclaje.value

  try {
    await albumStore.reciclarFiguritas(perfil.value.id, items)
    seleccionReciclaje.value = {}
    mensajeExito.value = `Reciclaste ${totalUnidades} figurita(s) repetida(s) y obtuviste +${totalPuntos} puntos de crafteo.`
  } catch (err) {
    mensajeError.value = err.response?.data?.message || err.message || 'No se pudieron reciclar las figuritas.'
  }
}

async function ejecutarCanjeSobre() {
  if (!perfil.value?.id || albumStore.puntosCrafteo < 60) return
  mensajeError.value = null
  mensajeExito.value = null
  cartasSobreCanjeado.value = []

  try {
    const obtenidas = await albumStore.canjearSobreCrafteo(perfil.value.id)
    cartasSobreCanjeado.value = obtenidas
    mensajeExito.value = 'Canjeaste 60 puntos por un Sobre Extra con 5 figuritas.'
  } catch (err) {
    mensajeError.value = err.response?.data?.message || err.message || 'Error al canjear el sobre extra.'
  }
}

async function ejecutarFabricacion(fig) {
  if (!perfil.value?.id || albumStore.puntosCrafteo < fig.costoFabricacion) return
  mensajeError.value = null
  mensajeExito.value = null

  try {
    await albumStore.fabricarFiguritaPuntual(perfil.value.id, fig.id)
    let texto = `Fabricaste a #${fig.numero} ${fig.nombre_jugador} (${fig.pais}) por ${fig.costoFabricacion} puntos.`
    if (albumStore.intercambiosCanceladosAuto?.length) {
      texto += ` Se canceló automáticamente tu pedido de intercambio pendiente por esta figurita.`
    }
    mensajeExito.value = texto
  } catch (err) {
    mensajeError.value = err.response?.data?.message || err.message || 'No se pudo fabricar la figurita.'
  }
}
</script>

<template>
  <div class="user-layout">
    <div class="header-banner">
      <div>
        <h1>Mesa de Crafteo</h1>
        <span class="user-greeting">Reciclá tus repetidas por puntos y canjealos por sobres o figuritas faltantes</span>
      </div>
      <div class="crafteo-saldo-badge">
        <span>Saldo disponible:</span>
        <strong>{{ albumStore.puntosCrafteo }} pts</strong>
      </div>
    </div>

    <main class="main-content-inner">
      <!-- Mensajes de feedback -->
      <div v-if="mensajeExito" class="banner-sobre-exito">
        <div class="banner-contenido">
          <p>{{ mensajeExito }}</p>
          <ul v-if="cartasSobreCanjeado.length">
            <li v-for="(fig, idx) in cartasSobreCanjeado" :key="`${fig.id}-${idx}`">
              #{{ fig.numero }} <strong>{{ fig.nombre_jugador }}</strong> ({{ fig.pais }})
            </li>
          </ul>
          <p v-if="albumStore.intercambiosCanceladosAuto?.length" class="aviso-cancelacion-sobre">
            Se canceló el pedido automáticamente porque la obtuviste en este sobre:
            <strong>{{ albumStore.intercambiosCanceladosAuto.join(', ') }}</strong>.
          </p>
          <button type="button" class="btn btn-secondary" @click="mensajeExito = null; cartasSobreCanjeado = []">
            Cerrar
          </button>
        </div>
      </div>

      <div v-if="mensajeError" class="alert-error-box">
        <p>{{ mensajeError }}</p>
        <button type="button" class="btn btn-secondary" @click="mensajeError = null">
          Cerrar
        </button>
      </div>

      <!-- Pestañas del Módulo -->
      <div class="intercambios-tabs">
        <button
          type="button"
          class="btn"
          :class="pestanaActiva === 'reciclar' ? 'btn-primary' : 'btn-secondary'"
          @click="pestanaActiva = 'reciclar'"
        >
          1. Reciclar Repetidas (+10 / +40 pts)
        </button>
        <button
          type="button"
          class="btn"
          :class="pestanaActiva === 'canjear' ? 'btn-primary' : 'btn-secondary'"
          @click="pestanaActiva = 'canjear'"
        >
          2. Canjear Puntos (Sobres y Cartas)
        </button>
      </div>

      <!-- =================================================================== -->
      <!-- PESTAÑA 1: RECICLAR REPETIDAS                                       -->
      <!-- =================================================================== -->
      <section v-if="pestanaActiva === 'reciclar'">
        <div class="intercambio-resumen-bar">
          <div class="resumen-paso">
            <span class="slot-titulo">Resumen de Reciclaje</span>
            <p>
              Seleccionadas: <strong>{{ resumenReciclaje.totalUnidades }} figurita(s)</strong>
            </p>
            <span class="posicion">Común = 10 pts | Especial = 40 pts</span>
          </div>

          <div class="resumen-paso">
            <span class="slot-titulo">Puntos a Obtener</span>
            <p class="crafteo-puntos-preview">+{{ resumenReciclaje.totalPuntos }} pts</p>
            <span class="posicion">Saldo resultante: {{ albumStore.puntosCrafteo + resumenReciclaje.totalPuntos }} pts</span>
          </div>

          <div class="resumen-acciones">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="resumenReciclaje.totalUnidades === 0 || albumStore.procesandoCrafteo"
              @click="ejecutarReciclaje"
            >
              {{ albumStore.procesandoCrafteo ? 'Reciclando...' : 'Confirmar Reciclaje' }}
            </button>
            <button
              v-if="repetidasDisponibles.length > 0"
              type="button"
              class="btn btn-secondary"
              @click="resumenReciclaje.totalUnidades > 0 ? limpiarSeleccionReciclaje() : seleccionarTodasLasRepetidas()"
            >
              {{ resumenReciclaje.totalUnidades > 0 ? 'Limpiar selección' : 'Seleccionar todas' }}
            </button>
          </div>
        </div>

        <div class="search-section">
          <input
            v-model="busquedaRepetida"
            type="text"
            class="form-control search-input"
            placeholder="Filtrar tus repetidas por jugador, número o país..."
          />
        </div>

        <div v-if="repetidasDisponibles.length === 0" class="empty-message">
          No tenés figuritas repetidas disponibles para reciclar (siempre se conserva 1 unidad pegada en tu álbum).
        </div>

        <div v-else class="grid-figuritas">
          <article
            v-for="fig in repetidasDisponibles"
            :key="fig.id"
            class="card-figurita"
            :class="{ 'carta-seleccionada': obtenerSeleccionada(fig.id) > 0 }"
          >
            <div class="card-header">
              <span class="numero">#{{ fig.numero }}</span>
              <span class="status-badge badge-stock-intercambio">
                +{{ fig.valorUnitario }} pts c/u
              </span>
            </div>

            <div class="card-image-container">
              <img v-if="fig.imagen_url" :src="fig.imagen_url" :alt="fig.nombre_jugador" class="card-img" />
              <div v-else class="card-img-placeholder"><span>Sin Foto</span></div>
            </div>

            <div class="card-body">
              <h3>{{ fig.nombre_jugador }}</h3>
              <p class="pais">{{ fig.pais }}</p>
              <span class="posicion">
                {{ fig.es_especial ? 'Especial' : 'Común' }} | Repetidas libres: {{ fig.disponibles }}
              </span>
            </div>

            <div class="crafteo-contador">
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="obtenerSeleccionada(fig.id) === 0"
                @click="ajustarCantidadReciclaje(fig, -1)"
              >
                -
              </button>
              <span class="crafteo-cantidad-num">
                {{ obtenerSeleccionada(fig.id) }} / {{ fig.disponibles }}
              </span>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="obtenerSeleccionada(fig.id) >= fig.disponibles"
                @click="ajustarCantidadReciclaje(fig, 1)"
              >
                +
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- =================================================================== -->
      <!-- PESTAÑA 2: CANJEAR PUNTOS (SOBRE EXTRA Y FABRICACIÓN PUNTUAL)       -->
      <!-- =================================================================== -->
      <section v-if="pestanaActiva === 'canjear'">
        <!-- Tarjeta Destacada: Sobre Extra -->
        <div class="card-dashboard-main crafteo-sobre-card">
          <div class="crafteo-sobre-info">
            <h2>Sobre Extra de Crafteo (5 Figuritas Aleatorias)</h2>
            <p class="posicion">
              Canjeá tus puntos por un sobre inmediato de 5 figuritas sin esperar el temporizador diario.
            </p>
          </div>
          <div class="crafteo-sobre-accion">
            <span class="crafteo-costo-tag">Costo: 60 pts</span>
            <button
              type="button"
              class="btn btn-primary btn-lg"
              :disabled="albumStore.puntosCrafteo < 60 || albumStore.procesandoCrafteo"
              @click="ejecutarCanjeSobre"
            >
              {{ albumStore.procesandoCrafteo ? 'Abriendo...' : 'Canjear Sobre (60 pts)' }}
            </button>
          </div>
        </div>

        <!-- Fabricación Individual de Faltantes -->
        <div class="search-section">
          <div>
            <h2>Fabricar Figurita Faltante a Elección</h2>
            <span class="posicion">Común: 100 pts | Especial: 250 pts</span>
          </div>
          <input
            v-model="busquedaFaltante"
            type="text"
            class="form-control search-input"
            placeholder="Buscar figurita faltante..."
          />
        </div>

        <div v-if="faltantesDisponibles.length === 0" class="empty-message">
          No tenés figuritas faltantes con ese criterio (o ya completaste el álbum).
        </div>

        <div v-else class="grid-figuritas">
          <article
            v-for="fig in faltantesDisponibles"
            :key="fig.id"
            class="card-figurita"
          >
            <div class="card-header">
              <span class="numero">#{{ fig.numero }}</span>
              <span class="status-badge badge-stock-intercambio">
                {{ fig.costoFabricacion }} pts
              </span>
            </div>

            <div class="card-image-container">
              <img v-if="fig.imagen_url" :src="fig.imagen_url" :alt="fig.nombre_jugador" class="card-img" />
              <div v-else class="card-img-placeholder"><span>Sin Foto</span></div>
            </div>

            <div class="card-body">
              <h3>{{ fig.nombre_jugador }}</h3>
              <p class="pais">{{ fig.pais }}</p>
              <span class="posicion">{{ fig.es_especial ? 'Figurita Especial' : 'Figurita Común' }}</span>
            </div>

            <div class="card-footer-status">
              <button
                type="button"
                class="btn btn-primary btn-full"
                :disabled="albumStore.puntosCrafteo < fig.costoFabricacion || albumStore.procesandoCrafteo"
                @click="ejecutarFabricacion(fig)"
              >
                {{ albumStore.puntosCrafteo >= fig.costoFabricacion ? `Fabricar (${fig.costoFabricacion} pts)` : `Faltan ${fig.costoFabricacion - albumStore.puntosCrafteo} pts` }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>