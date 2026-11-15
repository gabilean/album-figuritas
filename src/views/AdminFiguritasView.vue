<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useFiguritas } from '@/composables/useFiguritas'
import { figuritasService, obtenerNombreArchivoDeUrl } from '@/services/figuritasService'
import FiguritaCard from '@/components/FiguritaCard.vue'

const { perfil } = useAuth()
const {
  figuritas,
  loading,
  error,
  filtros,
  cargarFiguritas,
  crearFigurita,
  actualizarFigurita,
  eliminarFigurita
} = useFiguritas()

const ordenarPor = ref('numero')

const figuritasOrdenadas = computed(() => {
  const lista = [...figuritas.value]
  lista.sort((a, b) => {
    if (ordenarPor.value === 'numero') {
      return Number(a.numero) - Number(b.numero)
    }
    const valA = String(a[ordenarPor.value] || '').toLowerCase()
    const valB = String(b[ordenarPor.value] || '').toLowerCase()
    return valA.localeCompare(valB)
  })
  return lista
})

// Estado del formulario superior (Alta)
const tipoOrigenImagenCrear = ref('url')
const subiendoImagenCrear = ref(false)
const formCrear = reactive({
  numero: '',
  nombre_jugador: '',
  pais: '',
  posicion: '',
  imagen_url: '',
  es_especial: false
})

// Estado del Modal (Edición)
const editandoId = ref(null)
const tipoOrigenImagenEditar = ref('url')
const subiendoImagenEditar = ref(false)
const formEditar = reactive({
  numero: '',
  nombre_jugador: '',
  pais: '',
  posicion: '',
  imagen_url: '',
  es_especial: false
})

onMounted(() => {
  cargarFiguritas()
})

function resetFormCrear() {
  tipoOrigenImagenCrear.value = 'url'
  subiendoImagenCrear.value = false
  formCrear.numero = ''
  formCrear.nombre_jugador = ''
  formCrear.pais = ''
  formCrear.posicion = ''
  formCrear.imagen_url = ''
  formCrear.es_especial = false
}

function cerrarModalEdicion() {
  editandoId.value = null
  tipoOrigenImagenEditar.value = 'url'
  subiendoImagenEditar.value = false
  formEditar.numero = ''
  formEditar.nombre_jugador = ''
  formEditar.pais = ''
  formEditar.posicion = ''
  formEditar.imagen_url = ''
  formEditar.es_especial = false
}

function prepararEdicion(fig) {
  editandoId.value = fig.id
  tipoOrigenImagenEditar.value = 'url'
  formEditar.numero = fig.numero
  formEditar.nombre_jugador = fig.nombre_jugador
  formEditar.pais = fig.pais
  formEditar.posicion = fig.posicion || ''
  formEditar.imagen_url = fig.imagen_url || ''
  formEditar.es_especial = fig.es_especial || false
}

function limpiarFiltros() {
  filtros.busqueda = ''
  filtros.pais = ''
  ordenarPor.value = 'numero'
}

async function procesarArchivo(evento, modo) {
  const archivo = evento.target.files[0]
  if (!archivo) return

  const esEdicion = modo === 'editar'
  if (esEdicion) subiendoImagenEditar.value = true
  else subiendoImagenCrear.value = true

  try {
    const urlPublica = await figuritasService.subirImagen(archivo)
    if (esEdicion) formEditar.imagen_url = urlPublica
    else formCrear.imagen_url = urlPublica
  } catch (err) {
    alert('Error al subir la imagen')
  } finally {
    if (esEdicion) subiendoImagenEditar.value = false
    else subiendoImagenCrear.value = false
  }
}

async function quitarImagen(modo) {
  const targetForm = modo === 'editar' ? formEditar : formCrear
  if (targetForm.imagen_url) {
    const nombreArchivo = obtenerNombreArchivoDeUrl(targetForm.imagen_url)
    if (nombreArchivo) {
      await figuritasService.borrarImagen(nombreArchivo)
    }
  }
  targetForm.imagen_url = ''
}

async function crearNueva() {
  const datos = {
    numero: Number(formCrear.numero),
    nombre_jugador: formCrear.nombre_jugador.trim(),
    pais: formCrear.pais.trim(),
    posicion: formCrear.posicion.trim() || null,
    imagen_url: formCrear.imagen_url.trim() || null,
    es_especial: formCrear.es_especial
  }

  const ok = await crearFigurita(datos)
  if (ok) {
    resetFormCrear()
  }
}

async function guardarEdicion() {
  if (!editandoId.value) return

  const datos = {
    numero: Number(formEditar.numero),
    nombre_jugador: formEditar.nombre_jugador.trim(),
    pais: formEditar.pais.trim(),
    posicion: formEditar.posicion.trim() || null,
    imagen_url: formEditar.imagen_url.trim() || null,
    es_especial: formEditar.es_especial
  }

  const ok = await actualizarFigurita(editandoId.value, datos)
  if (ok) {
    cerrarModalEdicion()
  }
}

async function confirmarEliminacion(figurita) {
  if (confirm('¿Estás seguro de eliminar esta figurita del catálogo maestro?')) {
    if (figurita.imagen_url) {
      const nombreArchivo = obtenerNombreArchivoDeUrl(figurita.imagen_url)
      if (nombreArchivo) {
        await figuritasService.borrarImagen(nombreArchivo)
      }
    }
    await eliminarFigurita(figurita.id)
  }
}
</script>

<template>
  <div class="user-layout">
    <!-- Encabezado Estandarizado -->
    <div class="header-banner">
      <h1>Catálogo Maestro de Figuritas</h1>
      <span class="user-greeting">Hola, {{ perfil?.nombre_usuario || 'Administrador' }}</span>
    </div>

    <main class="main-content-inner">
      <!-- Formulario de Alta -->
      <section class="form-section">
        <h2 style="margin-bottom: 1rem; font-size: 1.2rem;">
          Agregar Nueva Figurita
        </h2>

        <form @submit.prevent="crearNueva" class="form-grid">
          <div class="form-group">
            <label>Número:</label>
            <input
              v-model="formCrear.numero"
              type="number"
              required
              min="1"
              class="form-control"
              placeholder="Ej: 10"
            />
          </div>

          <div class="form-group">
            <label>Nombre del Jugador:</label>
            <input
              v-model="formCrear.nombre_jugador"
              type="text"
              required
              class="form-control"
              placeholder="Ej: Lionel Messi"
            />
          </div>

          <div class="form-group">
            <label>País / Selección:</label>
            <input
              v-model="formCrear.pais"
              type="text"
              required
              class="form-control"
              placeholder="Ej: Argentina"
            />
          </div>

          <div class="form-group">
            <label>Posición:</label>
            <input
              v-model="formCrear.posicion"
              type="text"
              class="form-control"
              placeholder="Ej: Delantero"
            />
          </div>

          <div class="form-group form-group-full">
            <label>Imagen del Jugador:</label>

            <div class="origen-selector">
              <button
                type="button"
                class="btn-tab"
                :class="{ active: tipoOrigenImagenCrear === 'url' }"
                @click="tipoOrigenImagenCrear = 'url'"
              >
                Enlace URL
              </button>
              <button
                type="button"
                class="btn-tab"
                :class="{ active: tipoOrigenImagenCrear === 'archivo' }"
                @click="tipoOrigenImagenCrear = 'archivo'"
              >
                Subir desde PC
              </button>
            </div>

            <div v-if="tipoOrigenImagenCrear === 'url'" class="origen-input">
              <input
                v-model="formCrear.imagen_url"
                type="url"
                class="form-control"
                placeholder="https://ejemplo.com/fotos/messi.jpg"
              />
            </div>

            <div v-else class="origen-input">
              <input
                type="file"
                accept="image/*"
                class="form-control-file"
                :disabled="subiendoImagenCrear"
                @change="procesarArchivo($event, 'crear')"
              />
              <p v-if="subiendoImagenCrear" class="texto-estado">Subiendo imagen a Supabase Storage...</p>
            </div>

            <div v-if="formCrear.imagen_url" class="preview-container">
              <img :src="formCrear.imagen_url" alt="Previsualización" class="img-preview" />
              <button type="button" class="btn-quitar-foto" @click="quitarImagen('crear')">Quitar foto</button>
            </div>
          </div>

          <div class="checkbox-group">
            <input id="es_especial_crear" v-model="formCrear.es_especial" type="checkbox" />
            <label for="es_especial_crear">¿Es figurita especial?</label>
          </div>

          <div class="form-buttons">
            <button type="submit" :disabled="loading || subiendoImagenCrear" class="btn btn-primary">
              Agregar Figurita
            </button>
          </div>
        </form>
      </section>

      <!-- Barra de Búsqueda Reactiva y Acotada -->
      <section class="search-section">
        <input
          v-model="filtros.busqueda"
          type="text"
          class="form-control search-input"
          placeholder="Buscar por jugador, número o país..."
        />

        <div class="filter-group">
          <label for="ordenar-admin">Ordenar por:</label>
          <select id="ordenar-admin" v-model="ordenarPor" class="form-control select-orden">
            <option value="numero">Número (#)</option>
            <option value="nombre_jugador">Nombre de Jugador</option>
            <option value="pais">Selección / País</option>
            <option value="posicion">Posición</option>
          </select>
        </div>

        <button
          v-if="filtros.busqueda || filtros.pais || ordenarPor !== 'numero'"
          type="button"
          class="btn btn-secondary"
          @click="limpiarFiltros"
        >
          Limpiar
        </button>
      </section>

      <!-- Estados de Carga y Error -->
      <p v-if="loading">Cargando catálogo...</p>
      <p v-if="error" class="error-msg">{{ error }}</p>

      <!-- Grilla de Figuritas -->
      <section v-if="!loading && figuritasOrdenadas.length" class="grid-figuritas">
        <FiguritaCard
          v-for="fig in figuritasOrdenadas"
          :key="fig.id"
          :figurita="fig"
          @editar="prepararEdicion"
          @eliminar="confirmarEliminacion(fig)"
        />
      </section>

      <!-- Estado vacío cuando no hay resultados de búsqueda -->
      <p v-else-if="!loading && figuritasOrdenadas.length === 0" class="text-center text-muted pad-empty">
        No se encontraron figuritas que coincidan con la búsqueda.
      </p>
    </main>

    <!-- Modal Flotante de Edición (mantiene la posición del scroll) -->
    <div v-if="editandoId !== null" class="modal-overlay" @click.self="cerrarModalEdicion">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Editar Figurita #{{ formEditar.numero }}</h2>
          <button type="button" class="btn-cerrar-modal" @click="cerrarModalEdicion" aria-label="Cerrar">
            &times;
          </button>
        </div>

        <form @submit.prevent="guardarEdicion" class="form-grid">
          <div class="form-group">
            <label>Número:</label>
            <input
              v-model="formEditar.numero"
              type="number"
              required
              min="1"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Nombre del Jugador:</label>
            <input
              v-model="formEditar.nombre_jugador"
              type="text"
              required
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>País / Selección:</label>
            <input
              v-model="formEditar.pais"
              type="text"
              required
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Posición:</label>
            <input
              v-model="formEditar.posicion"
              type="text"
              class="form-control"
            />
          </div>

          <div class="form-group form-group-full">
            <label>Imagen del Jugador:</label>

            <div class="origen-selector">
              <button
                type="button"
                class="btn-tab"
                :class="{ active: tipoOrigenImagenEditar === 'url' }"
                @click="tipoOrigenImagenEditar = 'url'"
              >
                Enlace URL
              </button>
              <button
                type="button"
                class="btn-tab"
                :class="{ active: tipoOrigenImagenEditar === 'archivo' }"
                @click="tipoOrigenImagenEditar = 'archivo'"
              >
                Subir desde PC
              </button>
            </div>

            <div v-if="tipoOrigenImagenEditar === 'url'" class="origen-input">
              <input
                v-model="formEditar.imagen_url"
                type="url"
                class="form-control"
                placeholder="https://ejemplo.com/fotos/jugador.jpg"
              />
            </div>

            <div v-else class="origen-input">
              <input
                type="file"
                accept="image/*"
                class="form-control-file"
                :disabled="subiendoImagenEditar"
                @change="procesarArchivo($event, 'editar')"
              />
              <p v-if="subiendoImagenEditar" class="texto-estado">Subiendo imagen a Supabase Storage...</p>
            </div>

            <div v-if="formEditar.imagen_url" class="preview-container">
              <img :src="formEditar.imagen_url" alt="Previsualización" class="img-preview" />
              <button type="button" class="btn-quitar-foto" @click="quitarImagen('editar')">Quitar foto</button>
            </div>
          </div>

          <div class="checkbox-group">
            <input id="es_especial_editar" v-model="formEditar.es_especial" type="checkbox" />
            <label for="es_especial_editar">¿Es figurita especial?</label>
          </div>

          <div class="form-buttons">
            <button type="submit" :disabled="loading || subiendoImagenEditar" class="btn btn-primary">
              Guardar Cambios
            </button>
            <button type="button" @click="cerrarModalEdicion" class="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>