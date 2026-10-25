import api from './api'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export const authService = {
  // Registro público
  async registrar(email, password, nombreUsuario) {
    const { data } = await api.post(`${SUPABASE_URL}/auth/v1/signup`, {
      email,
      password,
      data: {
        nombre_usuario: nombreUsuario
      }
    })
    return data
  },

  // Inicio de sesión
  async login(email, password) {
    const { data } = await api.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      email,
      password
    })
    return data
  },

  // Cierre de sesión
  async logout(accessToken) {
    if (!accessToken) return
    await api.post(`${SUPABASE_URL}/auth/v1/logout`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
  },

  // Consulta de perfil
  async obtenerPerfil(userId) {
    const { data } = await api.get('/profiles', {
      params: {
        id: `eq.${userId}`,
        select: '*'
      }
    })
    return data[0] || null
  }
}