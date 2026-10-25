<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useFiguritas } from '@/composables/useFiguritas'
import { figuritasService, obtenerNombreArchivoDeUrl } from '@/services/figuritasService'
import FiguritaCard from '@/components/FiguritaCard.vue'

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

const editandoId = ref(null)
const tipoOrigenImagen = ref('url')
const subiendoImagen = ref(false)

const form = reactive({
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

function resetForm() {
  editandoId.value = null
  tipoOrigenImagen.value = 'url'
  subiendoImagen.value = false
  form.numero = ''
  form.nombre_jugador = ''
  form.pais = ''
  form.posicion = ''
  form.imagen_url = ''
  form.es_especial = false
}

function prepararEdicion(fig) {
  editandoId.value = fig.id
  tipoOrigenImagen.value = 'url'
  form.numero = fig.numero
  form.nombre_jugador = fig.nombre_jugador
  form.pais = fig.pais
  form.posicion = fig.posicion || ''
  form.imagen_url = fig.imagen_url || ''
  form.es_especial = fig.es_especial || false
}

async function procesarArchivo(evento) {
  const archivo = evento.target.files[0]
  if (!archivo) return

  subiendoImagen.value = true
  try {
    const urlPublica = await figuritasService.subirImagen(archivo)
    form.imagen_url = urlPublica
  } catch (err) {
    alert('Error al subir la imagen')
  } finally {
    subiendoImagen.value = false
  }
}

async function quitarImagen() {
  if (form.imagen_url) {
    const nombreArchivo = obtenerNombreArchivoDeUrl(form.imagen_url)
    if (nombreArchivo) {
      await figuritasService.borrarImagen(nombreArchivo)
    }
  }
  form.imagen_url = ''
}

async function guardar() {
  const datos = {
    numero: Number(form.numero),
    nombre_jugador: form.nombre_jugador.trim(),
    pais: form.pais.trim(),
    posicion: form.posicion.trim() || null,
    imagen_url: form.imagen_url.trim() || null,
    es_especial: form.es_especial
  }

  const ok = editandoId.value
    ? await actualizarFigurita(editandoId.value, datos)
    : await crearFigurita(datos)

  if (ok) {
    resetForm()
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
  <main class="container">
    <h1 style="margin-bottom: 1.5rem;">Administrador del Catálogo Maestro</h1>

    <!-- Formulario -->
    <section class="form-section">
      <h2 style="margin-bottom: 1rem; font-size: 1.2rem;">
        {{ editandoId ? 'Editar Figurita' : 'Agregar Nueva Figurita' }}
      </h2>

      <form @submit.prevent="guardar" class="form-grid">
        <div class="form-group">
          <label>Número:</label>
          <input v-model="form.numero" type="number" required min="1" class="form-control" placeholder="Ej: 10" />
        </div>

        <div class="form-group">
          <label>Nombre del Jugador:</label>
          <input v-model="form.nombre_jugador" type="text" required class="form-control"
            placeholder="Ej: Lionel Messi" />
        </div>

        <div class="form-group">
          <label>País / Selección:</label>
          <input v-model="form.pais" type="text" required class="form-control" placeholder="Ej: Argentina" />
        </div>

        <div class="form-group">
          <label>Posición:</label>
          <input v-model="form.posicion" type="text" class="form-control" placeholder="Ej: Delantero" />
        </div>

        <div class="form-group form-group-full">
          <label>Imagen del Jugador:</label>

          <!-- Selector de origen -->
          <div class="origen-selector">
            <button type="button" class="btn-tab" :class="{ active: tipoOrigenImagen === 'url' }"
              @click="tipoOrigenImagen = 'url'">
              Enlace URL
            </button>
            <button type="button" class="btn-tab" :class="{ active: tipoOrigenImagen === 'archivo' }"
              @click="tipoOrigenImagen = 'archivo'">
              Subir desde PC
            </button>
          </div>

          <!-- Campo condicional 1: URL externa -->
          <div v-if="tipoOrigenImagen === 'url'" class="origen-input">
            <input v-model="form.imagen_url" type="url" class="form-control"
              placeholder="https://ejemplo.com/fotos/messi.jpg" />
          </div>

          <!-- Campo condicional 2: Archivo local -->
          <div v-else class="origen-input">
            <input type="file" accept="image/*" class="form-control-file" :disabled="subiendoImagen"
              @change="procesarArchivo" />
            <p v-if="subiendoImagen" class="texto-estado">Subiendo imagen a Supabase Storage...</p>
          </div>

          <!-- Previsualización de la imagen cargada -->
          <div v-if="form.imagen_url" class="preview-container">
            <img :src="form.imagen_url" alt="Previsualización" class="img-preview" />
            <button type="button" class="btn-quitar-foto" @click="quitarImagen">Quitar foto</button>
          </div>
        </div>

        <div class="checkbox-group">
          <input id="es_especial" v-model="form.es_especial" type="checkbox" />
          <label for="es_especial">¿Es figurita especial?</label>
        </div>

        <div class="form-buttons">
          <button type="submit" :disabled="loading" class="btn btn-primary">
            {{ editandoId ? 'Guardar Cambios' : 'Agregar Figurita' }}
          </button>
          <button v-if="editandoId" type="button" @click="resetForm" class="btn btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </section>

    <!-- Búsqueda -->
    <section class="search-section">
      <input v-model="filtros.busqueda" type="text" class="form-control" placeholder="Buscar por nombre de jugador..."
        @keyup.enter="cargarFiguritas" />
      <button class="btn btn-primary" @click="cargarFiguritas">Buscar</button>
    </section>

    <!-- Estados -->
    <p v-if="loading">Cargando datos...</p>
    <p v-if="error" class="error-msg">{{ error }}</p>

    <!-- Grilla -->
    <section class="grid-figuritas">
      <FiguritaCard v-for="fig in figuritas" :key="fig.id" :figurita="fig" @editar="prepararEdicion"
        @eliminar="confirmarEliminacion(fig)" />
    </section>
  </main>
</template>