import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { albumService } from '@/services/albumService'
import { figuritasService } from '@/services/figuritasService'

export const useAlbumStore = defineStore('album', () => {
  // Estado Centralizado en RAM
  const catalogo = ref([])
  const miColeccion = ref([])
  const sobreMensaje = ref(null)
  const resumenSobreActual = ref({}) // Mapa de ID -> cantidadGanada en el último sobre abierto
  const loading = ref(false)
  const error = ref(null)

  const filtros = ref({
    busqueda: '',
    ordenarPor: 'numero'
  })

  // Getters / Computadas
  const figuritasProcesadas = computed(() => {
    // Mapa auxiliar O(1) de cantidades en propiedad del usuario
    const mapaCantidades = {}
    miColeccion.value.forEach(item => {
      if (item && item.figurita_id) {
        mapaCantidades[String(item.figurita_id)] = item.cantidad
      }
    })

    // Incrustamos 'cantidad' y el nuevo flag 'esNueva'
    let resultado = catalogo.value.map(fig => {
      const figIdStr = String(fig.id)
      const cantidadTotal = mapaCantidades[figIdStr] || 0
      const cantidadGanadaEnSobre = resumenSobreActual.value[figIdStr] || 0

      // ES NUEVA si vino en este sobre Y la cantidad total acumulada es igual a lo que tocó en este sobre 
      // (lo que garantiza que antes del sobre el usuario tenía exactamente 0 copias).
      const esPrimeraVez = cantidadGanadaEnSobre > 0 && cantidadTotal === cantidadGanadaEnSobre

      return {
        ...fig,
        cantidad: cantidadTotal,
        esNueva: esPrimeraVez // Flag volátil: se borra al presionar F5 o recargar
      }
    })

    // 1. Filtrar por texto
    const texto = filtros.value.busqueda.trim().toLowerCase()
    if (texto) {
      resultado = resultado.filter(f =>
        f.nombre_jugador.toLowerCase().includes(texto) ||
        f.numero.toString().includes(texto) ||
        f.pais.toLowerCase().includes(texto) ||
        (f.posicion && f.posicion.toLowerCase().includes(texto))
      )
    }

    // 2. Ordenar dinámicamente
    resultado.sort((a, b) => {
      const criterio = filtros.value.ordenarPor
      if (criterio === 'numero') {
        return a.numero - b.numero
      }
      const valA = (a[criterio] || '').toString().toLowerCase()
      const valB = (b[criterio] || '').toString().toLowerCase()
      return valA.localeCompare(valB)
    })

    return resultado
  })

  // Acciones
  async function cargarDatosAlbum(userId) {
    if (!userId) return
    loading.value = true
    error.value = null
    try {
      const [listaFiguritas, coleccionUsuario] = await Promise.all([
        figuritasService.listar(),
        albumService.obtenerColeccion(userId)
      ])
      catalogo.value = listaFiguritas
      miColeccion.value = coleccionUsuario
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error al cargar los datos del álbum'
    } finally {
      loading.value = false
    }
  }

  async function abrirSobreDiario(userId) {
    if (!userId) return
    loading.value = true
    error.value = null
    try {
      if (catalogo.value.length === 0) {
        catalogo.value = await figuritasService.listar()
      }

      // 1. Abre el sobre e impacta en Supabase (retorna los 5 ítems obtenidos)
      const sobresObtenidos = await albumService.abrirSobreAleatorio(userId, catalogo.value)

      // 2. Mapeamos cuántas copias de cada figurita vinieron en ESTE sobre puntual
      // Ejemplo: { "uuid-messi": 2, "uuid-neymar": 1 }
      const conteoUltimoSobre = {}
      sobresObtenidos.forEach(f => {
        const key = String(f.id)
        conteoUltimoSobre[key] = (conteoUltimoSobre[key] || 0) + 1
      })
      resumenSobreActual.value = conteoUltimoSobre

      // 3. Trae la colección actualizada de la base de datos
      miColeccion.value = await albumService.obtenerColeccion(userId)

      // 4. Notificación global reactiva
      if (sobresObtenidos.length > 0) {
        sobreMensaje.value = sobresObtenidos
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Error al abrir el sobre diario'
    } finally {
      loading.value = false
    }
  }

  function limpiarFiltros() {
    filtros.value.busqueda = ''
    filtros.value.ordenarPor = 'numero'
  }

  function cerrarBanner() {
    sobreMensaje.value = null
  }

  return {
    catalogo,
    miColeccion,
    sobreMensaje,
    resumenSobreActual,
    loading,
    error,
    filtros,
    figuritasProcesadas,
    cargarDatosAlbum,
    abrirSobreDiario,
    limpiarFiltros,
    cerrarBanner
  }
})