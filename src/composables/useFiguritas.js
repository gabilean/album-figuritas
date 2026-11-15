import { ref, reactive, computed } from 'vue'
import { figuritasService } from '@/services/figuritasService'

export function useFiguritas() {
  const todasLasFiguritas = ref([])
  const loading = ref(false)
  const error = ref(null)

  const filtros = reactive({
    busqueda: '',
    pais: ''
  })

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

  async function cargarFiguritas() {
    return ejecutarAccion(async () => {
      // Traemos el catálogo completo una sola vez y filtramos reactivamente en memoria
      todasLasFiguritas.value = await figuritasService.listar({})
    }, 'Error al cargar figuritas')
  }

  const figuritas = computed(() => {
    const termino = (filtros.busqueda || '').trim().toLowerCase()

    return todasLasFiguritas.value.filter((fig) => {
      if (filtros.pais && fig.pais !== filtros.pais) {
        return false
      }

      if (!termino) return true

      const coincideNombre = fig.nombre_jugador?.toLowerCase().includes(termino)
      const coincidePais = fig.pais?.toLowerCase().includes(termino)
      const coincidePosicion = fig.posicion?.toLowerCase().includes(termino)
      const coincideNumero = String(fig.numero) === termino || `#${fig.numero}` === termino

      return coincideNombre || coincidePais || coincidePosicion || coincideNumero
    })
  })

  async function crearFigurita(datos) {
    return ejecutarAccion(async () => {
      await figuritasService.crear(datos)
      await cargarFiguritas()
    }, 'Error al crear figurita')
  }

  async function actualizarFigurita(id, datos) {
    return ejecutarAccion(async () => {
      await figuritasService.actualizar(id, datos)
      await cargarFiguritas()
    }, 'Error al actualizar figurita')
  }

  async function eliminarFigurita(id) {
    return ejecutarAccion(async () => {
      await figuritasService.eliminar(id)
      await cargarFiguritas()
    }, 'Error al eliminar figurita')
  }

  return {
    figuritas,
    loading,
    error,
    filtros,
    cargarFiguritas,
    crearFigurita,
    actualizarFigurita,
    eliminarFigurita
  }
}