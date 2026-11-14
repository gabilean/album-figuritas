import api from './api'

export const crafteoService = {
  /**
   * Obtiene el saldo actual de puntos_crafteo del usuario desde profiles.
   */
  async obtenerPuntos(userId) {
    const { data } = await api.get('/profiles', {
      params: {
        select: 'puntos_crafteo',
        id: `eq.${userId}`
      }
    })
    return data?.[0]?.puntos_crafteo ?? 0
  },

  /**
   * Recicla un listado de repetidas [{ figurita_id, cantidad }] y devuelve el nuevo saldo.
   */
  async reciclar(items) {
    const { data } = await api.post('/rpc/reciclar_repetidas', {
      p_items: items
    })
    return data
  },

  /**
   * Canjea puntos por un 'sobre' (60 pts) o una 'figurita' puntual (100/250 pts).
   */
  async canjear(tipo, figuritaId = null) {
    const { data } = await api.post('/rpc/canjear_crafteo', {
      p_tipo: tipo,
      p_figurita_id: figuritaId
    })
    return data
  }
}