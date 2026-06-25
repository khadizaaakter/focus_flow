<script setup lang="ts">
const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50 font-sans text-gray-900 antialiased">
    <!-- Mobile overlay -->
    <Transition name="ff-overlay">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <Sidebar :mobile-open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <!-- Mobile top bar -->
      <header class="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur-sm lg:hidden">
        <button
          @click="sidebarOpen = true"
          class="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 active:scale-95"
          aria-label="Open navigation"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
        <div class="flex items-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
            <svg class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="text-sm font-bold text-gray-900">FocusFlow</span>
        </div>
      </header>

      <NuxtPage class="flex-1 overflow-y-auto" />
    </div>
  </div>
</template>

<style>
.ff-overlay-enter-active,
.ff-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.ff-overlay-enter-from,
.ff-overlay-leave-to {
  opacity: 0;
}
</style>
