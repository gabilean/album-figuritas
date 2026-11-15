import api from './api'

const FUNCTIONS_BASE_URL = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '') + '/functions/v1'

export const iaService = {
  /**
   * Solicita un análisis estratégico de la colección para el Dashboard.
   */
  async analizarProgresoDashboard(metricas) {
    const { data } = await api.post(
      '/asistente-album',
      {
        accion: 'resumen_dashboard',
        metricas
      },
      {
        baseURL: FUNCTIONS_BASE_URL
      }
    )
    return data.respuesta
  },

  /**
   * Solicita una curiosidad mundialista de un jugador obtenido (descuenta 1 crédito IA).
   */
  async obtenerDatoJugador(figurita) {
    const { data } = await api.post(
      '/asistente-album',
      {
        accion: 'dato_jugador',
        figuritaId: figurita.id,
        nombreJugador: figurita.nombre_jugador,
        pais: figurita.pais,
        posicion: figurita.posicion
      },
      {
        baseURL: FUNCTIONS_BASE_URL
      }
    )
    return {
      respuesta: data.respuesta,
      consultas_ia_usadas: data.consultas_ia_usadas
    }
  }
}