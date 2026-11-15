import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAlbumStore } from '@/stores/albumStore'

// Mockear los servicios externos para aislar la lógica del Store
vi.mock('@/services/albumService', () => ({
  albumService: {
    obtenerColeccion: vi.fn(),
    obtenerUltimoReclamo: vi.fn(),
    validarYRegistrarReclamo: vi.fn(),
    abrirSobreAleatorio: vi.fn()
  }
}))

vi.mock('@/services/figuritasService', () => ({
  figuritasService: {
    listar: vi.fn()
  }
}))

vi.mock('@/services/crafteoService', () => ({
  crafteoService: {
    obtenerPuntos: vi.fn(),
    reciclar: vi.fn(),
    canjear: vi.fn()
  }
}))

vi.mock('@/services/intercambiosService', () => ({
  intercambiosService: {
    listarPendientes: vi.fn()
  }
}))

vi.mock('@/services/iaService', () => ({
  iaService: {
    analizarProgresoDashboard: vi.fn(),
    obtenerDatoJugador: vi.fn()
  }
}))

describe('albumStore - Métricas, Colección y Filtros', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const catalogoMock = [
    { id: 1, numero: 1, nombre_jugador: 'Emiliano Martínez', pais: 'Argentina', posicion: 'Arquero', es_especial: false },
    { id: 2, numero: 2, nombre_jugador: 'Cristian Romero', pais: 'Argentina', posicion: 'Defensor', es_especial: false },
    { id: 3, numero: 10, nombre_jugador: 'Lionel Messi', pais: 'Argentina', posicion: 'Delantero', es_especial: true },
    { id: 4, numero: 9, nombre_jugador: 'Neymar Jr', pais: 'Brasil', posicion: 'Delantero', es_especial: true }
  ]

  it('calcula correctamente obtenidas, faltantes, repetidas y porcentaje completado', () => {
    const store = useAlbumStore()
    store.catalogo = catalogoMock
    store.miColeccion = [
      { figurita_id: 1, cantidad: 1 }, // Pegada (0 repetidas)
      { figurita_id: 3, cantidad: 3 }  // Pegada + 2 repetidas
    ]

    expect(store.totalCatalogo).toBe(4)
    expect(store.totalObtenidas).toBe(2)
    expect(store.totalFaltantes).toBe(2)
    expect(store.totalRepetidas).toBe(2)
    expect(store.porcentajeCompletado).toBe(50)
  })

  it('filtra figuritas por nombre de jugador o país y ordena por número', () => {
    const store = useAlbumStore()
    store.catalogo = catalogoMock
    store.miColeccion = []

    store.filtros.busqueda = 'brasil'
    expect(store.figuritasProcesadas).toHaveLength(1)
    expect(store.figuritasProcesadas[0].nombre_jugador).toBe('Neymar Jr')

    store.limpiarFiltros()
    expect(store.figuritasProcesadas).toHaveLength(4)
    expect(store.figuritasProcesadas[0].numero).toBe(1)
  })

  it('marca como esNueva únicamente la carta obtenida por primera vez en el último sobre', () => {
    const store = useAlbumStore()
    store.catalogo = catalogoMock
    store.miColeccion = [
      { figurita_id: 1, cantidad: 1 }, // Primera vez
      { figurita_id: 3, cantidad: 2 }  // Ya tenía 1 antes y sacó otra en el sobre
    ]
    store.resumenSobreActual = {
      '1': 1,
      '3': 1
    }

    const procesadas = store.figuritasProcesadas
    const dibu = procesadas.find(f => f.id === 1)
    const messi = procesadas.find(f => f.id === 3)

    expect(dibu.esNueva).toBe(true)
    expect(messi.esNueva).toBe(false)
  })
})