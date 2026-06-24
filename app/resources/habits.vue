<script setup lang="ts">
const API = "http://127.0.0.1:8000";

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
  bg: string;
  icon: string;
  name: string;
  check: string;
  badge: string;
}

const COLOR_MAP: Record<string, ColorTheme> = {
  blue:    { bg: "bg-blue-100",    icon: "text-blue-500",    name: "text-blue-700",    check: "bg-blue-400",    badge: "bg-blue-50 text-blue-600 border-blue-200" },
  emerald: { bg: "bg-emerald-100", icon: "text-emerald-500", name: "text-emerald-700", check: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  green:   { bg: "bg-emerald-100", icon: "text-emerald-500", name: "text-emerald-700", check: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  rose:    { bg: "bg-rose-100",    icon: "text-rose-500",    name: "text-rose-700",    check: "bg-rose-400",    badge: "bg-rose-50 text-rose-600 border-rose-200" },
  red:     { bg: "bg-rose-100",    icon: "text-rose-500",    name: "text-rose-700",    check: "bg-rose-400",    badge: "bg-rose-50 text-rose-600 border-rose-200" },
  amber:   { bg: "bg-amber-100",   icon: "text-amber-500",   name: "text-amber-700",   check: "bg-amber-400",   badge: "bg-amber-50 text-amber-600 border-amber-200" },
  yellow:  { bg: "bg-amber-100",   icon: "text-amber-500",   name: "text-amber-700",   check: "bg-amber-400",   badge: "bg-amber-50 text-amber-600 border-amber-200" },
  violet:  { bg: "bg-violet-100",  icon: "text-violet-500",  name: "text-violet-700",  check: "bg-violet-400",  badge: "bg-violet-50 text-violet-600 border-violet-200" },
  purple:  { bg: "bg-violet-100",  icon: "text-violet-500",  name: "text-violet-700",  check: "bg-violet-400",  badge: "bg-violet-50 text-violet-600 border-violet-200" },
};

const DEFAULT_COLORS: ColorTheme[] = [
  COLOR_MAP.blue!,
  COLOR_MAP.emerald!,
  COLOR_MAP.rose!,
  COLOR_MAP.amber!,
  COLOR_MAP.violet!,
];

const ICONS: Record<string, string> = {
  daily:   "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  weekly:  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  monthly: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
};

const DAILY_ICON = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";

// Simulated 7-day (Mon–Sun) completion grids, cycled across habits
const WEEK_GRIDS: number[][] = [
  [1, 1, 1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 0, 0],
];

// Multipliers to produce realistic-looking streak numbers
const STREAK_MUL = [4, 2, 1, 3, 1];

function colorFor(h: ApiHabit, idx: number): ColorTheme {
  const key = (h.category_color ?? "").toLowerCase();
  return COLOR_MAP[key] ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length] ?? DEFAULT_COLORS[0]!;
}

// ── API ───────────────────────────────────────────────────────────────────────
const { data: apiHabits, refresh } = await useFetch<ApiHabit[]>(`${API}/api/habits`, {
  headers: { Accept: "application/json" },
});

const activeSet = ref<Set<number>>(new Set());

const habits = computed(() =>
  (apiHabits.value ?? []).map((h, i) => {
    const grid = WEEK_GRIDS[i % WEEK_GRIDS.length] ?? [];
    const mul  = STREAK_MUL[i % STREAK_MUL.length] ?? 1;
    return {
      ...h,
      color:  colorFor(h, i),
      icon:   ICONS[h.frequency] ?? DAILY_ICON,
      active: activeSet.value.has(h.id),
      grid,
      streak: grid.filter((v) => v === 1).length * mul,
    };
  })
);

function toggleActive(id: number) {
  if (activeSet.value.has(id)) activeSet.value.delete(id);
  else activeSet.value.add(id);
  activeSet.value = new Set(activeSet.value);
}

// ── Create ────────────────────────────────────────────────────────────────────
const showCreate = ref(false);
const createForm = ref({
  name: "",
  frequency: "daily" as "daily" | "weekly" | "monthly",
  goal: "",
  category_color: "",
});
const createError = ref("");

async function createHabit() {
  if (!createForm.value.name.trim()) {
    createError.value = "Name is required.";
    return;
  }
  createError.value = "";
  try {
    await $fetch(`${API}/api/habits`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: {
        name: createForm.value.name.trim(),
        frequency: createForm.value.frequency,
        goal: createForm.value.goal.trim() || "",
        category_color: createForm.value.category_color.trim() || "",
      },
    });
    createForm.value = { name: "", frequency: "daily", goal: "", category_color: "" };
    showCreate.value = false;
    await refresh();
  } catch (e: any) {
    createError.value = e?.data?.message ?? "Failed to create habit.";
  }
}

// ── Edit ──────────────────────────────────────────────────────────────────────
const editingHabit = ref<ApiHabit | null>(null);
const editForm = ref({
  name: "",
  frequency: "daily" as "daily" | "weekly" | "monthly",
  goal: "",
  category_color: "",
});
const editError = ref("");

function openEdit(h: ApiHabit) {
  editingHabit.value = h;
  editForm.value = {
    name: h.name,
    frequency: h.frequency,
    goal: h.goal ?? "",
    category_color: h.category_color ?? "",
  };
  editError.value = "";
}
function closeEdit() { editingHabit.value = null; }

async function saveEdit() {
  if (!editingHabit.value) return;
  if (!editForm.value.name.trim()) {
    editError.value = "Name is required.";
    return;
  }
  editError.value = "";
  try {
    await $fetch(`${API}/api/habits/${editingHabit.value.id}`, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: {
        name: editForm.value.name.trim(),
        frequency: editForm.value.frequency,
        goal: editForm.value.goal.trim() || "",
        category_color: editForm.value.category_color.trim() || "",
      },
    });
    closeEdit();
    await refresh();
  } catch (e: any) {
    editError.value = e?.data?.message ?? "Failed to update habit.";
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteHabit(id: number) {
  try {
    await $fetch(`${API}/api/habits/${id}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    activeSet.value.delete(id);
    await refresh();
  } catch {}
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const avgStreak = computed(() => {
  if (habits.value.length === 0) return 0;
  const total = habits.value.reduce((s, h) => s + h.streak, 0);
  return Math.round(total / habits.value.length);
});

const efficiency = computed(() => {
  if (habits.value.length === 0) return 0;
  return Math.round((activeSet.value.size / habits.value.length) * 100);
});

// SVG ring: r=14, circumference = 2π×14 ≈ 87.96
const RING_CIRC = 87.96;
const ringOffset = computed(() => RING_CIRC - (efficiency.value / 100) * RING_CIRC);

// Focus trend: 14 days (last week + this week)
const TREND_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const trendLastWeek = [55, 70, 50, 75, 65, 45, 68];
const trendThisWeek = [72, 85, 60, 90, 78, 55, 82];

const frequencyOptions: Array<"daily" | "weekly" | "monthly"> = ["daily", "weekly", "monthly"];
const colorOptions = ["blue", "emerald", "rose", "amber", "violet"] as const;
</script>

<template>
  <main class="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
    <div class="mx-auto max-w-4xl space-y-6">

      <!-- Header ─────────────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Habit Tracker</h1>
          <p class="mt-1 text-sm text-gray-400">Optimize your daily performance through discipline.</p>
        </div>
        <button
          @click="showCreate = true"
          class="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-700"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Habit
        </button>
      </div>

      <!-- Current Status ──────────────────────────────────────────────────── -->
      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p class="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          Current Status
        </p>
        <div class="flex items-center gap-8">
          <!-- Text -->
          <div class="flex-1">
            <h2 class="text-4xl font-extrabold leading-tight text-emerald-600">
              Peak<br />Performance
            </h2>
            <p class="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
              You've maintained an 89% focus score across {{ habits.length * 2 }} tracking metrics
              this week. Stay disciplined.
            </p>
          </div>

          <!-- Stats -->
          <div class="flex shrink-0 gap-10">
            <div class="text-center">
              <p class="text-4xl font-extrabold text-gray-900">
                {{ avgStreak > 0 ? String(avgStreak).padStart(2, "0") : "—" }}
              </p>
              <p class="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                Day Streak
              </p>
            </div>
            <div class="text-center">
              <p class="text-4xl font-extrabold text-gray-900">89%</p>
              <p class="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                Efficiency
              </p>
            </div>
          </div>

          <!-- Ring -->
          <div class="shrink-0">
            <svg class="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" stroke-width="3" />
              <circle
                cx="18" cy="18" r="14"
                fill="none"
                stroke="#10b981"
                stroke-width="3"
                stroke-linecap="round"
                :stroke-dasharray="RING_CIRC"
                :stroke-dashoffset="ringOffset"
                class="transition-all duration-700"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Active Habits ───────────────────────────────────────────────────── -->
      <div>
        <p class="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
          Active Habits
        </p>

        <!-- Empty state -->
        <div
          v-if="habits.length === 0"
          class="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center"
        >
          <svg
            class="mx-auto mb-3 h-10 w-10 text-gray-300"
            fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round" stroke-linejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p class="text-sm font-medium text-gray-400">No habits yet.</p>
          <button
            @click="showCreate = true"
            class="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
          >
            + Add your first habit
          </button>
        </div>

        <!-- Habit rows -->
        <div v-else class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div
            v-for="(habit, idx) in habits"
            :key="habit.id"
            class="group flex items-center gap-5 px-6 py-5 transition hover:bg-gray-50"
            :class="idx < habits.length - 1 ? 'border-b border-gray-100' : ''"
          >
            <!-- Icon circle -->
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              :class="habit.color.bg"
            >
              <svg
                class="h-5 w-5"
                :class="habit.color.icon"
                fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" :d="habit.icon" />
              </svg>
            </div>

            <!-- Name + goal -->
            <div class="w-44 shrink-0">
              <p class="font-bold" :class="habit.color.name">{{ habit.name }}</p>
              <p class="mt-0.5 text-xs text-gray-400">
                <span v-if="habit.goal">Goal: {{ habit.goal }}</span>
                <span v-else class="capitalize">{{ habit.frequency }}</span>
              </p>
            </div>

            <!-- 7-day completion grid -->
            <div class="flex flex-1 items-center gap-1.5">
              <div
                v-for="(done, i) in habit.grid"
                :key="i"
                class="flex h-8 w-8 items-center justify-center rounded-lg transition"
                :class="done ? habit.color.check + ' text-white' : 'bg-gray-100'"
              >
                <svg
                  v-if="done"
                  class="h-4 w-4"
                  fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <!-- Streak count -->
            <div class="shrink-0 text-right">
              <p class="text-2xl font-extrabold text-gray-900">
                {{ String(habit.streak).padStart(2, "0") }}
              </p>
              <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                Day Streak
              </p>
            </div>

            <!-- Action buttons -->
            <div class="flex shrink-0 items-center gap-1.5">
              <!-- Complete toggle -->
              <button
                @click="toggleActive(habit.id)"
                class="flex h-8 w-8 items-center justify-center rounded-full border-2 transition"
                :class="
                  habit.active
                    ? habit.color.check + ' border-transparent text-white'
                    : 'border-gray-200 bg-white text-gray-300 hover:border-gray-300'
                "
                :aria-label="`Toggle ${habit.name}`"
              >
                <svg
                  class="h-4 w-4"
                  fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>

              <!-- Edit -->
              <button
                @click="openEdit(habit)"
                class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Edit habit"
              >
                <svg
                  class="h-4 w-4"
                  fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round" stroke-linejoin="round"
                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z"
                  />
                </svg>
              </button>

              <!-- Delete -->
              <button
                @click="deleteHabit(habit.id)"
                class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                aria-label="Delete habit"
              >
                <svg
                  class="h-4 w-4"
                  fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Add action row -->
          <div class="border-t border-gray-100 px-6 py-4">
            <button
              @click="showCreate = true"
              class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600"
            >
              <svg
                class="h-4 w-4"
                fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v8M8 12h8" />
              </svg>
              Add New Habit Action
            </button>
          </div>
        </div>
      </div>

      <!-- Focus Trend ─────────────────────────────────────────────────────── -->
      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-start justify-between">
          <div>
            <h3 class="font-bold text-gray-900">Focus Trend</h3>
            <p class="mt-0.5 text-xs text-gray-400">
              Mental clarity fluctuations over the past 14 days.
            </p>
          </div>
          <div class="flex items-center gap-4 text-xs text-gray-400">
            <span class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full bg-gray-800"></span>
              this week
            </span>
            <span class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full bg-gray-300"></span>
              last week
            </span>
          </div>
        </div>

        <div class="flex h-36 items-end gap-4">
          <!-- Last week -->
          <div class="flex flex-1 items-end gap-1.5">
            <div
              v-for="(bar, i) in trendLastWeek"
              :key="'lw' + i"
              class="flex flex-1 flex-col items-center gap-1.5"
            >
              <div
                class="w-full rounded-t-md bg-gray-200 transition-all"
                :style="{ height: `${bar}%` }"
              ></div>
              <span class="text-[9px] font-medium text-gray-400">{{ TREND_DAYS[i] }}</span>
            </div>
          </div>

          <!-- Divider -->
          <div class="w-px shrink-0 self-stretch bg-gray-100"></div>

          <!-- This week -->
          <div class="flex flex-1 items-end gap-1.5">
            <div
              v-for="(bar, i) in trendThisWeek"
              :key="'tw' + i"
              class="flex flex-1 flex-col items-center gap-1.5"
            >
              <div
                class="w-full rounded-t-md bg-gray-800 transition-all"
                :style="{ height: `${bar}%` }"
              ></div>
              <span class="text-[9px] font-medium text-gray-400">{{ TREND_DAYS[i] }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>

  <!-- ── Create Modal ─────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="showCreate"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click.self="showCreate = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-base font-bold text-gray-900">New Habit</h3>
          <button
            @click="showCreate = false"
            class="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p
          v-if="createError"
          class="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600"
        >{{ createError }}</p>

        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">
              Name <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="createForm.name"
              type="text"
              placeholder="e.g. Drink 3 Liters of Water"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Frequency</label>
            <div class="flex gap-2">
              <button
                v-for="opt in frequencyOptions"
                :key="opt"
                type="button"
                @click="createForm.frequency = opt"
                class="flex-1 rounded-lg border py-2 text-xs font-semibold capitalize transition"
                :class="
                  createForm.frequency === opt
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                    : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'
                "
              >{{ opt }}</button>
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Goal</label>
            <input
              v-model="createForm.goal"
              type="text"
              placeholder="e.g. 3 Liters / Day"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Color Theme</label>
            <div class="flex gap-3">
              <button
                v-for="c in colorOptions"
                :key="c"
                type="button"
                @click="createForm.category_color = c"
                class="h-8 w-8 rounded-full border-2 transition hover:scale-110"
                :class="[
                  c === 'blue'    ? 'bg-blue-400'    :
                  c === 'emerald' ? 'bg-emerald-400' :
                  c === 'rose'    ? 'bg-rose-400'    :
                  c === 'amber'   ? 'bg-amber-400'   : 'bg-violet-400',
                  createForm.category_color === c
                    ? (c === 'blue' ? 'border-blue-600' : c === 'emerald' ? 'border-emerald-600' : c === 'rose' ? 'border-rose-600' : c === 'amber' ? 'border-amber-600' : 'border-violet-600')
                    : 'border-transparent',
                ]"
              ></button>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            @click="showCreate = false"
            class="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
          >Cancel</button>
          <button
            type="button"
            @click="createHabit"
            class="rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
          >Create Habit</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Edit Modal ───────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div
      v-if="editingHabit"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click.self="closeEdit"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-base font-bold text-gray-900">Edit Habit</h3>
          <button
            @click="closeEdit"
            class="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p
          v-if="editError"
          class="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600"
        >{{ editError }}</p>

        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">
              Name <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="editForm.name"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Frequency</label>
            <div class="flex gap-2">
              <button
                v-for="opt in frequencyOptions"
                :key="opt"
                type="button"
                @click="editForm.frequency = opt"
                class="flex-1 rounded-lg border py-2 text-xs font-semibold capitalize transition"
                :class="
                  editForm.frequency === opt
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                    : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'
                "
              >{{ opt }}</button>
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Goal</label>
            <input
              v-model="editForm.goal"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Color Theme</label>
            <div class="flex gap-3">
              <button
                v-for="c in colorOptions"
                :key="c"
                type="button"
                @click="editForm.category_color = c"
                class="h-8 w-8 rounded-full border-2 transition hover:scale-110"
                :class="[
                  c === 'blue'    ? 'bg-blue-400'    :
                  c === 'emerald' ? 'bg-emerald-400' :
                  c === 'rose'    ? 'bg-rose-400'    :
                  c === 'amber'   ? 'bg-amber-400'   : 'bg-violet-400',
                  editForm.category_color === c
                    ? (c === 'blue' ? 'border-blue-600' : c === 'emerald' ? 'border-emerald-600' : c === 'rose' ? 'border-rose-600' : c === 'amber' ? 'border-amber-600' : 'border-violet-600')
                    : 'border-transparent',
                ]"
              ></button>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            @click="closeEdit"
            class="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
          >Cancel</button>
          <button
            type="button"
            @click="saveEdit"
            class="rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
          >Save Changes</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
