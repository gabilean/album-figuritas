import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAlbumStore } from '@/stores/albumStore'
import { crafteoService } from '@/services/crafteoService'
import { albumService } from '@/services/albumService'
import { intercambiosService } from '@/services/intercambiosService'
import { iaService } from '@/services/iaService'

vi.mock('@/services/crafteoService', () => ({
  crafteoService: {
    obtenerPuntos: vi.fn(),
    reciclar: vi.fn(),
    canjear: vi.fn()
  }
}))

vi.mock('@/services/albumService', () => ({
  albumService: {
    obtenerColeccion: vi.fn(),
    obtenerUltimoReclamo: vi.fn(),
    validarYRegistrarReclamo: vi.fn(),
    abrirSobreAleatorio: vi.fn()
  }
}))

vi.mock('@/services/intercambiosService', () => ({
  intercambiosService: {
    listarPendientes: vi.fn(),
    cancelar: vi.fn()
  }
}))

vi.mock('@/services/iaService', () => ({
  iaService: {
    analizarProgresoDashboard: vi.fn(),
    obtenerDatoJugador: vi.fn()
  }
}))

describe('albumStore - Crafteo, Auto-cancelación de Intercambios y TrivIA', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('reciclarFiguritas actualiza el saldo de puntosCrafteo y refresca miColeccion', async () => {
    const store = useAlbumStore()
    store.puntosCrafteo = 20

    crafteoService.reciclar.mockResolvedValue(70) // +10 común +40 especial
    albumService.obtenerColeccion.mockResolvedValue([
      { figurita_id: 1, cantidad: 1 }
    ])

    await store.reciclarFiguritas('user-123', [
      { figurita_id: 1, cantidad: 1 },
      { figurita_id: 3, cantidad: 1 }
    ])

    expect(crafteoService.reciclar).toHaveBeenCalledTimes(1)
    expect(store.puntosCrafteo).toBe(70)
    expect(store.miColeccion).toEqual([{ figurita_id: 1, cantidad: 1 }])
    expect(store.procesandoCrafteo).toBe(false)
  })

  it('fabricarFiguritaPuntual descuenta puntos y cancela automáticamente pedidos activos de esa figurita', async () => {
    const store = useAlbumStore()
    store.puntosCrafteo = 120
    store.catalogo = [
      { id: 2, numero: 2, nombre_jugador: 'Cristian Romero', pais: 'Argentina', es_especial: false }
    ]
    store.intercambios = [
      {
        id: 'tx-99',
        creador_id: 'user-123',
        estado: 'pendiente',
        figurita_buscada_id: 2,
        figurita_ofrecida_id: 1
      }
    ]

    crafteoService.canjear.mockResolvedValue(20)
    albumService.obtenerColeccion.mockResolvedValue([{ figurita_id: 2, cantidad: 1 }])
    intercambiosService.cancelar.mockResolvedValue({})
    intercambiosService.listarPendientes.mockResolvedValue([])

    await store.fabricarFiguritaPuntual('user-123', 2)

    expect(store.puntosCrafteo).toBe(20)
    expect(intercambiosService.cancelar).toHaveBeenCalledWith('tx-99')
    expect(store.intercambiosCanceladosAuto).toContain('#2 Cristian Romero')
  })

  it('consultarDatoJugadorIA actualiza consultas_ia_usadas y ultimo_dato_ia en memoria', async () => {
    const store = useAlbumStore()
    store.miColeccion = [
      { id: 'reg-1', figurita_id: 10, cantidad: 2, consultas_ia_usadas: 0, ultimo_dato_ia: null }
    ]

    iaService.obtenerDatoJugador.mockResolvedValue({
      respuesta: 'Campeón del mundo en Catar 2022 con Argentina.',
      consultas_ia_usadas: 1
    })

    const texto = await store.consultarDatoJugadorIA({
      id: 10,
      nombre_jugador: 'Rodrigo De Paul',
      pais: 'Argentina',
      posicion: 'Mediocampista'
    })

    expect(texto).toBe('Campeón del mundo en Catar 2022 con Argentina.')
    expect(store.miColeccion[0].consultas_ia_usadas).toBe(1)
    expect(store.miColeccion[0].ultimo_dato_ia).toBe('Campeón del mundo en Catar 2022 con Argentina.')
    expect(store.cargandoDatoCartaId).toBeNull()
  })
})