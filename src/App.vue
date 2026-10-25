<script setup>
import AdminSidebar from '@/components/AdminSidebar.vue'
</script>

<template>
  <div class="admin-layout">
    <AdminSidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>