<script setup lang="ts">
const API = useRuntimeConfig().public.apiBase;

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

const MODE_META: Record<TimerMode, { label: string; color: string; ring: string; bg: string }> = {
  focus: { label: "Focus",       color: "text-emerald-500", ring: "#10b981", bg: "from-emerald-50/60 to-transparent" },
  short: { label: "Short Break", color: "text-sky-500",     ring: "#0ea5e9", bg: "from-sky-50/60 to-transparent"     },
  long:  { label: "Long Break",  color: "text-violet-500",  ring: "#8b5cf6", bg: "from-violet-50/60 to-transparent"  },
};

const mode       = ref<TimerMode>("focus");
const timeLeft   = ref(DURATIONS.focus);
const timerRunning  = ref(false);
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
          if (mode.value === "focus") sessionCount.value++;
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

// ── Objective ─────────────────────────────────────────────────────────────────
interface Task { id: number; title: string; status: string; priority: string }

const objective       = ref("Deep Work: Quarterly Brand Strategy");
const editingObjective = ref(false);
const objectiveDraft  = ref("");

try {
  const tasks = await $fetch<Task[]>(`${API}/api/tasks`, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  });
  const top = (tasks ?? []).find((t) => t.status !== "completed");
  if (top?.title) objective.value = top.title;
} catch {}

// ── Session count ─────────────────────────────────────────────────────────────
const _today = new Date();
const _pad2 = (n: number) => String(n).padStart(2, "0");
const todayStr = `${_today.getFullYear()}-${_pad2(_today.getMonth() + 1)}-${_pad2(_today.getDate())}`;

interface FocusTimerRecord { id: number; status: string }

const sessionCount = ref(0);
try {
  const timers = await $fetch<FocusTimerRecord[]>(
    `${API}/api/focus-timers?date=${todayStr}&status=completed`,
    { headers: { Accept: "application/json" } }
  );
  sessionCount.value = Array.isArray(timers) ? timers.length : 0;
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

// ── Progress ring ─────────────────────────────────────────────────────────────
// SVG viewBox 120×120, circle r=52 → circumference = 2π×52 ≈ 326.73
const RING_CIRC = 326.73;
const ringOffset = computed(() =>
  RING_CIRC - (1 - timeLeft.value / DURATIONS[mode.value]) * RING_CIRC
);

const progress = computed(() => Math.round((1 - timeLeft.value / DURATIONS[mode.value]) * 100));
</script>

<template>
  <main
    class="relative flex flex-1 flex-col items-center justify-start overflow-y-auto bg-white px-4 py-10 sm:px-6"
  >
    <!-- Ambient background gradient (mode-specific) -->
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-b transition-all duration-700"
      :class="MODE_META[mode].bg"
    ></div>

    <div class="relative z-10 flex w-full max-w-md flex-col items-center">

      <!-- Mode tabs -->
      <div class="flex items-center gap-1 rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
        <button
          v-for="m in (['focus', 'short', 'long'] as TimerMode[])"
          :key="m"
          @click="selectMode(m)"
          class="rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200"
          :class="
            mode === m
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-700'
          "
          :disabled="timerRunning"
        >
          {{ MODE_META[m].label }}
        </button>
      </div>

      <!-- Timer ring + display -->
      <div class="relative mt-12 flex items-center justify-center">
        <!-- Track ring -->
        <svg class="absolute h-64 w-64 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="#f1f5f9"
            stroke-width="6"
          />
          <!-- Progress ring -->
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            :stroke="MODE_META[mode].ring"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="RING_CIRC"
            :stroke-dashoffset="ringOffset"
            class="transition-all duration-1000"
          />
        </svg>

        <!-- Inner circle -->
        <div class="relative flex h-52 w-52 flex-col items-center justify-center rounded-full bg-white shadow-inner">
          <p
            class="select-none text-[68px] font-extrabold leading-none tracking-tight text-gray-900"
            style="font-variant-numeric: tabular-nums"
          >
            {{ formattedTime }}
          </p>
          <p class="mt-1 text-xs font-bold tracking-[0.2em]" :class="MODE_META[mode].color">
            {{ MOTIVATIONS[mode] }}
          </p>
        </div>
      </div>

      <!-- Progress label -->
      <div class="mt-4 flex items-center gap-2">
        <div class="h-1 w-32 overflow-hidden rounded-full bg-gray-100">
          <div
            class="h-full rounded-full transition-all duration-1000"
            :style="{ width: `${progress}%`, backgroundColor: MODE_META[mode].ring }"
          ></div>
        </div>
        <span class="text-xs font-medium text-gray-400">{{ progress }}%</span>
      </div>

      <!-- Controls -->
      <div class="mt-10 flex items-center gap-4">
        <!-- Reset -->
        <button
          @click="resetTimer"
          class="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 active:scale-95"
          aria-label="Reset"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M5 9a7 7 0 0111-3l3 3M19 15a7 7 0 01-11 3l-3-3" />
          </svg>
        </button>

        <!-- Start / Pause -->
        <button
          @click="timerRunning ? stopTimer() : startTimer()"
          class="flex h-14 items-center justify-center gap-3 rounded-2xl px-10 text-sm font-bold tracking-widest text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
          :class="timerRunning ? 'bg-rose-500 hover:bg-rose-600' : 'bg-gray-900 hover:bg-gray-800'"
        >
          <svg v-if="!timerRunning" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          <svg v-else class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
          {{ timerRunning ? "PAUSE" : "START FOCUS" }}
        </button>

        <!-- Skip (cosmetic) -->
        <button
          class="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 active:scale-95"
          aria-label="Skip"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 4l15 8-15 8V4z" />
            <line x1="19" y1="4" x2="19" y2="20" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <!-- Current objective -->
      <div class="mt-12 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
        <div class="flex items-start gap-4 p-5">
          <!-- Accent bar -->
          <div class="mt-0.5 h-full w-1 shrink-0 self-stretch rounded-full" :style="{ backgroundColor: MODE_META[mode].ring }"></div>

          <div class="flex-1 min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
              Current Objective
            </p>
            <p v-if="!editingObjective" class="mt-1.5 text-sm font-semibold leading-snug text-gray-900">
              {{ objective }}
            </p>
            <input
              v-else
              v-model="objectiveDraft"
              type="text"
              @keydown.enter="saveObjective"
              @keydown.escape="editingObjective = false"
              class="mt-1.5 w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
              autofocus
            />
          </div>

          <button
            v-if="!editingObjective"
            @click="startEditObjective"
            class="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Edit objective"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
            </svg>
          </button>
          <button
            v-else
            @click="saveObjective"
            class="shrink-0 rounded-lg p-1.5 text-emerald-500 transition hover:bg-emerald-50"
            aria-label="Save"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Session hint -->
      <div class="mt-5 flex items-center gap-6 text-center">
        <div class="text-center">
          <p class="text-2xl font-extrabold text-gray-900">{{ sessionCount }}</p>
          <p class="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Session</p>
        </div>
        <div class="h-8 w-px bg-gray-100"></div>
        <div class="text-center">
          <p class="text-2xl font-extrabold text-gray-900">{{ Math.floor(DURATIONS[mode] / 60) }}m</p>
          <p class="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Duration</p>
        </div>
        <div class="h-8 w-px bg-gray-100"></div>
        <div class="text-center">
          <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Mode</p>
          <p class="mt-0.5 text-sm font-bold" :class="MODE_META[mode].color">
            {{ mode === 'focus' ? 'Deep Work' : mode === 'short' ? 'Short Rest' : 'Full Rest' }}
          </p>
        </div>
      </div>

    </div>
  </main>
</template>
