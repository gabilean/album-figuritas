import { ref, computed } from 'vue'
import { authService } from '@/services/authService'

const STORAGE_KEY = 'album_session'

function cargarSesionInicial() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    return guardado ? JSON.parse(guardado) : null
  } catch {
    return null
  }
}

const sesionState = ref(cargarSesionInicial())
const perfilState = ref(null)
const inicializado = ref(false)

export function useAuth() {
  const loading = ref(false)
  const error = ref(null)

  const usuario = computed(() => sesionState.value?.user || null)
  const perfil = computed(() => perfilState.value)
  const estaAutenticado = computed(() => !!sesionState.value?.access_token)
  const esAdmin = computed(() => perfilState.value?.rol === 'admin')

  function guardarSesion(data) {
    sesionState.value = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function limpiarSesion() {
    sesionState.value = null
    perfilState.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  async function inicializarSesion() {
    if (inicializado.value) return
    if (sesionState.value?.user?.id) {
      try {
        const perfilData = await authService.obtenerPerfil(sesionState.value.user.id)
        perfilState.value = perfilData
      } catch (err) {
        limpiarSesion()
      }
    }
    inicializado.value = true
  }

  async function login(email, password) {
    loading.value = true
    error.value = null
    let exito = false

    try {
      const data = await authService.login(email, password)
      guardarSesion(data)
      if (data.user?.id) {
        perfilState.value = await authService.obtenerPerfil(data.user.id)
      }
      exito = true
    } catch (err) {
      error.value = err.response?.data?.error_description || 'Credenciales inválidas'
    } finally {
      loading.value = false
    }

    return exito
  }

  async function registrar(email, password, nombreUsuario) {
    loading.value = true
    error.value = null
    let exito = false

    try {
      const data = await authService.registrar(email, password, nombreUsuario)
      if (data.access_token) {
        guardarSesion(data)
        perfilState.value = await authService.obtenerPerfil(data.user.id)
      }
      exito = true
    } catch (err) {
      error.value = err.response?.data?.msg || err.response?.data?.message || 'Error al registrar usuario'
    } finally {
      loading.value = false
    }

    return exito
  }

  async function logout() {
    try {
      if (sesionState.value?.access_token) {
        await authService.logout(sesionState.value.access_token)
      }
    } finally {
      limpiarSesion()
    }
  }

  return {
    usuario,
    perfil,
    estaAutenticado,
    esAdmin,
    inicializado,
    loading,
    error,
    login,
    registrar,
    logout,
    inicializarSesion
  }
}