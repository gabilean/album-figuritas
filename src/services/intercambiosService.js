import api from './api'

const ENDPOINT = '/intercambios'
const RPC_EJECUTAR = '/rpc/ejecutar_intercambio'

export const intercambiosService = {
  async listarPendientes() {
    const { data } = await api.get(ENDPOINT, {
      params: {
        select: 'id, creador_id, creador_nombre, figurita_buscada_id, figurita_ofrecida_id, estado, creado_en',
        estado: 'eq.pendiente',
        order: 'creado_en.desc'
      }
    })
    return data
  },

  async crear(creadorId, creadorNombre, figuritaBuscadaId, figuritaOfrecidaId) {
    const { data } = await api.post(
      ENDPOINT,
      {
        creador_id: creadorId,
        creador_nombre: creadorNombre,
        figurita_buscada_id: figuritaBuscadaId,
        figurita_ofrecida_id: figuritaOfrecidaId
      },
      {
        headers: { Prefer: 'return=representation' }
      }
    )
    return data[0]
  },

  async cancelar(intercambioId) {
    const { data } = await api.patch(
      ENDPOINT,
      {
        estado: 'cancelado',
        actualizado_en: new Date().toISOString()
      },
      {
        params: { id: `eq.${intercambioId}` },
        headers: { Prefer: 'return=representation' }
      }
    )
    return data[0]
  },

  async aceptar(intercambioId) {
    const { data } = await api.post(RPC_EJECUTAR, {
      p_intercambio_id: intercambioId
    })
    return data
  }
}