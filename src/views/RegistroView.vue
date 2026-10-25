<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { registrar, loading, error } = useAuth()

const form = reactive({
  nombreUsuario: '',
  email: '',
  password: ''
})

async function procesarRegistro() {
  const ok = await registrar(form.email, form.password, form.nombreUsuario)
  if (ok) {
    router.push('/admin/figuritas')
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">Crear Cuenta</h1>

      <p v-if="error" class="error-msg text-center">{{ error }}</p>

      <form @submit.prevent="procesarRegistro" class="form-grid">
        <div class="form-group">
          <label>Nombre de Usuario:</label>
          <input
            v-model="form.nombreUsuario"
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
            required
            class="form-control"
            placeholder="usuario@correo.com"
          />
        </div>

        <div class="form-group">
          <label>Contraseña:</label>
          <input
            v-model="form.password"
            type="password"
            required
            minlength="6"
            class="form-control"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <button type="submit" :disabled="loading" class="btn btn-primary btn-full">
          {{ loading ? 'Creando cuenta...' : 'Registrarse' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>¿Ya tenés cuenta? </span>
        <router-link to="/login" class="auth-link">Iniciá sesión aquí</router-link>
      </div>
    </div>
  </div>
</template>