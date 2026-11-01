import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { albumService } from '@/services/albumService'
import { figuritasService } from '@/services/figuritasService'

// ⚙️ CONFIGURACIÓN FÁCIL DEL TIMER (Cambiá este valor según tus necesidades)
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

  // Estado del Timer
  const ultimoReclamoTime = ref(Number(localStorage.getItem('ultimo_reclamo_sobre')) || 0)
  const tiempoRestanteSegundos = ref(0)
  let timerInterval = null

  const filtros = ref({
    busqueda: '',
    ordenarPor: 'numero'
  })

  // --- GETTERS / COMPUTADAS DEL TIMER ---
  const duracionCooldownMs = computed(() => TIEMPO_COOLDOWN_HORAS * 60 * 60 * 1000)

  // Determina si el botón debe estar deshabilitado por el timer
  const cooldownActivo = computed(() => tiempoRestanteSegundos.value > 0)

  // Formatea los segundos a hh:mm:ss o mm:ss de forma amigable
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

  // Iniciar la cuenta regresiva por segundo
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

  // --- ACCIONES ---
  async function cargarDatosAlbum(userId) {
    if (!userId) return
    loading.value = true
    error.value = null
    try {
      const [listaFiguritas, coleccionUsuario] = await Promise.all([
        figuritasService.listar(),
        albumService.obtenerColeccion(userId)
      ])
      catalogo.value = listaFiguritas
      miColeccion.value = coleccionUsuario
      iniciarTimer() // Inicializar timer al cargar
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
    try {
      if (catalogo.value.length === 0) {
        catalogo.value = await figuritasService.listar()
      }

      // 1. Reclamar el sobre aleatorio
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
      }

      // 2. Guardar timestamp actual y reiniciar cooldown
      const ahora = Date.now()
      ultimoReclamoTime.value = ahora
      localStorage.setItem('ultimo_reclamo_sobre', ahora.toString())
      iniciarTimer()

    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error al abrir el sobre diario'
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
    cargarDatosAlbum,
    abrirSobreDiario,
    limpiarFiltros,
    cerrarBanner
  }
})