import { ref, reactive, watch, computed } from 'vue'
import { albumService } from '@/services/albumService'
import { figuritasService } from '@/services/figuritasService'

export function useAlbum() {
  const catalogo = ref([])
  const miColeccion = ref([])
  const loading = ref(false)
  const error = ref(null)
  const sobreMensaje = ref(null) // Notificación reactiva del sobre abierto

  const filtros = reactive({
    busqueda: '',
    ordenarPor: 'numero'
  })

  let timerDebounce = null

  async function ejecutarAccion(tarea, mensajeErrorDefault = 'Error en la operación') {
    loading.value = true
    error.value = null
    let exito = false

    try {
      await tarea()
      exito = true
    } catch (err) {
      error.value = err.response?.data?.message || err.message || mensajeErrorDefault
    } finally {
      loading.value = false
    }

    return exito
  }

  async function cargarDatosAlbum(userId) {
    return ejecutarAccion(async () => {
      const [listaFiguritas, coleccionUsuario] = await Promise.all([
        figuritasService.listar(),
        albumService.obtenerColeccion(userId)
      ])
      catalogo.value = listaFiguritas
      miColeccion.value = coleccionUsuario
    }, 'Error al cargar los datos del álbum')
  }

  // Función de apertura de sobre con refresco reactivo garantizado
  async function abrirSobreDiario(userId) {
    let sobresRegalados = []
    
    const ok = await ejecutarAccion(async () => {
      // 1. Asegurar catálogo cargado
      if (catalogo.value.length === 0) {
        catalogo.value = await figuritasService.listar()
      }
      
      // 2. Ejecutar apertura aleatoria en Supabase
      sobresRegalados = await albumService.abrirSobreAleatorio(userId, catalogo.value)
      
      // 3. Traer la colección nueva y reasignar array para Vue 3
      const nuevaColeccion = await albumService.obtenerColeccion(userId)
      miColeccion.value = [...nuevaColeccion]
    }, 'Error al abrir el sobre diario')

    if (ok && sobresRegalados.length > 0) {
      // Reasignación reactiva explícita para activar el v-if en la plantilla
      sobreMensaje.value = [...sobresRegalados]
    }
  }

  watch(
    () => [filtros.busqueda, filtros.ordenarPor],
    () => {
      clearTimeout(timerDebounce)
      timerDebounce = setTimeout(() => {}, 300)
    }
  )

  // Mapeo dinámico y reactivo que inyecta la propiedad 'cantidad' a cada figurita
  const figuritasProcesadas = computed(() => {
    // Mapa auxiliar O(1) convirtiendo la clave a String para evitar discrepancias de UUID/int
    const mapaCantidades = {}
    miColeccion.value.forEach(item => {
      if (item && item.figurita_id) {
        mapaCantidades[String(item.figurita_id)] = item.cantidad
      }
    })

    // Incrustar 'cantidad' directamente en el objeto computado
    let resultado = catalogo.value.map(fig => ({
      ...fig,
      cantidad: mapaCantidades[String(fig.id)] || 0
    }))

    // Filtrar por texto de búsqueda
    const texto = filtros.busqueda.trim().toLowerCase()
    if (texto) {
      resultado = resultado.filter(f =>
        f.nombre_jugador.toLowerCase().includes(texto) ||
        f.numero.toString().includes(texto) ||
        f.pais.toLowerCase().includes(texto) ||
        (f.posicion && f.posicion.toLowerCase().includes(texto))
      )
    }

    // Ordenar dinámicamente
    resultado.sort((a, b) => {
      const criterio = filtros.ordenarPor
      if (criterio === 'numero') {
        return a.numero - b.numero
      }
      const valA = (a[criterio] || '').toString().toLowerCase()
      const valB = (b[criterio] || '').toString().toLowerCase()
      return valA.localeCompare(valB)
    })

    return resultado
  })

  return {
    catalogo,
    miColeccion,
    loading,
    error,
    filtros,
    sobreMensaje,
    figuritasProcesadas,
    cargarDatosAlbum,
    abrirSobreDiario
  }
}