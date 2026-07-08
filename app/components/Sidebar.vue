<script setup lang="ts">
defineProps<{ mobileOpen: boolean }>();
defineEmits<{ close: [] }>();

const route = useRoute();

const nav = [
  { label: "Planner", icon: "tasks", path: "/tasks" },
  { label: "Habits", icon: "habits", path: "/habits" },
  { label: "Focus Room", icon: "timer", path: "/focus-room" },
  { label: "Insights", icon: "insights", path: "/insights" },
];
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-100 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:translate-x-0 lg:shadow-none"
    :class="mobileOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Brand -->
    <div class="flex shrink-0 items-center justify-between px-5 pb-4 pt-6">
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md"
        >
          <svg
            class="h-4 w-4 text-white"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <span class="text-[17px] font-bold tracking-tight text-gray-900">FocusFlow</span>
      </div>
      <button
        class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 lg:hidden"
        aria-label="Close menu"
        @click="$emit('close')"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- User card -->
    <!-- <div
      class="mx-4 mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4"
    > -->
    <!-- <div class="flex items-center gap-3">
        <div class="relative shrink-0">
          <img
            src="https://i.pravatar.cc/80?img=12"
            alt="Alex Rivera"
            class="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
          />
          <span
            class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-900 bg-emerald-400"
          ></span>
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-white">Alex Rivera</p>
        </div>
      </div> -->
    <!-- </div> -->

    <!-- Navigation -->
    <nav class="flex-1 space-y-0.5 overflow-y-auto px-3">
      <NuxtLink
        v-for="item in nav"
        :key="item.label"
        :to="item.path"
        class="group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
        :class="
          route.path === item.path
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        "
        @click="$emit('close')"
      >
        <!-- Active bar -->
        <span
          class="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full transition-all duration-200"
          :class="route.path === item.path ? 'bg-emerald-500 opacity-100' : 'opacity-0'"
        ></span>

        <!-- Icon -->
        <svg
          class="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110"
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
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </template>
          <template v-else-if="item.icon === 'timer'">
            <circle cx="12" cy="13" r="8" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4l2 2M9 3h6" />
          </template>
          <template v-else>
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 19V5m5 14V9m5 10V13m5 6V7"
            />
          </template>
        </svg>

        <span class="flex-1">{{ item.label }}</span>

        <span
          v-if="item.badge"
          class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400"
          >{{ item.badge }}</span
        >
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="shrink-0 space-y-0.5 border-t border-gray-100 p-3">
      <button
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
      >
        <svg
          class="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Settings
      </button>
    </div>
  </aside>
</template>
