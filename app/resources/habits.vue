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

const COLOR_THEMES = [
  {
    color: "blue",
    bg: "bg-blue-50",
    border: "border-blue-100",
    text: "text-blue-600",
    heatBg: "bg-blue-400",
  },
  {
    color: "emerald",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-600",
    heatBg: "bg-emerald-400",
  },
  {
    color: "rose",
    bg: "bg-rose-50",
    border: "border-rose-100",
    text: "text-rose-600",
    heatBg: "bg-rose-400",
  },
  {
    color: "amber",
    bg: "bg-amber-50",
    border: "border-amber-100",
    text: "text-amber-600",
    heatBg: "bg-amber-400",
  },
  {
    color: "violet",
    bg: "bg-violet-50",
    border: "border-violet-100",
    text: "text-violet-600",
    heatBg: "bg-violet-400",
  },
];

const COLOR_MAP: Record<string, typeof COLOR_THEMES[number]> = {
  blue: COLOR_THEMES[0],
  emerald: COLOR_THEMES[1],
  green: COLOR_THEMES[1],
  rose: COLOR_THEMES[2],
  red: COLOR_THEMES[2],
  amber: COLOR_THEMES[3],
  yellow: COLOR_THEMES[3],
  violet: COLOR_THEMES[4],
  purple: COLOR_THEMES[4],
};

const ICONS: Record<string, string> = {
  daily: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  weekly:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  monthly:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
};

const GRID_SEED = [
  1,
  1,
  1,
  0,
  1,
  1,
  1,
  1,
  0,
  1,
  1,
  1,
  0,
  1,
  0,
  1,
  1,
  1,
  1,
  1,
  0,
  1,
  1,
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  1,
  1,
];

function themeFor(h: ApiHabit, idx: number) {
  if (h.category_color && COLOR_MAP[h.category_color.toLowerCase()]) {
    return COLOR_MAP[h.category_color.toLowerCase()];
  }
  return COLOR_THEMES[idx % COLOR_THEMES.length];
}

const { data: apiHabits, refresh } = await useFetch<ApiHabit[]>(`${API}/api/habits`, {
  headers: { Accept: "application/json" },
});

const activeSet = ref<Set<number>>(new Set());

const habits = computed(() =>
  (apiHabits.value ?? []).map((h, i) => ({
    ...h,
    ...themeFor(h, i),
    description: h.goal ?? h.frequency,
    streak: 0,
    icon: ICONS[h.frequency] ?? ICONS.daily,
    active: activeSet.value.has(h.id),
    grid: GRID_SEED,
  }))
);

function toggleActive(id: number) {
  if (activeSet.value.has(id)) {
    activeSet.value.delete(id);
  } else {
    activeSet.value.add(id);
  }
  activeSet.value = new Set(activeSet.value);
}

// ── Create ──────────────────────────────────────────────────────────────────
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
  await $fetch(`${API}/api/habits`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: {
      name: createForm.value.name.trim(),
      frequency: createForm.value.frequency,
      goal: createForm.value.goal.trim() || null,
      category_color: createForm.value.category_color.trim() || null,
    },
  });
  createForm.value = { name: "", frequency: "daily", goal: "", category_color: "" };
  showCreate.value = false;
  await refresh();
}

// ── Edit ─────────────────────────────────────────────────────────────────────
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

function closeEdit() {
  editingHabit.value = null;
}

async function saveEdit() {
  if (!editingHabit.value) return;
  if (!editForm.value.name.trim()) {
    editError.value = "Name is required.";
    return;
  }
  editError.value = "";
  await $fetch(`${API}/api/habits/${editingHabit.value.id}`, {
    method: "PUT",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: {
      name: editForm.value.name.trim(),
      frequency: editForm.value.frequency,
      goal: editForm.value.goal.trim() || null,
      category_color: editForm.value.category_color.trim() || null,
    },
  });
  closeEdit();
  await refresh();
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteHabit(id: number) {
  await $fetch(`${API}/api/habits/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  activeSet.value.delete(id);
  await refresh();
}

const peakDays = computed(() => (habits.value.length > 0 ? habits.value.length * 4 : 0));
const completionRate = computed(() =>
  habits.value.length > 0
    ? Math.round((activeSet.value.size / habits.value.length) * 100)
    : 0
);

const focusGoalMins = 1000;
const focusEarned = 720;
const focusPercent = Math.round((focusEarned / focusGoalMins) * 100);
const trendBars = [40, 65, 50, 80, 55, 90, 70];
const trendDays = ["M", "T", "W", "T", "F", "S", "S"];

const frequencyOptions: Array<"daily" | "weekly" | "monthly"> = [
  "daily",
  "weekly",
  "monthly",
];
</script>

<template>
  <main class="flex-1 overflow-y-auto bg-gray-50 px-8 py-7">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Habit Forge</h2>
        <p class="mt-1 text-sm text-gray-400">
          Discipleship is the bridge between goals and accomplishment
        </p>
      </div>
      <div class="flex gap-2">
        <button
          @click="showCreate = true"
          class="rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-700"
        >
          + Add New
        </button>
      </div>
    </div>

    <!-- Top stats row -->
    <div class="mb-6 grid grid-cols-3 gap-4">
      <div class="col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Peak Performance
        </p>
        <div class="mt-3 flex items-end gap-8">
          <div>
            <p class="text-[11px] text-gray-400">Active Habits</p>
            <p class="text-4xl font-extrabold text-gray-900">
              {{ habits.length }}
              <span class="text-base font-semibold text-gray-400">Total</span>
            </p>
          </div>
          <div>
            <p class="text-[11px] text-gray-400">Completion Rate</p>
            <p class="text-4xl font-extrabold text-gray-900">
              {{ completionRate
              }}<span class="text-base font-semibold text-gray-400">%</span>
            </p>
          </div>
        </div>
      </div>
      <div class="rounded-2xl bg-gray-900 p-5 text-white shadow-sm">
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
          Focus Goal
        </p>
        <p class="mt-2 text-2xl font-extrabold">
          {{ focusGoalMins.toLocaleString() }}
          <span class="text-sm font-medium text-gray-400">mins</span>
        </p>
        <div class="mt-3">
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              class="h-full rounded-full bg-emerald-400 transition-all"
              :style="{ width: `${focusPercent}%` }"
            ></div>
          </div>
          <p class="mt-1.5 text-[11px] text-gray-400">
            {{ focusEarned }} / {{ focusGoalMins }} mins earned
          </p>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="habits.length === 0"
      class="mb-6 rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center"
    >
      <p class="text-gray-400 text-sm">
        No habits yet. Click <span class="font-semibold text-gray-600">+ Add New</span> to
        create one.
      </p>
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
          <svg
            class="h-5 w-5"
            :class="habit.text"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" :d="habit.icon" />
          </svg>
        </div>

        <!-- Info -->
        <div class="w-44 shrink-0">
          <p class="font-bold text-gray-900">{{ habit.name }}</p>
          <p class="mt-0.5 text-xs text-gray-400 capitalize">{{ habit.description }}</p>
          <span
            class="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize"
            :class="[habit.bg, habit.text]"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="habit.heatBg"></span>
            {{ habit.frequency }}
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

        <!-- Edit button -->
        <button
          @click="openEdit(habit)"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-400 transition hover:border-gray-300 hover:text-gray-600"
          aria-label="Edit habit"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z"
            />
          </svg>
        </button>

        <!-- Delete button -->
        <button
          @click="deleteHabit(habit.id)"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-400 transition hover:border-rose-200 hover:text-rose-500"
          aria-label="Delete habit"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10"
            />
          </svg>
        </button>

        <!-- Toggle button -->
        <button
          @click="toggleActive(habit.id)"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition"
          :class="
            habit.active
              ? [habit.heatBg, 'border-transparent text-white']
              : 'border-gray-200 bg-white text-gray-300 hover:border-gray-300'
          "
          :aria-label="`Toggle ${habit.name}`"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Bottom row -->
    <div class="grid grid-cols-2 gap-4">
      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-bold text-gray-900">Focus Trend</h3>
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
      <div
        class="relative overflow-hidden rounded-2xl bg-gray-900 p-5 text-white shadow-sm"
      >
        <div
          class="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_80%_20%,#10b981_0%,transparent_60%)]"
        ></div>
        <div class="relative">
          <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Level Up
          </p>
          <p class="mt-2 text-base font-bold leading-snug">
            70% of FocusFlow users<br />
            <span class="text-emerald-400">improved this week</span>
          </p>
          <p class="mt-1 text-xs text-gray-500">
            Keep your streak alive to climb the leaderboard.
          </p>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <Teleport to="body">
      <div
        v-if="showCreate"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="showCreate = false"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h3 class="mb-4 text-base font-bold text-gray-900">New Habit</h3>
          <p v-if="createError" class="mb-3 text-xs font-medium text-rose-500">
            {{ createError }}
          </p>
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500"
                >Name <span class="text-rose-400">*</span></label
              >
              <input
                v-model="createForm.name"
                type="text"
                placeholder="e.g. Drink 2L water"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500"
                >Frequency</label
              >
              <div class="flex gap-2">
                <button
                  v-for="opt in frequencyOptions"
                  :key="opt"
                  type="button"
                  @click="createForm.frequency = opt"
                  class="rounded-md border px-3 py-1 text-xs font-semibold capitalize transition"
                  :class="
                    createForm.frequency === opt
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                      : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'
                  "
                >
                  {{ opt }}
                </button>
              </div>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500">Goal</label>
              <input
                v-model="createForm.goal"
                type="text"
                placeholder="e.g. Stay hydrated"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500"
                >Color Theme</label
              >
              <div class="flex gap-2">
                <button
                  v-for="c in ['blue', 'emerald', 'rose', 'amber', 'violet']"
                  :key="c"
                  type="button"
                  @click="createForm.category_color = c"
                  class="h-7 w-7 rounded-full border-2 transition"
                  :class="[
                    `bg-${c}-400`,
                    createForm.category_color === c
                      ? `border-${c}-600 scale-110`
                      : 'border-transparent',
                  ]"
                  :title="c"
                ></button>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              @click="showCreate = false"
              class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="createHabit"
              class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div
        v-if="editingHabit"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="closeEdit"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h3 class="mb-4 text-base font-bold text-gray-900">Edit Habit</h3>
          <p v-if="editError" class="mb-3 text-xs font-medium text-rose-500">
            {{ editError }}
          </p>
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500"
                >Name <span class="text-rose-400">*</span></label
              >
              <input
                v-model="editForm.name"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500"
                >Frequency</label
              >
              <div class="flex gap-2">
                <button
                  v-for="opt in frequencyOptions"
                  :key="opt"
                  type="button"
                  @click="editForm.frequency = opt"
                  class="rounded-md border px-3 py-1 text-xs font-semibold capitalize transition"
                  :class="
                    editForm.frequency === opt
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                      : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'
                  "
                >
                  {{ opt }}
                </button>
              </div>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500">Goal</label>
              <input
                v-model="editForm.goal"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500"
                >Color Theme</label
              >
              <div class="flex gap-2">
                <button
                  v-for="c in ['blue', 'emerald', 'rose', 'amber', 'violet']"
                  :key="c"
                  type="button"
                  @click="editForm.category_color = c"
                  class="h-7 w-7 rounded-full border-2 transition"
                  :class="[
                    `bg-${c}-400`,
                    editForm.category_color === c
                      ? `border-${c}-600 scale-110`
                      : 'border-transparent',
                  ]"
                  :title="c"
                ></button>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              @click="closeEdit"
              class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="saveEdit"
              class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>
