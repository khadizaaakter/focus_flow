<script setup lang="ts">
interface Habit {
  id: number
  name: string
  description: string
  streak: number
  color: string
  bg: string
  border: string
  text: string
  heatBg: string
  icon: string
  active: boolean
  grid: number[]
}

const habits = ref<Habit[]>([
  {
    id: 1,
    name: 'Hydration',
    description: 'Drink 2L filtered water daily',
    streak: 14,
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    text: 'text-blue-600',
    heatBg: 'bg-blue-400',
    icon: 'M12 2C8 2 5 5.6 5 10c0 5.2 7 12 7 12s7-6.8 7-12c0-4.4-3-8-7-8zm0 10.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 7.5 12 7.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z',
    active: false,
    grid: [1,1,1,0,1,1,1, 1,0,1,1,1,0,1, 0,1,1,1,1,1,0, 1,1,0,1,1,1,1, 1,1,1,1,0,1,1],
  },
  {
    id: 2,
    name: 'Reading',
    description: 'Read 30 pages of learning',
    streak: 5,
    color: 'emerald',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    text: 'text-emerald-600',
    heatBg: 'bg-emerald-400',
    icon: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5a2 2 0 012-2h14a2 2 0 012 2v12M4 19.5V21',
    active: true,
    grid: [0,1,0,1,1,0,1, 1,1,0,0,1,1,0, 0,0,1,1,0,1,1, 1,0,1,0,1,0,1, 0,1,1,1,0,0,1],
  },
  {
    id: 3,
    name: 'Exercise',
    description: 'Exercise high intensity',
    streak: 12,
    color: 'rose',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    text: 'text-rose-600',
    heatBg: 'bg-rose-400',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    active: false,
    grid: [1,0,1,1,0,1,1, 0,1,1,0,1,0,1, 1,1,0,1,1,1,0, 0,1,1,1,0,1,1, 1,0,1,0,1,1,0],
  },
])

const peakDays = 12
const completionRate = 94

const focusGoalMins = 1000
const focusEarned = 720

const focusPercent = Math.round((focusEarned / focusGoalMins) * 100)

const trendBars = [40, 65, 50, 80, 55, 90, 70]
const trendDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
</script>

<template>
  <main class="flex-1 overflow-y-auto bg-gray-50 px-8 py-7">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Habit Forge</h2>
        <p class="mt-1 text-sm text-gray-400">Discipleship is the bridge between goals and accomplishment</p>
      </div>
      <div class="flex gap-2">
        <button class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-500 shadow-sm transition hover:bg-gray-50">
          Share
        </button>
        <button class="rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-700">
          + Add New
        </button>
      </div>
    </div>

    <!-- Top stats row -->
    <div class="mb-6 grid grid-cols-3 gap-4">
      <!-- Peak Performance -->
      <div class="col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">Peak Performance</p>
        <div class="mt-3 flex items-end gap-8">
          <div>
            <p class="text-[11px] text-gray-400">Current Streak</p>
            <p class="text-4xl font-extrabold text-gray-900">{{ peakDays }} <span class="text-base font-semibold text-gray-400">Days</span></p>
          </div>
          <div>
            <p class="text-[11px] text-gray-400">Completion Rate</p>
            <p class="text-4xl font-extrabold text-gray-900">{{ completionRate }}<span class="text-base font-semibold text-gray-400">%</span></p>
          </div>
        </div>
      </div>

      <!-- Focus Goal -->
      <div class="rounded-2xl bg-gray-900 p-5 text-white shadow-sm">
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Focus Goal</p>
        <p class="mt-2 text-2xl font-extrabold">{{ focusGoalMins.toLocaleString() }} <span class="text-sm font-medium text-gray-400">mins</span></p>
        <div class="mt-3">
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              class="h-full rounded-full bg-emerald-400 transition-all"
              :style="{ width: `${focusPercent}%` }"
            ></div>
          </div>
          <p class="mt-1.5 text-[11px] text-gray-400">{{ focusEarned }} / {{ focusGoalMins }} mins earned</p>
        </div>
      </div>
    </div>

    <!-- Habit cards -->
    <div class="mb-6 space-y-4">
      <div
        v-for="habit in habits"
        :key="habit.id"
        class="flex items-center gap-5 rounded-2xl border bg-white p-5 shadow-sm"
        :class="habit.border"
      >
        <!-- Icon -->
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          :class="habit.bg"
        >
          <svg class="h-5 w-5" :class="habit.text" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :d="habit.icon" />
          </svg>
        </div>

        <!-- Info -->
        <div class="w-40 shrink-0">
          <p class="font-bold text-gray-900">{{ habit.name }}</p>
          <p class="mt-0.5 text-xs text-gray-400">{{ habit.description }}</p>
          <span
            class="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
            :class="[habit.bg, habit.text]"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="habit.heatBg"></span>
            {{ habit.streak }} Day Streak
          </span>
        </div>

        <!-- Heatmap grid -->
        <div class="flex flex-1 justify-center">
          <div class="grid grid-cols-7 gap-1">
            <div
              v-for="(val, i) in habit.grid"
              :key="i"
              class="h-5 w-5 rounded-sm transition"
              :class="val ? habit.heatBg : 'bg-gray-100'"
            ></div>
          </div>
        </div>

        <!-- Toggle button -->
        <button
          @click="habit.active = !habit.active"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition"
          :class="habit.active
            ? [habit.heatBg, 'border-transparent text-white']
            : 'border-gray-200 bg-white text-gray-300 hover:border-gray-300'"
          :aria-label="`Toggle ${habit.name}`"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Bottom row -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Focus Trend -->
      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-bold text-gray-900">Focus Trend</h3>
          <button class="rounded-lg bg-gray-900 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-gray-700">
            + New Project
          </button>
        </div>
        <div class="flex h-24 items-end gap-2">
          <div
            v-for="(bar, i) in trendBars"
            :key="i"
            class="flex flex-1 flex-col items-center gap-1"
          >
            <div
              class="w-full rounded-t-md bg-sky-400 transition-all"
              :style="{ height: `${bar}%` }"
            ></div>
            <span class="text-[10px] text-gray-400">{{ trendDays[i] }}</span>
          </div>
        </div>
      </div>

      <!-- Level Up -->
      <div class="relative overflow-hidden rounded-2xl bg-gray-900 p-5 text-white shadow-sm">
        <div class="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_80%_20%,#10b981_0%,transparent_60%)]"></div>
        <div class="relative">
          <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Level Up</p>
          <p class="mt-2 text-base font-bold leading-snug">
            70% of FocusFlow users<br />
            <span class="text-emerald-400">improved this week</span>
          </p>
          <p class="mt-1 text-xs text-gray-500">Keep your streak alive to climb the leaderboard.</p>
          <button class="mt-4 rounded-lg bg-emerald-400 px-4 py-2 text-xs font-bold text-gray-900 transition hover:bg-emerald-300">
            View Community Stats
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
