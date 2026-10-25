import api from './api'

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
    const { data } = await api.post(ENDPOINT, datos, {
      headers: { Prefer: 'return=representation' }
    })
    return data[0]
  },

  async actualizar(id, datos) {
    const { data } = await api.patch(ENDPOINT, datos, {
      params: { id: `eq.${id}` },
      headers: { Prefer: 'return=representation' }
    })
    return data[0]
  },

  async eliminar(id) {
    const { data } = await api.delete(ENDPOINT, {
      params: { id: `eq.${id}` },
      headers: { Prefer: 'return=representation' }
    })
    return data
  }
}