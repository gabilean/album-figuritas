<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login, esAdmin, loading, error } = useAuth()

const form = reactive({
  email: '',
  password: ''
})

async function procesarLogin() {
  const ok = await login(form.email, form.password)
  if (ok) {
    const destino = esAdmin.value ? '/admin/figuritas' : '/mi-album'
    router.push(destino)
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">Iniciar Sesión</h1>
      
      <p v-if="error" class="error-msg text-center">{{ error }}</p>

      <form @submit.prevent="procesarLogin" class="form-grid">
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
            class="form-control"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" :disabled="loading" class="btn btn-primary btn-full">
          {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>¿No tenés cuenta? </span>
        <router-link to="/registro" class="auth-link">Registrate aquí</router-link>
      </div>
    </div>
  </div>
</template>