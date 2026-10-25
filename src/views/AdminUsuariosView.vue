<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useUsuarios } from '@/composables/useUsuarios'

const { perfil } = useAuth()
const {
  usuarios,
  loading,
  error,
  filtros,
  cargarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
} = useUsuarios()

const editandoId = ref(null)

const form = reactive({
  nombre_usuario: '',
  email: '',
  rol: 'user'
})

onMounted(() => {
  cargarUsuarios()
})

function resetForm() {
  editandoId.value = null
  form.nombre_usuario = ''
  form.email = ''
  form.rol = 'user'
}

function prepararEdicion(user) {
  editandoId.value = user.id
  form.nombre_usuario = user.nombre_usuario
  form.email = user.email || ''
  form.rol = user.rol || 'user'
}

async function guardar() {
  const datos = {
    nombre_usuario: form.nombre_usuario.trim(),
    email: form.email.trim() || null,
    rol: form.rol
  }

  const ok = editandoId.value
    ? await actualizarUsuario(editandoId.value, datos)
    : await crearUsuario(datos)

  if (ok) {
    resetForm()
  }
}

async function confirmarEliminacion(id) {
  if (confirm('¿Estás seguro de eliminar este usuario? Sus figuritas vinculadas también se removerán.')) {
    await eliminarUsuario(id)
  }
}
</script>

<template>
  <div class="user-layout">
    <!-- Encabezado Estandarizado -->
    <div class="header-banner">
      <h1>Gestión de Usuarios</h1>
      <span class="user-greeting">Hola, {{ perfil?.nombre_usuario || 'Administrador' }}</span>
    </div>

    <main class="main-content-inner">
      <!-- Formulario de Alta / Modificación -->
      <section class="form-section">
        <h2 style="margin-bottom: 1rem; font-size: 1.2rem;">
          {{ editandoId ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}
        </h2>

        <form @submit.prevent="guardar" class="form-grid">
          <div class="form-group">
            <label>Nombre de Usuario:</label>
            <input
              v-model="form.nombre_usuario"
              type="text"
              required
              class="form-control"
              placeholder="Ej: juanperez"
            />
          </div>

          <div class="form-group">
            <label>Email:</label>
            <input
              v-model="form.email"
              type="email"
              class="form-control"
              placeholder="Ej: usuario@correo.com"
            />
          </div>

          <div class="form-group">
            <label>Rol:</label>
            <select v-model="form.rol" class="form-control">
              <option value="user">Usuario (Default)</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div class="form-buttons">
            <button type="submit" :disabled="loading" class="btn btn-primary">
              {{ editandoId ? 'Guardar Cambios' : 'Crear Usuario' }}
            </button>
            <button v-if="editandoId" type="button" @click="resetForm" class="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </section>

      <!-- Barra de Filtros y Búsqueda -->
      <section class="search-section">
        <input
          v-model="filtros.busqueda"
          type="text"
          class="form-control"
          placeholder="Buscar por nombre de usuario..."
          @keyup.enter="cargarUsuarios"
        />
        <select v-model="filtros.rol" class="form-control" style="max-width: 180px;" @change="cargarUsuarios">
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="user">Usuario Default</option>
        </select>
        <button class="btn btn-primary" @click="cargarUsuarios">Buscar</button>
      </section>

      <!-- Estados de Carga y Error -->
      <p v-if="loading">Cargando usuarios...</p>
      <p v-if="error" class="error-msg">{{ error }}</p>

      <!-- Tabla de Usuarios -->
      <table v-if="!loading && usuarios.length" class="tabla-admin">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre de Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usuarios" :key="user.id">
            <td><span class="badge-id">{{ user.id }}</span></td>
            <td>{{ user.nombre_usuario }}</td>
            <td>{{ user.email || 'N/A' }}</td>
            <td>
              <span :class="user.rol === 'admin' ? 'badge-role-admin' : 'badge-role-user'">
                {{ user.rol === 'admin' ? 'Administrador' : 'Default' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="btn btn-warning" @click="prepararEdicion(user)">Modificar</button>
              <button class="btn btn-danger" @click="confirmarEliminacion(user.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else-if="!loading">No se encontraron usuarios registrados.</p>
    </main>
  </div>
</template>