<script setup lang="ts">
const API = useRuntimeConfig().public.apiBase;

// ── Weekly stats ──────────────────────────────────────────────────────────────
interface WeeklyResp {
  tasks_done: number;
  tasks_delta: number;
  deep_work_hours: number;
  deep_work_target: number;
  consistency: number;
  flow_score: number;
  week_start: string;
  week_end: string;
}
const weekly = ref<WeeklyResp | null>(null);
const weeklyLoading = ref(true);

async function fetchWeekly() {
  weeklyLoading.value = true;
  try {
    weekly.value = await $fetch<WeeklyResp>(`${API}/api/insights/weekly`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    weekly.value = null;
  } finally {
    weeklyLoading.value = false;
  }
}

const deepWorkPct = computed(() => {
  if (!weekly.value || !weekly.value.deep_work_target) return 0;
  return Math.min(
    Math.round((weekly.value.deep_work_hours / weekly.value.deep_work_target) * 100),
    100
  );
});

// ── Smart insights ────────────────────────────────────────────────────────────
interface SmartResp {
  focus_momentum: { change_pct: number; message: string };
  peak_efficiency: { window: string; message: string };
  burnout_risk: { level: string; message: string };
}
const smart = ref<SmartResp | null>(null);
const smartLoading = ref(true);

async function fetchSmart() {
  smartLoading.value = true;
  try {
    smart.value = await $fetch<SmartResp>(`${API}/api/insights/smart`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    smart.value = null;
  } finally {
    smartLoading.value = false;
  }
}

// ── Output chart ──────────────────────────────────────────────────────────────
interface OutputDay { date: string; day: string; tasks_done: number; focus_minutes: number }
interface OutputResp { period: number; data: OutputDay[] }

const outputPeriod = ref<7 | 30>(7);
const output = ref<OutputDay[]>([]);
const outputLoading = ref(true);

async function fetchOutput() {
  outputLoading.value = true;
  try {
    const resp = await $fetch<OutputResp>(
      `${API}/api/insights/output?period=${outputPeriod.value}`,
      { headers: { Accept: "application/json" } }
    );
    output.value = resp?.data ?? [];
  } catch {
    output.value = [];
  } finally {
    outputLoading.value = false;
  }
}

const maxFocusMinutes = computed(() =>
  Math.max(...output.value.map((d) => d.focus_minutes), 1)
);

function selectPeriod(p: 7 | 30) {
  if (outputPeriod.value === p) return;
  outputPeriod.value = p;
  fetchOutput();
}

// ── Activity focus ────────────────────────────────────────────────────────────
interface ActivityBreakdown { category: string; label: string; count: number; percentage: number }
interface ActivityResp { total_tasks: number; breakdown: ActivityBreakdown[] }

const activity = ref<ActivityResp | null>(null);
const activityLoading = ref(true);

const CATEGORY_STYLE: Record<string, { icon: string; bar: string }> = {
  core_work: { icon: "💼", bar: "bg-violet-400" },
  admin: { icon: "📋", bar: "bg-sky-400" },
  learning: { icon: "📚", bar: "bg-amber-400" },
  personal: { icon: "🌿", bar: "bg-emerald-400" },
  health: { icon: "❤️", bar: "bg-rose-400" },
};
function categoryStyle(cat: string) {
  return CATEGORY_STYLE[cat] ?? { icon: "📁", bar: "bg-gray-400" };
}

async function fetchActivity() {
  activityLoading.value = true;
  try {
    activity.value = await $fetch<ActivityResp>(`${API}/api/insights/activity-focus`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    activity.value = null;
  } finally {
    activityLoading.value = false;
  }
}

// ── Peak hours ────────────────────────────────────────────────────────────────
interface PeakHoursResp {
  peak_start: number;
  peak_end: number;
  peak_window: string;
  hour_buckets: number[];
}
const peakHours = ref<PeakHoursResp | null>(null);
const peakHoursLoading = ref(true);

async function fetchPeakHours() {
  peakHoursLoading.value = true;
  try {
    peakHours.value = await $fetch<PeakHoursResp>(`${API}/api/insights/peak-hours`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    peakHours.value = null;
  } finally {
    peakHoursLoading.value = false;
  }
}

const maxHourBucket = computed(() =>
  Math.max(...(peakHours.value?.hour_buckets ?? [0]), 1)
);

function hourLabel(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}${ampm[0]}`;
}

function isPeakHour(h: number): boolean {
  if (!peakHours.value) return false;
  return h >= peakHours.value.peak_start && h < peakHours.value.peak_end;
}

await Promise.all([fetchWeekly(), fetchSmart(), fetchOutput(), fetchActivity(), fetchPeakHours()]);
</script>

<template>
  <main class="flex-1 overflow-y-auto bg-slate-50 px-4 py-6 sm:px-6">
    <div class="mx-auto max-w-5xl space-y-6">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">Insights</h1>
        <p class="mt-1 text-sm text-gray-500">
          A weekly look at how your focus and output are trending.
        </p>
      </div>

      <!-- ── Weekly stats ────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Tasks Done</p>
          <p class="mt-2 text-3xl font-extrabold text-gray-900">
            {{ weeklyLoading ? "—" : weekly?.tasks_done ?? 0 }}
          </p>
          <p
            v-if="!weeklyLoading && weekly"
            class="mt-0.5 text-xs font-semibold"
            :class="weekly.tasks_delta >= 0 ? 'text-emerald-600' : 'text-rose-500'"
          >
            {{ weekly.tasks_delta >= 0 ? "+" : "" }}{{ weekly.tasks_delta }} vs last week
          </p>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Deep Work</p>
          <p class="mt-2 text-3xl font-extrabold text-gray-900">
            {{ weeklyLoading ? "—" : weekly?.deep_work_hours ?? 0 }}<span class="text-base font-bold text-gray-400">h</span>
          </p>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div class="h-full rounded-full bg-emerald-400 transition-all duration-500" :style="{ width: `${deepWorkPct}%` }"></div>
          </div>
          <p class="mt-1 text-xs text-gray-400">of {{ weekly?.deep_work_target ?? 0 }}h target</p>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Consistency</p>
          <p class="mt-2 text-3xl font-extrabold text-gray-900">
            {{ weeklyLoading ? "—" : weekly?.consistency ?? 0 }}%
          </p>
          <p class="mt-0.5 text-xs text-gray-400">days active this week</p>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Flow Score</p>
          <p class="mt-2 text-3xl font-extrabold text-gray-900">
            {{ weeklyLoading ? "—" : weekly?.flow_score ?? 0 }}<span class="text-base font-bold text-gray-400">/10</span>
          </p>
          <p class="mt-0.5 text-xs text-gray-400">composite this week</p>
        </div>
      </div>

      <!-- ── Smart insights ──────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Focus Momentum</p>
          <p
            class="mt-2 text-2xl font-extrabold"
            :class="(smart?.focus_momentum.change_pct ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'"
          >
            {{ smartLoading ? "—" : `${smart?.focus_momentum.change_pct ?? 0}%` }}
          </p>
          <p class="mt-1.5 text-xs text-gray-500">{{ smart?.focus_momentum.message ?? "" }}</p>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Peak Efficiency</p>
          <p class="mt-2 text-2xl font-extrabold text-violet-600">
            {{ smartLoading ? "—" : smart?.peak_efficiency.window ?? "—" }}
          </p>
          <p class="mt-1.5 text-xs text-gray-500">{{ smart?.peak_efficiency.message ?? "" }}</p>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Burnout Risk</p>
          <p
            class="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
            :class="
              smart?.burnout_risk.level === 'high'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-emerald-50 text-emerald-600'
            "
          >
            {{ smartLoading ? "—" : smart?.burnout_risk.level ?? "—" }}
          </p>
          <p class="mt-1.5 text-xs text-gray-500">{{ smart?.burnout_risk.message ?? "" }}</p>
        </div>
      </div>

      <!-- ── Output chart ────────────────────────────────────────────────── -->
      <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 class="font-bold text-gray-900">Daily Output</h3>
            <p class="mt-0.5 text-xs text-gray-400">Focus minutes per day.</p>
          </div>
          <div class="flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
            <button
              v-for="p in [7, 30]"
              :key="p"
              @click="selectPeriod(p as 7 | 30)"
              class="rounded-lg px-3 py-1 text-xs font-semibold transition"
              :class="outputPeriod === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'"
            >
              {{ p }}d
            </button>
          </div>
        </div>

        <div v-if="outputLoading" class="h-32 animate-pulse rounded-xl bg-gray-100"></div>
        <div v-else-if="output.length === 0" class="py-8 text-center text-xs text-gray-400">
          No focus data yet for this period.
        </div>
        <div v-else class="flex h-32 items-end gap-1 sm:h-36 sm:gap-1.5">
          <div
            v-for="(d, i) in output"
            :key="d.date"
            class="group flex flex-1 flex-col items-center gap-1.5"
          >
            <div
              class="w-full rounded-t-md bg-gray-900 transition-all duration-500 group-hover:bg-emerald-500"
              :style="{ height: `${Math.max((d.focus_minutes / maxFocusMinutes) * 100, 2)}%` }"
              :title="`${d.focus_minutes}m focus, ${d.tasks_done} tasks`"
            ></div>
            <span v-if="outputPeriod === 7 || i % 4 === 0" class="text-[9px] font-medium text-gray-300">{{ d.day }}</span>
          </div>
        </div>
      </div>

      <!-- ── Activity focus + Peak hours ─────────────────────────────────── -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- Activity focus -->
        <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h3 class="font-bold text-gray-900">Activity Focus</h3>
          <p class="mt-0.5 text-xs text-gray-400">Where this week's tasks went.</p>

          <div v-if="activityLoading" class="mt-5 space-y-3">
            <div v-for="i in 5" :key="i" class="h-6 animate-pulse rounded-lg bg-gray-100"></div>
          </div>
          <div v-else-if="!activity || activity.total_tasks === 0" class="mt-5 py-4 text-center text-xs text-gray-400">
            No categorized tasks yet this week.
          </div>
          <div v-else class="mt-5 space-y-3">
            <div v-for="b in activity.breakdown" :key="b.category" class="flex items-center gap-3">
              <span class="w-5 shrink-0 text-center text-sm leading-none">{{ categoryStyle(b.category).icon }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-semibold text-gray-700">{{ b.label }}</span>
                  <span class="font-bold text-gray-500">{{ b.percentage }}%</span>
                </div>
                <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="categoryStyle(b.category).bar"
                    :style="{ width: `${b.percentage}%` }"
                  ></div>
                </div>
              </div>
              <span class="w-6 shrink-0 text-right text-xs font-bold text-gray-400">{{ b.count }}</span>
            </div>
          </div>
        </div>

        <!-- Peak hours -->
        <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-bold text-gray-900">Peak Hours</h3>
              <p class="mt-0.5 text-xs text-gray-400">Focus time by hour of day.</p>
            </div>
            <span
              v-if="peakHours && !peakHoursLoading"
              class="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600"
            >
              {{ peakHours.peak_window }}
            </span>
          </div>

          <div v-if="peakHoursLoading" class="mt-5 h-28 animate-pulse rounded-xl bg-gray-100"></div>
          <div v-else class="mt-5 flex h-28 items-end gap-[2px]">
            <div
              v-for="(count, h) in peakHours?.hour_buckets ?? []"
              :key="h"
              class="group flex flex-1 flex-col items-end"
              :title="`${hourLabel(h)}: ${count}m`"
            >
              <div
                class="w-full rounded-t transition-all duration-300"
                :class="isPeakHour(h) ? 'bg-emerald-500' : 'bg-gray-200'"
                :style="{ height: `${Math.max((count / maxHourBucket) * 100, count > 0 ? 4 : 1)}%` }"
              ></div>
            </div>
          </div>
          <div class="mt-1.5 flex justify-between text-[9px] font-medium text-gray-300">
            <span>12A</span>
            <span>6A</span>
            <span>12P</span>
            <span>6P</span>
            <span>12A</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
