import { ref, reactive, watch } from 'vue'
import { figuritasService } from '@/services/figuritasService'

export function useFiguritas() {
  const figuritas = ref([])
  const loading = ref(false)
  const error = ref(null)

  const filtros = reactive({
    busqueda: '',
    pais: ''
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

  async function cargarFiguritas() {
    return ejecutarAccion(async () => {
      figuritas.value = await figuritasService.listar(filtros)
    }, 'Error al cargar figuritas')
  }

  // Live search con debounce reutilizando cargarFiguritas
  watch(
    () => [filtros.busqueda, filtros.pais],
    () => {
      clearTimeout(timerDebounce)
      timerDebounce = setTimeout(() => {
        cargarFiguritas()
      }, 300)
    }
  )

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