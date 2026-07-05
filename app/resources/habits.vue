<script setup lang="ts">
const API = useRuntimeConfig().public.apiBase;

interface ApiHabit {
  id: number;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  goal: string | null;
  category_color: string | null;
  created_at: string;
  updated_at: string;
}

interface ColorTheme {
  bg: string; icon: string; name: string; check: string; badge: string;
  ringStroke: string; activeBg: string;
}

const COLOR_MAP: Record<string, ColorTheme> = {
  blue:    { bg: "bg-blue-100",    icon: "text-blue-500",    name: "text-blue-700",    check: "bg-blue-500",    badge: "bg-blue-50 text-blue-600 border-blue-200",    ringStroke: "#3b82f6", activeBg: "bg-blue-500"    },
  emerald: { bg: "bg-emerald-100", icon: "text-emerald-500", name: "text-emerald-700", check: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-600 border-emerald-200", ringStroke: "#10b981", activeBg: "bg-emerald-500" },
  green:   { bg: "bg-emerald-100", icon: "text-emerald-500", name: "text-emerald-700", check: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-600 border-emerald-200", ringStroke: "#10b981", activeBg: "bg-emerald-500" },
  rose:    { bg: "bg-rose-100",    icon: "text-rose-500",    name: "text-rose-700",    check: "bg-rose-500",    badge: "bg-rose-50 text-rose-600 border-rose-200",       ringStroke: "#f43f5e", activeBg: "bg-rose-500"    },
  red:     { bg: "bg-rose-100",    icon: "text-rose-500",    name: "text-rose-700",    check: "bg-rose-500",    badge: "bg-rose-50 text-rose-600 border-rose-200",       ringStroke: "#f43f5e", activeBg: "bg-rose-500"    },
  amber:   { bg: "bg-amber-100",   icon: "text-amber-500",   name: "text-amber-700",   check: "bg-amber-500",   badge: "bg-amber-50 text-amber-600 border-amber-200",    ringStroke: "#f59e0b", activeBg: "bg-amber-500"   },
  yellow:  { bg: "bg-amber-100",   icon: "text-amber-500",   name: "text-amber-700",   check: "bg-amber-500",   badge: "bg-amber-50 text-amber-600 border-amber-200",    ringStroke: "#f59e0b", activeBg: "bg-amber-500"   },
  violet:  { bg: "bg-violet-100",  icon: "text-violet-500",  name: "text-violet-700",  check: "bg-violet-500",  badge: "bg-violet-50 text-violet-600 border-violet-200", ringStroke: "#8b5cf6", activeBg: "bg-violet-500"  },
  purple:  { bg: "bg-violet-100",  icon: "text-violet-500",  name: "text-violet-700",  check: "bg-violet-500",  badge: "bg-violet-50 text-violet-600 border-violet-200", ringStroke: "#8b5cf6", activeBg: "bg-violet-500"  },
};

const DEFAULT_COLORS: ColorTheme[] = [
  COLOR_MAP.blue!, COLOR_MAP.emerald!, COLOR_MAP.rose!, COLOR_MAP.amber!, COLOR_MAP.violet!,
];

const ICONS: Record<string, string> = {
  daily:   "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  weekly:  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  monthly: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
};

const _now = new Date();
const _pad = (n: number) => String(n).padStart(2, "0");
const todayStr = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getWeekDates(): string[] {
  const d = new Date(_now);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const w = new Date(d);
    w.setDate(d.getDate() + i);
    return `${w.getFullYear()}-${_pad(w.getMonth() + 1)}-${_pad(w.getDate())}`;
  });
}

const WEEK_DATES = getWeekDates();

function colorFor(h: ApiHabit, idx: number): ColorTheme {
  const key = (h.category_color ?? "").toLowerCase();
  return COLOR_MAP[key] ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length] ?? DEFAULT_COLORS[0]!;
}

interface HabitLogsResp   { habit_id: number; logs: string[] }
interface HabitStreakResp { habit_id: number; current_streak: number; longest_streak: number }

const habitLogsMap   = ref<Record<number, string[]>>({});
const habitStreakMap = ref<Record<number, number>>({});

async function fetchHabitExtras(list: ApiHabit[]) {
  await Promise.all(
    list.map(async (h) => {
      try {
        const [logsResp, streakResp] = await Promise.all([
          $fetch<HabitLogsResp>(`${API}/api/habits/${h.id}/logs`, { headers: { Accept: "application/json" } }),
          $fetch<HabitStreakResp>(`${API}/api/habits/${h.id}/streak`, { headers: { Accept: "application/json" } }),
        ]);
        habitLogsMap.value[h.id]   = logsResp.logs ?? [];
        habitStreakMap.value[h.id] = streakResp.current_streak ?? 0;
      } catch {
        habitLogsMap.value[h.id]   = [];
        habitStreakMap.value[h.id] = 0;
      }
    })
  );
}

const { data: apiHabits, refresh } = await useFetch<ApiHabit[]>(`${API}/api/habits`, {
  headers: { Accept: "application/json" },
});

if (apiHabits.value?.length) await fetchHabitExtras(apiHabits.value);

const habits = computed(() =>
  (apiHabits.value ?? []).map((h, i) => {
    const logs   = new Set(habitLogsMap.value[h.id] ?? []);
    const grid   = WEEK_DATES.map((d) => (logs.has(d) ? 1 : 0));
    const streak = habitStreakMap.value[h.id] ?? 0;
    return { ...h, color: colorFor(h, i), icon: ICONS[h.frequency] ?? ICONS.daily!, active: logs.has(todayStr), grid, streak };
  })
);

watch(apiHabits, async (newList) => {
  if (newList?.length) await fetchHabitExtras(newList);
});

async function logHabit(id: number) {
  try {
    await $fetch(`${API}/api/habits/${id}/log`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: { logged_date: todayStr },
    });
    const habit = apiHabits.value?.find((h) => h.id === id);
    if (habit) await fetchHabitExtras([habit]);
  } catch {}
}

// ── Create ────────────────────────────────────────────────────────────────────
const showCreate = ref(false);
const createForm = ref({ name: "", frequency: "daily" as "daily" | "weekly" | "monthly", goal: "", category_color: "" });
const createError = ref("");

async function createHabit() {
  if (!createForm.value.name.trim()) { createError.value = "Name is required."; return; }
  createError.value = "";
  try {
    await $fetch(`${API}/api/habits`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: { name: createForm.value.name.trim(), frequency: createForm.value.frequency, goal: createForm.value.goal.trim() || "", category_color: createForm.value.category_color.trim() || "" },
    });
    createForm.value = { name: "", frequency: "daily", goal: "", category_color: "" };
    showCreate.value = false;
    await refresh();
  } catch (e: any) { createError.value = e?.data?.message ?? "Failed to create habit."; }
}

// ── Edit ──────────────────────────────────────────────────────────────────────
const editingHabit = ref<ApiHabit | null>(null);
const editForm = ref({ name: "", frequency: "daily" as "daily" | "weekly" | "monthly", goal: "", category_color: "" });
const editError = ref("");

function openEdit(h: ApiHabit) {
  editingHabit.value = h;
  editForm.value = { name: h.name, frequency: h.frequency, goal: h.goal ?? "", category_color: h.category_color ?? "" };
  editError.value = "";
}
function closeEdit() { editingHabit.value = null; }

async function saveEdit() {
  if (!editingHabit.value) return;
  if (!editForm.value.name.trim()) { editError.value = "Name is required."; return; }
  editError.value = "";
  try {
    await $fetch(`${API}/api/habits/${editingHabit.value.id}`, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: { name: editForm.value.name.trim(), frequency: editForm.value.frequency, goal: editForm.value.goal.trim() || "", category_color: editForm.value.category_color.trim() || "" },
    });
    closeEdit();
    await refresh();
  } catch (e: any) { editError.value = e?.data?.message ?? "Failed to update habit."; }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteHabit(id: number) {
  try {
    await $fetch(`${API}/api/habits/${id}`, { method: "DELETE", headers: { Accept: "application/json" } });
    delete habitLogsMap.value[id];
    delete habitStreakMap.value[id];
    await refresh();
  } catch {}
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const avgStreak = computed(() => {
  if (!habits.value.length) return 0;
  return Math.round(habits.value.reduce((s, h) => s + h.streak, 0) / habits.value.length);
});

const todayCompleted = computed(() => habits.value.filter((h) => h.active).length);
const efficiency = computed(() => {
  if (!habits.value.length) return 0;
  return Math.round((todayCompleted.value / habits.value.length) * 100);
});

const RING_CIRC = 87.96;
const ringOffset = computed(() => RING_CIRC - (efficiency.value / 100) * RING_CIRC);

const TREND_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface FocusTrendDay { date: string; day: string; score: number; focus_minutes: number; completed_tasks: number }
interface FocusTrendResp { period: string; data: FocusTrendDay[] }

const trendLastWeek = ref<number[]>([0, 0, 0, 0, 0, 0, 0]);
const trendThisWeek = ref<number[]>([0, 0, 0, 0, 0, 0, 0]);

async function fetchFocusTrend() {
  try {
    const resp = await $fetch<FocusTrendResp>(`${API}/api/focus-trend`, {
      headers: { Accept: "application/json" },
    });
    const scores = (resp?.data ?? []).map((d) => d.score);
    trendLastWeek.value = scores.slice(0, 7);
    trendThisWeek.value = scores.slice(7, 14);
  } catch {}
}
await fetchFocusTrend();

const frequencyOptions: Array<"daily" | "weekly" | "monthly"> = ["daily", "weekly", "monthly"];
const colorOptions = ["blue", "emerald", "rose", "amber", "violet"] as const;

const colorSwatch: Record<string, string> = {
  blue: "bg-blue-400", emerald: "bg-emerald-400", rose: "bg-rose-400", amber: "bg-amber-400", violet: "bg-violet-400",
};
const colorBorder: Record<string, string> = {
  blue: "ring-blue-500", emerald: "ring-emerald-500", rose: "ring-rose-500", amber: "ring-amber-500", violet: "ring-violet-500",
};
</script>

<template>
  <main class="flex-1 overflow-y-auto bg-slate-50 px-4 py-6 sm:px-6">
    <div class="mx-auto max-w-4xl space-y-6">

      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">Habit Tracker</h1>
          <p class="mt-1 text-sm text-gray-500">Build discipline through consistent daily actions.</p>
        </div>
        <button
          @click="showCreate = true"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 active:scale-95 sm:w-auto"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Habit
        </button>
      </div>

      <!-- ── Stats grid ──────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <!-- Total habits -->
        <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Total</p>
          <p class="mt-2 text-3xl font-extrabold text-gray-900">{{ String(habits.length).padStart(2, '0') }}</p>
          <p class="mt-0.5 text-xs text-gray-400">Habits</p>
        </div>
        <!-- Today done -->
        <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Today</p>
          <p class="mt-2 text-3xl font-extrabold text-emerald-600">{{ todayCompleted }}</p>
          <p class="mt-0.5 text-xs text-gray-400">Completed</p>
        </div>
        <!-- Avg streak -->
        <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Streak</p>
          <p class="mt-2 text-3xl font-extrabold text-gray-900">{{ avgStreak > 0 ? String(avgStreak).padStart(2, '0') : '—' }}</p>
          <p class="mt-0.5 text-xs text-gray-400">Day avg</p>
        </div>
        <!-- Efficiency ring -->
        <div class="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Today</p>
            <p class="mt-2 text-3xl font-extrabold text-gray-900">{{ efficiency }}%</p>
            <p class="mt-0.5 text-xs text-gray-400">Rate</p>
          </div>
          <svg class="ml-auto h-14 w-14 shrink-0 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" stroke-width="3" />
            <circle
              cx="18" cy="18" r="14"
              fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"
              :stroke-dasharray="RING_CIRC"
              :stroke-dashoffset="ringOffset"
              class="transition-all duration-700"
            />
          </svg>
        </div>
      </div>

      <!-- ── Active Habits ───────────────────────────────────────────────── -->
      <div>
        <div class="mb-4 flex items-center justify-between">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Active Habits</p>
          <span v-if="habits.length" class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500">
            {{ habits.length }}
          </span>
        </div>

        <!-- Empty state -->
        <div
          v-if="habits.length === 0"
          class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center"
        >
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
            <svg class="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p class="text-base font-semibold text-gray-700">No habits yet</p>
          <p class="mt-1 max-w-xs text-sm text-gray-400">Start building your routine by adding your first daily habit.</p>
          <button
            @click="showCreate = true"
            class="mt-5 flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 active:scale-95"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add your first habit
          </button>
        </div>

        <!-- Habit cards -->
        <div v-else class="space-y-3">
          <div
            v-for="(habit, idx) in habits"
            :key="habit.id"
            class="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <!-- Top accent -->
            <div class="h-0.5 w-full" :class="habit.color.activeBg"></div>

            <div class="p-4 sm:p-5">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                <!-- Icon + info -->
                <div class="flex items-center gap-3">
                  <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" :class="habit.color.bg">
                    <svg class="h-5 w-5" :class="habit.color.icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" :d="habit.icon" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-bold text-gray-900">{{ habit.name }}</p>
                    <div class="mt-0.5 flex items-center gap-2">
                      <span class="rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize" :class="habit.color.badge">
                        {{ habit.frequency }}
                      </span>
                      <span v-if="habit.goal" class="text-xs text-gray-400">{{ habit.goal }}</span>
                    </div>
                  </div>
                </div>

                <!-- 7-day grid -->
                <div class="flex flex-1 items-center gap-1 sm:justify-center">
                  <div
                    v-for="(done, i) in habit.grid"
                    :key="i"
                    class="flex flex-col items-center gap-1"
                  >
                    <div
                      class="flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150 sm:h-8 sm:w-8"
                      :class="done ? habit.color.check + ' shadow-sm' : 'bg-gray-100'"
                    >
                      <svg v-if="done" class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span class="text-[9px] font-medium text-gray-300">{{ DAY_LABELS[i] }}</span>
                  </div>
                </div>

                <!-- Streak + actions -->
                <div class="flex items-center justify-between gap-4 sm:justify-end">
                  <div class="text-right">
                    <p class="text-2xl font-extrabold text-gray-900 sm:text-3xl">{{ String(habit.streak).padStart(2, '0') }}</p>
                    <p class="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">Day Streak</p>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <!-- Check off -->
                    <button
                      @click="logHabit(habit.id)"
                      class="flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-all duration-150 active:scale-90"
                      :class="habit.active ? habit.color.check + ' border-transparent text-white' : 'border-gray-200 bg-white text-gray-300 hover:border-gray-300'"
                      :aria-label="`Mark ${habit.name}`"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <!-- Edit -->
                    <button
                      @click="openEdit(habit)"
                      class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
                      aria-label="Edit"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" />
                      </svg>
                    </button>
                    <!-- Delete -->
                    <button
                      @click="deleteHabit(habit.id)"
                      class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                      aria-label="Delete"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Add action row -->
          <button
            @click="showCreate = true"
            class="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-4 text-sm font-medium text-gray-400 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 active:scale-98"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Habit
          </button>
        </div>
      </div>

      <!-- ── Focus Trend ──────────────────────────────────────────────────── -->
      <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 class="font-bold text-gray-900">Focus Trend</h3>
            <p class="mt-0.5 text-xs text-gray-400">Mental clarity over the past 14 days.</p>
          </div>
          <div class="flex items-center gap-4 text-xs text-gray-400">
            <span class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full bg-gray-800"></span>This week
            </span>
            <span class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full bg-gray-300"></span>Last week
            </span>
          </div>
        </div>

        <div class="flex h-32 items-end gap-3 sm:h-36">
          <div class="flex flex-1 items-end gap-1 sm:gap-1.5">
            <div v-for="(bar, i) in trendLastWeek" :key="'lw'+i" class="flex flex-1 flex-col items-center gap-1.5">
              <div class="w-full rounded-t-md bg-gray-200 transition-all duration-500" :style="{ height: `${bar}%` }"></div>
              <span class="text-[9px] font-medium text-gray-300">{{ TREND_DAYS[i] }}</span>
            </div>
          </div>
          <div class="w-px shrink-0 self-stretch bg-gray-100"></div>
          <div class="flex flex-1 items-end gap-1 sm:gap-1.5">
            <div v-for="(bar, i) in trendThisWeek" :key="'tw'+i" class="flex flex-1 flex-col items-center gap-1.5">
              <div class="w-full rounded-t-md bg-gray-900 transition-all duration-500" :style="{ height: `${bar}%` }"></div>
              <span class="text-[9px] font-medium text-gray-400">{{ TREND_DAYS[i] }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>

  <!-- ── Create Modal ─────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="ff-modal">
      <div
        v-if="showCreate"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
        @click.self="showCreate = false"
      >
        <div class="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-900">New Habit</h3>
            <button @click="showCreate = false" class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p v-if="createError" class="mb-4 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">{{ createError }}</p>

          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-500">Name <span class="text-rose-400">*</span></label>
              <input v-model="createForm.name" type="text" placeholder="e.g. Drink 3 Liters of Water"
                class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-500">Frequency</label>
              <div class="flex gap-2">
                <button v-for="opt in frequencyOptions" :key="opt" type="button" @click="createForm.frequency = opt"
                  class="flex-1 rounded-xl border py-2.5 text-xs font-semibold capitalize transition"
                  :class="createForm.frequency === opt ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50'">
                  {{ opt }}
                </button>
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-500">Goal <span class="text-gray-300">(optional)</span></label>
              <input v-model="createForm.goal" type="text" placeholder="e.g. 3 Liters / Day"
                class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
            </div>
            <div>
              <label class="mb-2 block text-xs font-semibold text-gray-500">Color Theme</label>
              <div class="flex gap-3">
                <button v-for="c in colorOptions" :key="c" type="button" @click="createForm.category_color = c"
                  class="h-9 w-9 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ring-offset-2"
                  :class="[colorSwatch[c], createForm.category_color === c ? 'ring-2 ' + colorBorder[c] : '']">
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button type="button" @click="showCreate = false"
              class="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50">
              Cancel
            </button>
            <button type="button" @click="createHabit"
              class="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 active:scale-95">
              Create Habit
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Edit Modal ───────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="ff-modal">
      <div
        v-if="editingHabit"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
        @click.self="closeEdit"
      >
        <div class="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-900">Edit Habit</h3>
            <button @click="closeEdit" class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p v-if="editError" class="mb-4 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">{{ editError }}</p>

          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-500">Name <span class="text-rose-400">*</span></label>
              <input v-model="editForm.name" type="text"
                class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-500">Frequency</label>
              <div class="flex gap-2">
                <button v-for="opt in frequencyOptions" :key="opt" type="button" @click="editForm.frequency = opt"
                  class="flex-1 rounded-xl border py-2.5 text-xs font-semibold capitalize transition"
                  :class="editForm.frequency === opt ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50'">
                  {{ opt }}
                </button>
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-500">Goal</label>
              <input v-model="editForm.goal" type="text"
                class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
            </div>
            <div>
              <label class="mb-2 block text-xs font-semibold text-gray-500">Color Theme</label>
              <div class="flex gap-3">
                <button v-for="c in colorOptions" :key="c" type="button" @click="editForm.category_color = c"
                  class="h-9 w-9 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ring-offset-2"
                  :class="[colorSwatch[c], editForm.category_color === c ? 'ring-2 ' + colorBorder[c] : '']">
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button type="button" @click="closeEdit"
              class="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50">
              Cancel
            </button>
            <button type="button" @click="saveEdit"
              class="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 active:scale-95">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ff-modal-enter-active,
.ff-modal-leave-active {
  transition: all 0.25s ease;
}
.ff-modal-enter-from,
.ff-modal-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
