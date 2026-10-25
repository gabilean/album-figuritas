<script setup>
defineProps({
  figurita: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['editar', 'eliminar'])
</script>

<template>
  <div class="card-figurita" :class="{ 'es-especial': figurita.es_especial }">
    <div class="card-header">
      <span class="numero">#{{ figurita.numero }}</span>
      <span v-if="figurita.es_especial" class="badge-especial">Especial</span>
    </div>

    <div class="card-media">
      <img
        v-if="figurita.imagen_url"
        :src="figurita.imagen_url"
        :alt="figurita.nombre_jugador"
        class="card-img"
      />
      <div v-else class="card-img-placeholder">
        Sin Foto
      </div>
    </div>

    <div class="card-body">
      <h3>{{ figurita.nombre_jugador }}</h3>
      <p class="pais">{{ figurita.pais }}</p>
      <p class="posicion">Posición: {{ figurita.posicion || 'N/A' }}</p>
    </div>

    <div class="card-actions">
      <button class="btn btn-warning" @click="emit('editar', figurita)">
        Editar
      </button>
      <button class="btn btn-danger" @click="emit('eliminar', figurita.id)">
        Eliminar
      </button>
    </div>
  </div>
</template>