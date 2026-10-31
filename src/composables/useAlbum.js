import { ref, reactive, watch, computed } from 'vue'
import { albumService } from '@/services/albumService'
import { figuritasService } from '@/services/figuritasService'

export function useAlbum() {
  const catalogo = ref([])
  const miColeccion = ref([])
  const loading = ref(false)
  const error = ref(null)

  const filtros = reactive({
    busqueda: '',
    ordenarPor: 'numero'
  })

  let timerDebounce = null

  async function ejecutarAccion(tarea, mensajeErrorDefault = 'Error en la operación') {
    loading.value = true
    error.value = null
    let exito = false

    try {
      await tarea()
      exito = true
    } catch (err) {
      error.value = err.response?.data?.message || err.message || mensajeErrorDefault
    } finally {
      loading.value = false
    }

    return exito
  }

  async function cargarDatosAlbum(userId) {
    return ejecutarAccion(async () => {
      const [listaFiguritas, coleccionUsuario] = await Promise.all([
        figuritasService.listar(),
        albumService.obtenerColeccion(userId)
      ])
      catalogo.value = listaFiguritas
      miColeccion.value = coleccionUsuario
    }, 'Error al cargar los datos del álbum')
  }

  async function abrirSobreDiario(userId) {
    let sobresRegalados = []
    
    const ok = await ejecutarAccion(async () => {
      if (catalogo.value.length === 0) {
        catalogo.value = await figuritasService.listar()
      }
      
      // 1. Abrir sobre e impactar en Supabase
      sobresRegalados = await albumService.abrirSobreAleatorio(userId, catalogo.value)
      
      // 2. Refrescar colección
      const nuevaColeccion = await albumService.obtenerColeccion(userId)
      miColeccion.value = nuevaColeccion
    }, 'Error al abrir el sobre diario')

    // 3. Notificación con el alert
    if (ok && sobresRegalados.length > 0) {
      const nombres = sobresRegalados.map(f => `#${f.numero} ${f.nombre_jugador}`).join('\n• ')
      alert(`🎉 ¡Abriste un sobre con 5 figuritas!\n\nTe tocaron:\n• ${nombres}`)
    }
  }

  watch(
    () => [filtros.busqueda, filtros.ordenarPor],
    () => {
      clearTimeout(timerDebounce)
      timerDebounce = setTimeout(() => {}, 300)
    }
  )

  function obtenerCantidad(figuritaId) {
    const item = miColeccion.value.find(i => i.figurita_id === figuritaId)
    return item ? item.cantidad : 0
  }

  // Mapa reactivo de figuritas procesadas CON su cantidad inyectada
  const figuritasProcesadas = computed(() => {
    // Mapa auxiliar para búsqueda rápida O(1)
    const mapaCantidades = {}
    miColeccion.value.forEach(item => {
      mapaCantidades[item.figurita_id] = item.cantidad
    })

    // Clonamos y enriquecemos cada figurita con su propiedad 'cantidad'
    let resultado = catalogo.value.map(fig => ({
      ...fig,
      cantidad: mapaCantidades[fig.id] || 0
    }))

    const texto = filtros.busqueda.trim().toLowerCase()
    if (texto) {
      resultado = resultado.filter(f =>
        f.nombre_jugador.toLowerCase().includes(texto) ||
        f.numero.toString().includes(texto) ||
        f.pais.toLowerCase().includes(texto) ||
        (f.posicion && f.posicion.toLowerCase().includes(texto))
      )
    }

    resultado.sort((a, b) => {
      const criterio = filtros.ordenarPor
      if (criterio === 'numero') {
        return a.numero - b.numero
      }
      const valA = (a[criterio] || '').toString().toLowerCase()
      const valB = (b[criterio] || '').toString().toLowerCase()
      return valA.localeCompare(valB)
    })

    return resultado
  })

  return {
    catalogo,
    miColeccion,
    loading,
    error,
    filtros,
    figuritasProcesadas,
    cargarDatosAlbum,
    obtenerCantidad,
    abrirSobreDiario
  }
}