<script setup lang="ts">
const API = "http://127.0.0.1:8000";

// ── Timer modes ───────────────────────────────────────────────────────────────
type TimerMode = "focus" | "short" | "long";

const DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short:  5 * 60,
  long:  15 * 60,
};

const MOTIVATIONS: Record<TimerMode, string> = {
  focus: "STAY GROUNDED",
  short: "TAKE A BREATH",
  long:  "REST & RECOVER",
};

const mode = ref<TimerMode>("focus");
const timeLeft = ref(DURATIONS.focus);
const timerRunning = ref(false);
const activeTimerId = ref<number | null>(null);
let timerInterval: ReturnType<typeof setInterval> | null = null;

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60).toString().padStart(2, "0");
  const s = (timeLeft.value % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
});

function selectMode(m: TimerMode) {
  if (timerRunning.value) return;
  mode.value = m;
  timeLeft.value = DURATIONS[m];
}

async function startTimer() {
  if (timerRunning.value) return;
  if (mode.value === "focus") {
    try {
      const timer = await $fetch<{ id: number }>(`${API}/api/focus-timers/start`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: { duration: Math.floor(DURATIONS[mode.value] / 60) },
      });
      activeTimerId.value = timer.id;
    } catch {}
  }

  timerRunning.value = true;
  timerInterval = setInterval(async () => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval!);
      timerRunning.value = false;
      if (activeTimerId.value !== null) {
        try {
          await $fetch(`${API}/api/focus-timers/${activeTimerId.value}/complete`, {
            method: "PUT",
            headers: { Accept: "application/json" },
          });
        } catch {}
        activeTimerId.value = null;
      }
      timeLeft.value = DURATIONS[mode.value];
    }
  }, 1000);
}

async function stopTimer() {
  if (!timerRunning.value) return;
  clearInterval(timerInterval!);
  timerRunning.value = false;
  if (activeTimerId.value !== null) {
    try {
      await $fetch(`${API}/api/focus-timers/${activeTimerId.value}/stop`, {
        method: "PUT",
        headers: { Accept: "application/json" },
      });
    } catch {}
    activeTimerId.value = null;
  }
}

async function resetTimer() {
  await stopTimer();
  timeLeft.value = DURATIONS[mode.value];
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

// ── Current objective ─────────────────────────────────────────────────────────
interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
}

const objective = ref("Deep Work: Quarterly Brand Strategy");
const editingObjective = ref(false);
const objectiveDraft = ref("");

try {
  const tasks = await $fetch<Task[]>(`${API}/api/tasks`, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  });
  const top = (tasks ?? []).find((t) => t.status !== "completed");
  if (top?.title) objective.value = top.title;
} catch {}

function startEditObjective() {
  objectiveDraft.value = objective.value;
  editingObjective.value = true;
}

function saveObjective() {
  const trimmed = objectiveDraft.value.trim();
  if (trimmed) objective.value = trimmed;
  editingObjective.value = false;
}

// ── Progress ring (SVG) ───────────────────────────────────────────────────────
// circle r=54 → circumference ≈ 339.3
const RING_CIRC = 339.3;
const ringOffset = computed(() =>
  RING_CIRC - (1 - timeLeft.value / DURATIONS[mode.value]) * RING_CIRC
);

const modeTabClass = (m: TimerMode) =>
  mode.value === m
    ? "text-gray-900 font-semibold border-b-2 border-gray-900 pb-0.5"
    : "text-gray-400 hover:text-gray-600 transition";
</script>

<template>
  <main class="flex flex-1 flex-col items-center justify-center bg-white px-6 py-10">

    <!-- Mode tabs ─────────────────────────────────────────────────────────── -->
    <div class="flex items-center gap-8 text-sm">
      <button @click="selectMode('focus')" :class="modeTabClass('focus')">
        Focus
      </button>
      <button @click="selectMode('short')" :class="modeTabClass('short')">
        Short Break
      </button>
      <button @click="selectMode('long')" :class="modeTabClass('long')">
        Long Break
      </button>
    </div>

    <!-- Timer ─────────────────────────────────────────────────────────────── -->
    <div class="relative mt-14 flex items-center justify-center">
      <!-- Subtle ring -->
      <svg class="absolute h-64 w-64 -rotate-90 opacity-10" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#111827" stroke-width="3" />
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke="#111827"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="RING_CIRC"
          :stroke-dashoffset="ringOffset"
          class="transition-all duration-1000"
        />
      </svg>

      <!-- Time display -->
      <p class="relative text-[80px] font-extrabold tracking-tight text-gray-900 leading-none select-none"
         style="font-family: 'Georgia', serif;">
        {{ formattedTime }}
      </p>
    </div>

    <!-- Motivation ────────────────────────────────────────────────────────── -->
    <p class="mt-5 text-xs font-bold tracking-[0.3em] text-emerald-500">
      {{ MOTIVATIONS[mode] }}
    </p>

    <!-- Controls ──────────────────────────────────────────────────────────── -->
    <div class="mt-10 flex items-center gap-5">
      <!-- Reset -->
      <button
        @click="resetTimer"
        class="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
        aria-label="Reset timer"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M4 4v5h5M20 20v-5h-5M5 9a7 7 0 0111-3l3 3M19 15a7 7 0 01-11 3l-3-3" />
        </svg>
      </button>

      <!-- Start / Pause -->
      <button
        @click="timerRunning ? stopTimer() : startTimer()"
        class="flex h-14 items-center justify-center rounded-full bg-gray-900 px-12 text-sm font-bold tracking-widest text-white transition hover:bg-gray-700"
      >
        {{ timerRunning ? "PAUSE" : "START FOCUS" }}
      </button>

      <!-- More options -->
      <button
        class="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
        aria-label="More options"
      >
        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>
    </div>

    <!-- Current objective ──────────────────────────────────────────────────── -->
    <div class="mt-14 w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div class="flex items-center justify-between gap-4 px-5 py-4">
        <!-- Left accent bar + content -->
        <div class="flex items-start gap-4">
          <span class="mt-0.5 h-full w-1 shrink-0 self-stretch rounded-full bg-emerald-500"></span>
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
              Current Objective
            </p>
            <p v-if="!editingObjective" class="mt-1 text-sm font-semibold text-gray-900">
              {{ objective }}
            </p>
            <input
              v-else
              v-model="objectiveDraft"
              type="text"
              @keydown.enter="saveObjective"
              @keydown.escape="editingObjective = false"
              class="mt-1 w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
              autofocus
            />
          </div>
        </div>

        <!-- Edit / Save icon -->
        <button
          v-if="!editingObjective"
          @click="startEditObjective"
          class="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Edit objective"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
          </svg>
        </button>
        <button
          v-else
          @click="saveObjective"
          class="shrink-0 rounded-lg p-1.5 text-emerald-500 transition hover:bg-emerald-50"
          aria-label="Save objective"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Session count hint ─────────────────────────────────────────────────── -->
    <p class="mt-6 text-xs text-gray-400">
      {{ mode === 'focus' ? '#1 focus session' : mode === 'short' ? 'Short break' : 'Long break · take it easy' }}
    </p>

  </main>
</template>
