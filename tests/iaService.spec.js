import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/services/api'
import { iaService } from '@/services/iaService'

vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn()
  }
}))

describe('iaService - Integración con Edge Function asistente-album', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('envía accion resumen_dashboard junto con las métricas del álbum', async () => {
    api.post.mockResolvedValue({
      data: { respuesta: '1. Reciclar repetida #5.' }
    })

    const metricas = { porcentaje: 75, repetidas: 2, puntosCrafteo: 40 }
    const res = await iaService.analizarProgresoDashboard(metricas)

    expect(res).toBe('1. Reciclar repetida #5.')
    expect(api.post).toHaveBeenCalledWith(
      '/asistente-album',
      { accion: 'resumen_dashboard', metricas },
      expect.objectContaining({
        baseURL: expect.stringContaining('/functions/v1')
      })
    )
  })

  it('envía accion dato_jugador con los datos de la figurita', async () => {
    api.post.mockResolvedValue({
      data: {
        respuesta: 'Disputó los Mundiales 2018 y 2022.',
        consultas_ia_usadas: 1
      }
    })

    const fig = { id: 6, nombre_jugador: 'Marquinhos', pais: 'Brasil', posicion: 'Defensor' }
    const res = await iaService.obtenerDatoJugador(fig)

    expect(res).toEqual({
      respuesta: 'Disputó los Mundiales 2018 y 2022.',
      consultas_ia_usadas: 1
    })
    expect(api.post).toHaveBeenCalledWith(
      '/asistente-album',
      {
        accion: 'dato_jugador',
        figuritaId: 6,
        nombreJugador: 'Marquinhos',
        pais: 'Brasil',
        posicion: 'Defensor'
      },
      expect.objectContaining({
        baseURL: expect.stringContaining('/functions/v1')
      })
    )
  })
})