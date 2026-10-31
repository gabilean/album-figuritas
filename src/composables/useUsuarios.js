import { ref, reactive, watch } from 'vue'
import { usuariosService } from '@/services/usuariosService'

export function useUsuarios() {
  const usuarios = ref([])
  const loading = ref(false)
  const error = ref(null)

  const filtros = reactive({
    busqueda: '',
    rol: ''
  })

  let timerDebounce = null

  // Función auxiliar limpia para manejo de estado, try/catch y banderas
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

  async function cargarUsuarios() {
    return ejecutarAccion(async () => {
      usuarios.value = await usuariosService.listar(filtros)
    }, 'Error al cargar usuarios')
  }

  // Búsqueda dinámica reactiva (live search) con debounce de 300ms
  watch(
    () => [filtros.busqueda, filtros.rol],
    () => {
      clearTimeout(timerDebounce)
      timerDebounce = setTimeout(() => {
        cargarUsuarios()
      }, 300)
    }
  )

  async function crearUsuario(datos) {
    return ejecutarAccion(async () => {
      await usuariosService.crear(datos)
      await cargarUsuarios()
    }, 'Error al crear usuario')
  }

  async function actualizarUsuario(id, datos) {
    return ejecutarAccion(async () => {
      await usuariosService.actualizar(id, datos)
      await cargarUsuarios()
    }, 'Error al actualizar usuario')
  }

  async function eliminarUsuario(id) {
    return ejecutarAccion(async () => {
      await usuariosService.eliminar(id)
      await cargarUsuarios()
    }, 'Error al eliminar usuario')
  }

  return {
    usuarios,
    loading,
    error,
    filtros,
    cargarUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
  }
}