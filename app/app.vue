<script setup lang="ts">
import DailyPlanner from './resources/DailyPlanner.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden font-sans text-gray-900 antialiased">
    <Sidebar />
    <DailyPlanner />
  </div>
</template>
