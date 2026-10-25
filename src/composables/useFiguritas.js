import { ref, reactive } from 'vue'
import { figuritasService } from '@/services/figuritasService'

export function useFiguritas() {
  const figuritas = ref([])
  const loading = ref(false)
  const error = ref(null)

  const filtros = reactive({
    busqueda: '',
    pais: ''
  })

  async function ejecutarAccion(tarea) {
    loading.value = true
    error.value = null
    let exito = false

    try {
      await tarea()
      exito = true
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error en la operación'
    } finally {
      loading.value = false
    }

    return exito
  }

  async function cargarFiguritas() {
    return ejecutarAccion(async () => {
      figuritas.value = await figuritasService.listar(filtros)
    })
  }

  async function crearFigurita(datos) {
    return ejecutarAccion(async () => {
      await figuritasService.crear(datos)
      figuritas.value = await figuritasService.listar(filtros)
    })
  }

  async function actualizarFigurita(id, datos) {
    return ejecutarAccion(async () => {
      await figuritasService.actualizar(id, datos)
      figuritas.value = await figuritasService.listar(filtros)
    })
  }

  async function eliminarFigurita(id) {
    return ejecutarAccion(async () => {
      await figuritasService.eliminar(id)
      figuritas.value = await figuritasService.listar(filtros)
    })
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