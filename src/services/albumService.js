import api from './api'

const ENDPOINT = '/usuario_figuritas'

export const albumService = {
  async obtenerColeccion(userId) {
    const { data } = await api.get(ENDPOINT, {
      params: {
        select: '*, figuritas(*)',
        user_id: `eq.${userId}`
      }
    })
    return data
  },

  async guardarFigurita(userId, figuritaId, cantidad) {
    const { data } = await api.post(
      ENDPOINT,
      {
        user_id: userId,
        figurita_id: figuritaId,
        cantidad: cantidad
      },
      {
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' }
      }
    )
    return data[0]
  },

  async eliminarFigurita(userId, figuritaId) {
    const { data } = await api.delete(ENDPOINT, {
      params: {
        user_id: `eq.${userId}`,
        figurita_id: `eq.${figuritaId}`
      },
      headers: { Prefer: 'return=representation' }
    })
    return data
  },

  /**
   * Abre un sobre aleatorio resolviendo de manera atómica las figuritas repetidas.
   */
  async abrirSobreAleatorio(userId, catalogoCompleto) {
    if (!catalogoCompleto || catalogoCompleto.length === 0) return []

    // 1. Elegir 5 figuritas al azar
    const sobresObtenidos = []
    for (let i = 0; i < 5; i++) {
      const indiceAzar = Math.floor(Math.random() * catalogoCompleto.length)
      sobresObtenidos.push(catalogoCompleto[indiceAzar])
    }

    // 2. Traer la colección actual del usuario desde Supabase
    const coleccionActual = await this.obtenerColeccion(userId)

    // 3. Crear mapa con el conteo de la tirada actual
    const conteoSobre = {}
    for (const fig of sobresObtenidos) {
      conteoSobre[fig.id] = (conteoSobre[fig.id] || 0) + 1
    }

    // 4. Actualizar/Insertar cada registro de forma independiente y segura
    for (const figuritaId of Object.keys(conteoSobre)) {
      const cantidadGanada = conteoSobre[figuritaId]
      const registroExistente = coleccionActual.find(item => item.figurita_id === figuritaId)

      if (registroExistente) {
        // Si el usuario YA tenía esta figurita, actualizamos (PATCH) su cantidad directamente por su ID primario
        const nuevaCantidad = registroExistente.cantidad + cantidadGanada
        await api.patch(ENDPOINT, { cantidad: nuevaCantidad }, {
          params: { id: `eq.${registroExistente.id}` }
        })
      } else {
        // Si es la PRIMERA VEZ que le toca, se realiza el INSERT del registro nuevo
        await api.post(
          ENDPOINT,
          {
            user_id: userId,
            figurita_id: figuritaId,
            cantidad: cantidadGanada
          },
          {
            headers: { Prefer: 'resolution=merge-duplicates,return=representation' }
          }
        )
      }
    }

    return sobresObtenidos
  }
}