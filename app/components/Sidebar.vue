<script setup lang="ts">
const route = useRoute()

const nav = [
  { label: "Planner",    icon: "tasks",    path: "/tasks" },
  { label: "Habits",     icon: "habits",   path: "/habits" },
  { label: "Focus Room", icon: "timer",    path: "/focus-room" },
  { label: "Insights",   icon: "insights", path: "/insights" },
]
</script>

<template>
  <aside
    class="flex w-60 flex-col justify-between border-r border-gray-200 bg-white px-5 py-6"
  >
    <div>
      <!-- Brand -->
      <h1 class="text-xl font-bold text-gray-900">FocusFlow</h1>

      <!-- User profile -->
      <div class="mt-7 flex items-center gap-3">
        <img
          src="https://i.pravatar.cc/80?img=12"
          alt="Alex Rivera"
          class="h-9 w-9 rounded-full object-cover"
        />
        <div class="leading-tight">
          <p class="text-sm font-semibold text-gray-900">Alex Rivera</p>
          <p class="text-xs text-gray-400">Deep Work Mode</p>
        </div>
      </div>

      <!-- New project -->
      <button
        class="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        <span class="text-base leading-none">+</span> New Project
      </button>

      <!-- Navigation -->
      <nav class="mt-7 space-y-1.5">
        <NuxtLink
          v-for="item in nav"
          :key="item.label"
          :to="item.path"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition"
          :class="
            route.path === item.path
              ? 'bg-emerald-100 text-emerald-700'
              : 'border border-dashed border-gray-200 text-gray-500 hover:bg-gray-50'
          "
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            viewBox="0 0 24 24"
          >
            <template v-if="item.icon === 'tasks'">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </template>
            <template v-else-if="item.icon === 'habits'">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </template>
            <template v-else-if="item.icon === 'timer'">
              <circle cx="12" cy="13" r="8" />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v4l2 2M9 3h6"
              />
            </template>
            <template v-else>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 19V5m5 14V9m5 10V13m5 6V7"
              />
            </template>
          </svg>
          {{ item.label }}
        </NuxtLink>
      </nav>
    </div>
    1

    <!-- Footer -->
    <div class="space-y-3 border-t border-gray-100 pt-5">
      <button
        class="flex items-center gap-3 text-sm text-gray-500 transition hover:text-gray-900"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="9" />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.5 9a2.5 2.5 0 113.5 2.3c-.7.4-1 .8-1 1.7M12 17h.01"
          />
        </svg>
        Help
      </button>
      <button
        class="flex items-center gap-3 text-sm text-gray-500 transition hover:text-gray-900"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 7h16M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 11h6"
          />
        </svg>
        Archive
      </button>
    </div>
  </aside>
</template>
