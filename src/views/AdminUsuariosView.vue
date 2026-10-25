<script setup>
import { ref } from 'vue'

const busqueda = ref('')

const usuarios = ref([
  { id: 1, nombreUsuario: 'nombreUsuario', email: 'email', rol: 'Administrador' },
  { id: 2, nombreUsuario: 'nombreUsuario', email: 'email', rol: 'Default' },
  { id: 3, nombreUsuario: 'nombreUsuario', email: 'email', rol: 'Default' },
  { id: 4, nombreUsuario: 'nombreUsuario', email: 'email', rol: 'Default' }
])
</script>

<template>
  <div class="view-usuarios">
    <h1 style="text-align: center; margin-bottom: 1.5rem;">Usuarios</h1>

    <div class="toolbar-usuarios">
      <div class="search-box">
        <input v-model="busqueda" type="text" class="form-control" placeholder="Buscar" />
      </div>

      <div class="pagination-mock">
        <button class="page-btn active">1</button>
        <button class="page-btn">2</button>
        <button class="page-btn">3</button>
        <button class="page-btn">4</button>
      </div>

      <button class="btn btn-primary">Agregar</button>
    </div>

    <table class="tabla-admin">
      <thead>
        <tr>
          <th>idUsuario</th>
          <th>nombreUsuario</th>
          <th>email</th>
          <th>rol</th>
          <th style="text-align: center;">Administrar</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in usuarios" :key="user.id">
          <td><span class="badge-id">{{ user.id }}</span></td>
          <td>{{ user.nombreUsuario }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.rol }}</td>
          <td class="actions-cell">
            <button class="btn btn-warning">Modificar</button>
            <button class="btn btn-danger">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.toolbar-usuarios {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.search-box {
  flex: 1;
  max-width: 300px;
}

.pagination-mock {
  display: flex;
  gap: 0.25rem;
}

.page-btn {
  background-color: var(--color-bg-card);
  color: var(--color-text-light);
  border: 1px solid var(--color-border);
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  border-radius: 2px;
}

.page-btn.active {
  background-color: var(--color-accent);
  color: var(--color-bg-main);
}

.tabla-admin {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--color-bg-card);
  border-radius: 6px;
  overflow: hidden;
}

.tabla-admin th,
.tabla-admin td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.tabla-admin th {
  background-color: #172a30;
  color: var(--color-text-light);
}

.badge-id {
  background-color: var(--color-accent);
  color: var(--color-bg-main);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}

.actions-cell {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}
</style>