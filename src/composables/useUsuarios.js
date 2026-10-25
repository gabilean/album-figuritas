import { ref, reactive } from 'vue'
import { usuariosService } from '@/services/usuariosService'

export function useUsuarios() {
  const usuarios = ref([])
  const loading = ref(false)
  const error = ref(null)

  const filtros = reactive({
    busqueda: '',
    rol: ''
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

  async function cargarUsuarios() {
    return ejecutarAccion(async () => {
      usuarios.value = await usuariosService.listar(filtros)
    })
  }

  async function crearUsuario(datos) {
    return ejecutarAccion(async () => {
      await usuariosService.crear(datos)
      usuarios.value = await usuariosService.listar(filtros)
    })
  }

  async function actualizarUsuario(id, datos) {
    return ejecutarAccion(async () => {
      await usuariosService.actualizar(id, datos)
      usuarios.value = await usuariosService.listar(filtros)
    })
  }

  async function eliminarUsuario(id) {
    return ejecutarAccion(async () => {
      await usuariosService.eliminar(id)
      usuarios.value = await usuariosService.listar(filtros)
    })
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