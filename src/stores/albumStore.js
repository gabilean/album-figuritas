import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { albumService } from '@/services/albumService'
import { figuritasService } from '@/services/figuritasService'
import { intercambiosService } from '@/services/intercambiosService'
import { crafteoService } from '@/services/crafteoService'

// Ejemplos: 24 (para 24 horas real), 1 (1 hora), 0.0833 (5 minutos), 0.0166 (1 minuto)
const TIEMPO_COOLDOWN_HORAS = 0.0833 

export const useAlbumStore = defineStore('album', () => {
  // Estado Centralizado en RAM
  const catalogo = ref([])
  const miColeccion = ref([])
  const sobreMensaje = ref(null)
  const resumenSobreActual = ref({})
  const loading = ref(false)
  const error = ref(null)

  // Estado del Módulo de Intercambios
  const intercambios = ref([])
  const cargandoIntercambios = ref(false)
  const intercambiosCanceladosAuto = ref([])
  const puntosCrafteo = ref(0)
  const procesandoCrafteo = ref(false)

  // Estado del Timer
  const ultimoReclamoTime = ref(0)
  const tiempoRestanteSegundos = ref(0)
  let timerInterval = null

  const filtros = ref({
    busqueda: '',
    ordenarPor: 'numero'
  })

  // --- GETTERS / COMPUTADAS DEL TIMER ---
  const duracionCooldownMs = computed(() => TIEMPO_COOLDOWN_HORAS * 60 * 60 * 1000)

  const cooldownActivo = computed(() => tiempoRestanteSegundos.value > 0)

  const cooldownFormateado = computed(() => {
    const totalSecs = tiempoRestanteSegundos.value
    if (totalSecs <= 0) return ''

    const horas = Math.floor(totalSecs / 3600)
    const minutos = Math.floor((totalSecs % 3600) / 60)
    const segundos = totalSecs % 60

    const mm = String(minutos).padStart(2, '0')
    const ss = String(segundos).padStart(2, '0')

    if (horas > 0) {
      const hh = String(horas).padStart(2, '0')
      return `${hh}:${mm}:${ss}`
    }
    return `${mm}:${ss}`
  })

  function iniciarTimer() {
    clearInterval(timerInterval)

    const calcularRestante = () => {
      if (!ultimoReclamoTime.value) {
        tiempoRestanteSegundos.value = 0
        return
      }

      const ahora = Date.now()
      const transcurrido = ahora - ultimoReclamoTime.value
      const restanteMs = duracionCooldownMs.value - transcurrido

      if (restanteMs <= 0) {
        tiempoRestanteSegundos.value = 0
        clearInterval(timerInterval)
      } else {
        tiempoRestanteSegundos.value = Math.ceil(restanteMs / 1000)
      }
    }

    calcularRestante()
    if (tiempoRestanteSegundos.value > 0) {
      timerInterval = setInterval(calcularRestante, 1000)
    }
  }

  // --- GETTERS / MÉTRICAS DEL DASHBOARD ---
  const totalCatalogo = computed(() => catalogo.value.length)
  const totalObtenidas = computed(() => miColeccion.value.filter(item => item && item.cantidad > 0).length)
  const totalFaltantes = computed(() => Math.max(0, totalCatalogo.value - totalObtenidas.value))
  const totalRepetidas = computed(() => {
    return miColeccion.value.reduce((acc, item) => {
      return acc + (item && item.cantidad > 1 ? item.cantidad - 1 : 0)
    }, 0)
  })
  const porcentajeCompletado = computed(() => {
    if (totalCatalogo.value === 0) return 0
    return Math.round((totalObtenidas.value / totalCatalogo.value) * 100)
  })

  const figuritasProcesadas = computed(() => {
    const mapaCantidades = {}
    miColeccion.value.forEach(item => {
      if (item && item.figurita_id) {
        mapaCantidades[String(item.figurita_id)] = item.cantidad
      }
    })

    let resultado = catalogo.value.map(fig => {
      const figIdStr = String(fig.id)
      const cantidadTotal = mapaCantidades[figIdStr] || 0
      const cantidadGanadaEnSobre = resumenSobreActual.value[figIdStr] || 0
      const esPrimeraVez = cantidadGanadaEnSobre > 0 && cantidadTotal === cantidadGanadaEnSobre

      return {
        ...fig,
        cantidad: cantidadTotal,
        esNueva: esPrimeraVez
      }
    })

    const texto = filtros.value.busqueda.trim().toLowerCase()
    if (texto) {
      resultado = resultado.filter(f =>
        f.nombre_jugador.toLowerCase().includes(texto) ||
        f.numero.toString().includes(texto) ||
        f.pais.toLowerCase().includes(texto) ||
        (f.posicion && f.posicion.toLowerCase().includes(texto))
      )
    }

    resultado.sort((a, b) => {
      const criterio = filtros.value.ordenarPor
      if (criterio === 'numero') return a.numero - b.numero
      const valA = (a[criterio] || '').toString().toLowerCase()
      const valB = (b[criterio] || '').toString().toLowerCase()
      return valA.localeCompare(valB)
    })

    return resultado
  })

  // --- GETTER / INTERCAMBIOS HIDRATADOS CON EL CATÁLOGO ---
  const intercambiosEnriquecidos = computed(() => {
    const mapaCatalogo = {}
    catalogo.value.forEach(fig => {
      if (fig && fig.id) {
        mapaCatalogo[String(fig.id)] = fig
      }
    })

    return intercambios.value.map(item => ({
      ...item,
      figurita_buscada: mapaCatalogo[String(item.figurita_buscada_id)] || null,
      figurita_ofrecida: mapaCatalogo[String(item.figurita_ofrecida_id)] || null
    }))
  })

  // --- ACCIONES DEL ÁLBUM ---
  async function cargarDatosAlbum(userId) {
    if (!userId) return
    loading.value = true
    error.value = null
    try {
      const [listaFiguritas, coleccionUsuario, puntos, ultimoReclamoIso] = await Promise.all([
        figuritasService.listar(),
        albumService.obtenerColeccion(userId),
        crafteoService.obtenerPuntos(userId),
        albumService.obtenerUltimoReclamo(userId)
      ])
      catalogo.value = listaFiguritas
      miColeccion.value = coleccionUsuario
      puntosCrafteo.value = puntos
      ultimoReclamoTime.value = ultimoReclamoIso ? new Date(ultimoReclamoIso).getTime() : 0
      iniciarTimer()
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error al cargar los datos del álbum'
    } finally {
      loading.value = false
    }
}

  async function abrirSobreDiario(userId) {
    if (!userId || cooldownActivo.value) return
  loading.value = true
  error.value = null
  intercambiosCanceladosAuto.value = []

  try {
    // 1. Validar cooldown en PostgreSQL (bloquea incógnito, múltiples pestañas o manipulación local)
    const cooldownSegundos = Math.round(TIEMPO_COOLDOWN_HORAS * 3600)
    const fechaServidorIso = await albumService.validarYRegistrarReclamo(cooldownSegundos)

    ultimoReclamoTime.value = new Date(fechaServidorIso).getTime()
    iniciarTimer()

    // 2. Asegurar catálogo y abrir las 5 figuritas
    if (catalogo.value.length === 0) {
      catalogo.value = await figuritasService.listar()
    }

    const sobresObtenidos = await albumService.abrirSobreAleatorio(userId, catalogo.value)

    const conteoUltimoSobre = {}
    sobresObtenidos.forEach(f => {
      const key = String(f.id)
      conteoUltimoSobre[key] = (conteoUltimoSobre[key] || 0) + 1
    })
    resumenSobreActual.value = conteoUltimoSobre

    miColeccion.value = await albumService.obtenerColeccion(userId)

    if (sobresObtenidos.length > 0) {
      sobreMensaje.value = sobresObtenidos
      const idsObtenidos = new Set(sobresObtenidos.map(f => String(f.id)))
      await verificarYCancelarPedidosObtenidos(userId, idsObtenidos)
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Error al abrir el sobre diario'
    // Si falló por cooldown desincronizado, recargar el timestamp oficial del servidor
    const ultimoReclamoIso = await albumService.obtenerUltimoReclamo(userId)
    ultimoReclamoTime.value = ultimoReclamoIso ? new Date(ultimoReclamoIso).getTime() : 0
    iniciarTimer()
  } finally {
    loading.value = false
  }
  }

  function limpiarFiltros() {
    filtros.value.busqueda = ''
    filtros.value.ordenarPor = 'numero'
  }

  function cerrarBanner() {
    sobreMensaje.value = null
    intercambiosCanceladosAuto.value = []
  }

  // --- ACCIONES DEL TABLÓN DE INTERCAMBIOS (1x1) ---
  async function cargarIntercambios() {
    cargandoIntercambios.value = true
    try {
      const data = await intercambiosService.listarPendientes()
      intercambios.value = data || []
    } catch (err) {
      console.error('Error al cargar intercambios:', err)
      throw err
    } finally {
      cargandoIntercambios.value = false
    }
  }

  async function crearPedidoIntercambio(userId, creadorNombre, figuritaBuscadaId, figuritaOfrecidaId) {
    if (!userId) throw new Error('Debés iniciar sesión para publicar un intercambio.')
    await intercambiosService.crear(
      userId,
      creadorNombre || 'Coleccionista',
      figuritaBuscadaId,
      figuritaOfrecidaId
    )
    await cargarIntercambios()
  }

  async function cancelarIntercambio(intercambioId) {
    await intercambiosService.cancelar(intercambioId)
    await cargarIntercambios()
  }

  async function aceptarIntercambio(intercambioId, userId) {
    await intercambiosService.aceptar(intercambioId)
    if (userId) {
      await cargarDatosAlbum(userId)
    }
    await cargarIntercambios()
  }
  async function verificarYCancelarPedidosObtenidos(userId, idsObtenidosSet) {
  if (intercambios.value.length === 0) {
    await cargarIntercambios()
  }

  const pedidosACancelar = intercambios.value.filter(
    item =>
      item.creador_id === userId &&
      item.estado === 'pendiente' &&
      idsObtenidosSet.has(String(item.figurita_buscada_id))
  )

  if (pedidosACancelar.length > 0) {
    await Promise.all(pedidosACancelar.map(p => intercambiosService.cancelar(p.id)))
    intercambiosCanceladosAuto.value = pedidosACancelar.map(p => {
      const fig = catalogo.value.find(c => String(c.id) === String(p.figurita_buscada_id))
      return fig ? `#${fig.numero} ${fig.nombre_jugador}` : 'figurita obtenida'
    })
    await cargarIntercambios()
  }
}

// --- ACCIONES DEL MÓDULO DE CRAFTEO ---
async function reciclarFiguritas(userId, items) {
  if (!userId || !items.length) return
  procesandoCrafteo.value = true
  try {
    const nuevoSaldo = await crafteoService.reciclar(items)
    puntosCrafteo.value = nuevoSaldo
    miColeccion.value = await albumService.obtenerColeccion(userId)
  } finally {
    procesandoCrafteo.value = false
  }
}

async function canjearSobreCrafteo(userId) {
  if (!userId) return []
  procesandoCrafteo.value = true
  intercambiosCanceladosAuto.value = []
  try {
    if (catalogo.value.length === 0) {
      catalogo.value = await figuritasService.listar()
    }

    // 1. Descontar 60 puntos en Supabase
    const nuevoSaldo = await crafteoService.canjear('sobre', null)
    puntosCrafteo.value = nuevoSaldo

    // 2. Generar las 5 figuritas aleatorias sin tocar el cooldown diario
    const sobresObtenidos = await albumService.abrirSobreAleatorio(userId, catalogo.value)

    const conteoSobre = {}
    sobresObtenidos.forEach(f => {
      const key = String(f.id)
      conteoSobre[key] = (conteoSobre[key] || 0) + 1
    })
    resumenSobreActual.value = conteoSobre
    miColeccion.value = await albumService.obtenerColeccion(userId)

    if (sobresObtenidos.length > 0) {
      sobreMensaje.value = sobresObtenidos
      const idsObtenidos = new Set(sobresObtenidos.map(f => String(f.id)))
      await verificarYCancelarPedidosObtenidos(userId, idsObtenidos)
    }

    return sobresObtenidos
  } finally {
    procesandoCrafteo.value = false
  }
}

async function fabricarFiguritaPuntual(userId, figuritaId) {
  if (!userId || !figuritaId) return
  procesandoCrafteo.value = true
  intercambiosCanceladosAuto.value = []
  try {
    const nuevoSaldo = await crafteoService.canjear('figurita', figuritaId)
    puntosCrafteo.value = nuevoSaldo
    miColeccion.value = await albumService.obtenerColeccion(userId)

    await verificarYCancelarPedidosObtenidos(userId, new Set([String(figuritaId)]))
  } finally {
    procesandoCrafteo.value = false
  }
}

  return {
    catalogo,
    miColeccion,
    sobreMensaje,
    resumenSobreActual,
    loading,
    error,
    filtros,
    cooldownActivo,
    cooldownFormateado,
    totalCatalogo,
    totalObtenidas,
    totalFaltantes,
    totalRepetidas,
    porcentajeCompletado,
    figuritasProcesadas,
    intercambiosEnriquecidos,
    intercambiosCanceladosAuto,
    cargarDatosAlbum,
    abrirSobreDiario,
    limpiarFiltros,
    cerrarBanner,
    intercambios,
    cargandoIntercambios,
    cargarIntercambios,
    crearPedidoIntercambio,
    cancelarIntercambio,
    aceptarIntercambio,
    puntosCrafteo,
    procesandoCrafteo,
    reciclarFiguritas,
    canjearSobreCrafteo,
    fabricarFiguritaPuntual
  }
})