import api from './api'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ENDPOINT = '/profiles'

export const usuariosService = {
  async listar(filtros = {}) {
    const params = {
      select: '*',
      order: 'nombre_usuario.asc'
    }

    if (filtros.rol) {
      params.rol = `eq.${filtros.rol}`
    }

    const texto = filtros.busqueda?.trim().replace(/[*%]/g, '')
    if (texto) {
      params.nombre_usuario = `ilike.*${texto}*`
    }

    const { data } = await api.get(ENDPOINT, { params })
    return data
  },

  async crear(datos) {
    const { data } = await api.post(`${SUPABASE_URL}/auth/v1/signup`, {
      email: datos.email,
      password: datos.password || '123456',
      data: {
        nombre_usuario: datos.nombre_usuario
      }
    })

    if (datos.rol && datos.rol !== 'user' && data.user?.id) {
      await this.actualizar(data.user.id, { rol: datos.rol })
    }

    return data
  },

  async actualizar(id, datos) {
    const { data } = await api.patch(ENDPOINT, datos, {
      params: { id: `eq.${id}` },
      headers: { Prefer: 'return=representation' }
    })
    return data[0]
  },

  // Invocación a la función de servidor RPC para borrado completo
  async eliminar(id) {
    const { data } = await api.post('/rpc/eliminar_usuario_completo', {
      usuario_id: id
    })
    return data
  }
}