<script setup lang="ts">
type Priority = "high" | "medium" | "low";
type TaskStatus = "pending" | "in_progress" | "completed";

interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string;
  start_time: string | null;
  end_time: string | null;
  category: string | null;
}

const API = "http://127.0.0.1:8000";

// ── Date helpers ──────────────────────────────────────────────────────────────
const _now = new Date();
const _pad = (n: number) => String(n).padStart(2, "0");
const todayStr = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(
  _now.getDate()
)}`;

function getMondayOf(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-${_pad(d.getDate())}`;
}

const weekStart = ref(getMondayOf(todayStr));
const selectedDay = ref(todayStr);
const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const weekDays = computed(() =>
  DAY_NAMES.map((name, i) => {
    const d = new Date(weekStart.value);
    d.setDate(d.getDate() + i);
    const iso = toDateStr(d);
    return { name, date: d.getDate(), iso, isToday: iso === todayStr };
  })
);

const selectedDayLabel = computed(() => {
  const d = new Date(selectedDay.value + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
});

function prevWeek() {
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() - 7);
  weekStart.value = d;
  const sel = new Date(selectedDay.value + "T00:00:00");
  sel.setDate(sel.getDate() - 7);
  selectedDay.value = toDateStr(sel);
  fetchWeeklyTasks();
}
function nextWeek() {
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() + 7);
  weekStart.value = d;
  const sel = new Date(selectedDay.value + "T00:00:00");
  sel.setDate(sel.getDate() + 7);
  selectedDay.value = toDateStr(sel);
  fetchWeeklyTasks();
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
const weeklyTasks = ref<Task[]>([]);
const isLoading = ref(false);

async function fetchWeeklyTasks() {
  isLoading.value = true;
  try {
    const resp = (await $fetch(`${API}/api/tasks/weekly?date=${selectedDay.value}`, {
      headers: { Accept: "application/json" },
    })) as any;
    // The weekly endpoint returns { week_start, week_end, tasks: [...] }
    if (Array.isArray(resp)) {
      weeklyTasks.value = resp as Task[];
    } else if (resp && Array.isArray(resp.tasks)) {
      weeklyTasks.value = resp.tasks as Task[];
    } else {
      weeklyTasks.value = [];
    }
  } catch {
    try {
      const data = await $fetch<Task[]>(`${API}/api/tasks`, {
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      });
      weeklyTasks.value = Array.isArray(data) ? data : [];
    } catch {
      weeklyTasks.value = [];
    }
  } finally {
    isLoading.value = false;
  }
}

await fetchWeeklyTasks();

const activeTab = ref<"upcoming" | "completed">("upcoming");

const filteredTasks = computed(() =>
  weeklyTasks.value.filter((t) => {
    const matchesDay = !t.due_date || t.due_date === selectedDay.value;
    if (activeTab.value === "completed") return t.status === "completed" && matchesDay;
    return t.status !== "completed" && matchesDay;
  })
);

const highPriorityCount = computed(
  () =>
    weeklyTasks.value.filter((t) => t.priority === "high" && t.status !== "completed")
      .length
);

const focusSessions = computed(() =>
  weeklyTasks.value
    .filter((t) => t.start_time && t.due_date === selectedDay.value)
    .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""))
    .slice(0, 3)
);

// ── Add task ──────────────────────────────────────────────────────────────────
const newTitle = ref("");
const newPriority = ref<Priority>("medium");
const newCategory = ref("core_work");
const taskError = ref("");

async function addTask() {
  const title = newTitle.value.trim();
  if (!title) return;
  taskError.value = "";
  try {
    await $fetch(`${API}/api/tasks`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: {
        title,
        description: "",
        status: "pending",
        priority: newPriority.value,
        due_date: selectedDay.value,
        start_time: null,
        end_time: null,
        category: newCategory.value,
      },
    });
    newTitle.value = "";
    newPriority.value = "medium";
    await fetchWeeklyTasks();
  } catch (e: any) {
    taskError.value = e?.data?.message ?? "Failed to create task.";
  }
}

// ── Edit task ─────────────────────────────────────────────────────────────────
const editingTask = ref<Task | null>(null);
const editForm = ref({
  title: "",
  description: "",
  priority: "medium" as Priority,
  status: "pending" as TaskStatus,
  due_date: "",
  start_time: "",
  end_time: "",
  category: "core_work",
});
const updateError = ref("");

function openEdit(task: Task) {
  editingTask.value = task;
  editForm.value = {
    title: task.title ?? "",
    description: task.description ?? "",
    priority: task.priority ?? "medium",
    status: task.status ?? "pending",
    due_date: task.due_date ?? "",
    start_time: task.start_time ? task.start_time.substring(0, 5) : "",
    end_time: task.end_time ? task.end_time.substring(0, 5) : "",
    category: task.category ?? "core_work",
  };
  updateError.value = "";
}
function closeEdit() {
  editingTask.value = null;
}

async function updateTask() {
  if (!editingTask.value) return;
  updateError.value = "";
  try {
    await $fetch(`${API}/api/tasks/${editingTask.value.id}`, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: {
        ...editForm.value,
        start_time: editForm.value.start_time || null,
        end_time: editForm.value.end_time || null,
      },
    });
    closeEdit();
    await fetchWeeklyTasks();
  } catch (e: any) {
    updateError.value = e?.data?.message ?? "Failed to update task.";
  }
}

async function deleteTask(id: number) {
  try {
    await $fetch(`${API}/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    await fetchWeeklyTasks();
  } catch {}
}

async function toggleStatus(task: Task) {
  const newStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
  try {
    await $fetch(`${API}/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        due_date: task.due_date,
        start_time: task.start_time || null,
        end_time: task.end_time || null,
        category: task.category,
      },
    });
    task.status = newStatus;
  } catch {}
}

// ── Style maps ────────────────────────────────────────────────────────────────
const priorityBar: Record<Priority, string> = {
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-emerald-400",
};
const priorityBadge: Record<Priority, string> = {
  high: "text-rose-500",
  medium: "text-amber-500",
  low: "text-emerald-600",
};
const priorityBtnActive: Record<Priority, string> = {
  high: "bg-rose-100 text-rose-600 border-rose-200",
  medium: "bg-amber-100 text-amber-600 border-amber-200",
  low: "bg-emerald-100 text-emerald-600 border-emerald-200",
};
const sessionColors = [
  {
    bg: "bg-emerald-50",
    title: "text-emerald-900",
    meta: "text-emerald-700",
    border: "border-emerald-100",
  },
  {
    bg: "bg-sky-50",
    title: "text-sky-900",
    meta: "text-sky-700",
    border: "border-sky-100",
  },
  {
    bg: "bg-violet-50",
    title: "text-violet-900",
    meta: "text-violet-700",
    border: "border-violet-100",
  },
];

function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h ?? "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}
function getSessionColor(i: number) {
  return sessionColors[i % sessionColors.length]!;
}

const statusOptions: TaskStatus[] = ["pending", "in_progress", "completed"];
const priorityOptions: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];
const categoryOptions = [
  { value: "core_work", label: "Core Work" },
  { value: "admin", label: "Admin" },
  { value: "learning", label: "Learning" },
  { value: "personal", label: "Personal" },
  { value: "health", label: "Health" },
];

// ── Category dropdown ─────────────────────────────────────────────────────────
const categoryOpen = ref(false);
const editCategoryOpen = ref(false);
const categoryDropdownRef = ref<HTMLElement | null>(null);
const editCategoryDropdownRef = ref<HTMLElement | null>(null);

const categoryConfig: Record<
  string,
  { icon: string; color: string; bg: string; ring: string }
> = {
  core_work: {
    icon: "💼",
    color: "text-violet-700",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
  },
  admin: { icon: "📋", color: "text-sky-700", bg: "bg-sky-50", ring: "ring-sky-200" },
  learning: {
    icon: "📚",
    color: "text-amber-700",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
  },
  personal: {
    icon: "🌿",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
  health: { icon: "❤️", color: "text-rose-700", bg: "bg-rose-50", ring: "ring-rose-200" },
};

function getCategoryConf(val: string) {
  return (
    categoryConfig[val] ?? {
      icon: "📁",
      color: "text-gray-600",
      bg: "bg-gray-50",
      ring: "ring-gray-200",
    }
  );
}

function handleCategoryClickOutside(e: MouseEvent) {
  if (categoryDropdownRef.value && !categoryDropdownRef.value.contains(e.target as Node))
    categoryOpen.value = false;
  if (
    editCategoryDropdownRef.value &&
    !editCategoryDropdownRef.value.contains(e.target as Node)
  )
    editCategoryOpen.value = false;
}

onMounted(() => document.addEventListener("click", handleCategoryClickOutside));
onUnmounted(() => document.removeEventListener("click", handleCategoryClickOutside));

// ── Habits sidebar ────────────────────────────────────────────────────────────
interface SidebarHabit {
  id: number;
  name: string;
  frequency: string;
}
const { data: habitsData } = await useFetch<SidebarHabit[]>(`${API}/api/habits`, {
  headers: { Accept: "application/json" },
});
const habitDoneSet = ref<Set<number>>(new Set());
const sidebarHabits = computed(() =>
  (habitsData.value ?? [])
    .slice(0, 5)
    .map((h) => ({ id: h.id, label: h.name, on: habitDoneSet.value.has(h.id) }))
);
function toggleHabit(id: number) {
  if (habitDoneSet.value.has(id)) habitDoneSet.value.delete(id);
  else habitDoneSet.value.add(id);
  habitDoneSet.value = new Set(habitDoneSet.value);
}

// ── Mood ──────────────────────────────────────────────────────────────────────
const moods = [
  { value: "great", emoji: "😄", label: "GREAT", gif: "/gif/Smiley Emoji.gif" },
  { value: "good", emoji: "🙂", label: "GOOD", gif: "/gif/Happy.gif" },
  { value: "steady", emoji: "😊", label: "STEADY", gif: "/gif/Expressionless Face.gif" },
  { value: "low", emoji: "😐", label: "LOW", gif: "/gif/Sad Face.gif" },
  {
    value: "bad",
    emoji: "😔",
    label: "BAD",
    gif: "/gif/Angry emoji Lottie JSON animation.gif",
  },
] as const;
type MoodValue = typeof moods[number]["value"];
const selectedMood = ref<MoodValue>("great");

// ── Focus timer ───────────────────────────────────────────────────────────────
const TIMER_MINUTES = 25;
const timeLeft = ref(TIMER_MINUTES * 60);
const timerRunning = ref(false);
const activeTimerId = ref<number | null>(null);
let timerInterval: ReturnType<typeof setInterval> | null = null;

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
    .toString()
    .padStart(2, "0");
  const s = (timeLeft.value % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
});

async function startTimer() {
  if (timerRunning.value) return;
  // Register with API if available, but never block the timer from starting
  try {
    const timer = await $fetch<{ id: number }>(`${API}/api/focus-timers/start`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: { duration: TIMER_MINUTES },
    });
    activeTimerId.value = timer.id;
  } catch {}
  // Always start the local countdown regardless of API result
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
      timeLeft.value = TIMER_MINUTES * 60;
    }
  }, 1000);
}

async function stopTimer() {
  if (!timerRunning.value || activeTimerId.value === null) return;
  clearInterval(timerInterval!);
  timerRunning.value = false;
  try {
    await $fetch(`${API}/api/focus-timers/${activeTimerId.value}/stop`, {
      method: "PUT",
      headers: { Accept: "application/json" },
    });
  } catch {}
  activeTimerId.value = null;
  timeLeft.value = TIMER_MINUTES * 60;
}
</script>

<template>
  <main class="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6 sm:py-6">
    <div class="mx-auto flex max-w-6xl flex-col gap-5 lg:flex-row lg:gap-6">
      <!-- ── Main column ─────────────────────────────────────────────────── -->
      <section class="min-w-0 flex-1 space-y-5">
        <!-- Header -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">Daily Planner</h1>
            <p class="mt-1 text-sm text-gray-500">
              Focus on what matters today.
              <span v-if="highPriorityCount > 0" class="font-semibold text-amber-600">
                {{ highPriorityCount }} high-priority
              </span>
              <span v-else class="text-gray-400">All clear today.</span>
            </p>
          </div>

          <!-- Focus Score -->
          <div
            class="relative shrink-0 overflow-hidden rounded-2xl bg-gray-900 px-5 py-3.5 text-white shadow-sm sm:px-6 sm:py-4"
          >
            <div
              class="absolute inset-0 opacity-30"
              style="
                background: radial-gradient(
                  circle at 80% 120%,
                  #10b981 0%,
                  transparent 60%
                );
              "
            ></div>
            <div class="relative">
              <p class="text-[10px] font-bold tracking-[0.2em] text-gray-400">
                FOCUS SCORE
              </p>
              <div class="mt-1.5 flex items-center gap-2">
                <span class="text-2xl font-extrabold">86%</span>
                <svg
                  class="h-5 w-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick-add task bar -->
        <form
          @submit.prevent="addTask"
          class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg"
        >
          <div
            class="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400"
          ></div>

          <p
            v-if="taskError"
            class="border-b border-rose-100 bg-rose-50 px-5 py-2.5 text-xs font-medium text-rose-500"
          >
            {{ taskError }}
          </p>

          <div class="px-4 pb-4 pt-5 sm:px-5">
            <div class="flex items-center gap-3 sm:gap-4">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center">
                <img
                  src="/gif/add new.gif"
                  alt="Add"
                  class="h-full w-full object-cover"
                />
              </div>
              <input
                v-model="newTitle"
                type="text"
                placeholder="What needs to get done today?"
                class="flex-1 bg-transparent text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                class="shrink-0 rounded-xl bg-gradient-to-br from-gray-800 to-gray-950 px-4 py-2 text-xs font-bold tracking-wide text-white shadow-sm transition hover:from-gray-700 hover:to-gray-900 hover:shadow-md active:scale-95 sm:px-5 sm:py-2.5"
              >
                Add Task
              </button>
            </div>

            <div
              class="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3.5 sm:gap-3"
            >
              <span
                class="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400"
                >Priority</span
              >
              <div class="flex gap-1">
                <button
                  v-for="opt in priorityOptions"
                  :key="opt.value"
                  type="button"
                  @click="newPriority = opt.value"
                  class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition active:scale-95"
                  :class="
                    newPriority === opt.value
                      ? priorityBtnActive[opt.value]
                      : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                  "
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="priorityBar[opt.value]"
                  ></span>
                  {{ opt.label }}
                </button>
              </div>
              <div class="mx-1 hidden h-3.5 w-px bg-gray-200 sm:block"></div>
              <span
                class="hidden shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 sm:block"
                >Category</span
              >
              <!-- Custom category dropdown (quick-add bar) -->
              <div ref="categoryDropdownRef" class="relative hidden sm:block">
                <button
                  type="button"
                  @click.stop="categoryOpen = !categoryOpen"
                  class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold shadow-sm transition hover:border-gray-300 hover:shadow focus:outline-none"
                  :class="getCategoryConf(newCategory).color"
                >
                  <span class="leading-none">{{
                    getCategoryConf(newCategory).icon
                  }}</span>
                  <span>{{
                    categoryOptions.find((c) => c.value === newCategory)?.label
                  }}</span>
                  <svg
                    class="h-3 w-3 text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-180': categoryOpen }"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <Transition
                  enter-active-class="transition duration-150 ease-out origin-top"
                  enter-from-class="opacity-0 scale-95 -translate-y-1"
                  enter-to-class="opacity-100 scale-100 translate-y-0"
                  leave-active-class="transition duration-100 ease-in origin-top"
                  leave-from-class="opacity-100 scale-100 translate-y-0"
                  leave-to-class="opacity-0 scale-95 -translate-y-1"
                >
                  <div
                    v-if="categoryOpen"
                    class="absolute left-0 top-full z-30 mt-1.5 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl"
                  >
                    <div class="space-y-0.5 p-1.5">
                      <button
                        v-for="c in categoryOptions"
                        :key="c.value"
                        type="button"
                        @click.stop="
                          newCategory = c.value;
                          categoryOpen = false;
                        "
                        class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all"
                        :class="
                          newCategory === c.value
                            ? [
                                getCategoryConf(c.value).bg,
                                getCategoryConf(c.value).color,
                                'ring-1',
                                getCategoryConf(c.value).ring,
                              ]
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        "
                      >
                        <span class="text-sm leading-none">{{
                          getCategoryConf(c.value).icon
                        }}</span>
                        {{ c.label }}
                        <svg
                          v-if="newCategory === c.value"
                          class="ml-auto h-3 w-3 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </form>

        <!-- Week strip -->
        <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div class="mb-4 flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700">{{
              selectedDayLabel
            }}</span>
            <div class="flex gap-1">
              <button
                @click="prevWeek"
                class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 active:scale-95"
                aria-label="Previous week"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                @click="nextWeek"
                class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 active:scale-95"
                aria-label="Next week"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-7 gap-1 sm:gap-2">
            <button
              v-for="d in weekDays"
              :key="d.iso"
              @click="selectedDay = d.iso"
              class="flex flex-col items-center rounded-xl py-2.5 transition-all duration-150 sm:py-3"
              :class="
                selectedDay === d.iso
                  ? 'border-2 border-gray-800 bg-white text-gray-900'
                  : d.isToday
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              "
            >
              <span class="text-[9px] font-bold tracking-widest sm:text-[10px]">{{
                d.name
              }}</span>
              <span class="mt-1 text-base font-bold sm:text-lg">{{ d.date }}</span>
              <span
                v-if="d.isToday && selectedDay !== d.iso"
                class="mt-1 h-1 w-1 rounded-full bg-emerald-400"
              ></span>
            </button>
          </div>
        </div>

        <!-- Tasks section -->
        <div>
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-base font-bold text-gray-900 sm:text-lg">Tasks</h2>
            <div class="flex items-center gap-1 text-sm font-medium">
              <button
                @click="activeTab = 'upcoming'"
                class="rounded-lg px-3 py-1.5 transition"
                :class="
                  activeTab === 'upcoming'
                    ? 'text-gray-900 underline underline-offset-4 decoration-2 decoration-emerald-500'
                    : 'text-gray-400 hover:text-gray-600'
                "
              >
                Upcoming
              </button>
              <button
                @click="activeTab = 'completed'"
                class="rounded-lg px-3 py-1.5 transition"
                :class="
                  activeTab === 'completed'
                    ? 'text-gray-900 underline underline-offset-4 decoration-2 decoration-emerald-500'
                    : 'text-gray-400 hover:text-gray-600'
                "
              >
                Completed
              </button>
            </div>
          </div>

          <!-- Loading skeleton -->
          <div v-if="isLoading" class="space-y-2.5">
            <div
              v-for="i in 3"
              :key="i"
              class="h-16 animate-pulse rounded-xl bg-gray-100"
            ></div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="filteredTasks.length === 0"
            class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-14 text-center"
          >
            <div
              class="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50"
            >
              <svg
                class="h-7 w-7 text-gray-300"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p class="text-sm font-semibold text-gray-600">
              No {{ activeTab === "completed" ? "completed" : "upcoming" }} tasks
            </p>
            <p class="mt-1 text-xs text-gray-400">Add a task below to get started</p>
          </div>

          <!-- Task list -->
          <ul v-else class="space-y-2">
            <li
              v-for="task in filteredTasks"
              :key="task.id"
              class="group flex items-stretch overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
            >
              <!-- Priority bar -->
              <span class="w-1 shrink-0" :class="priorityBar[task.priority]"></span>

              <!-- Checkbox -->
              <div class="flex items-center pl-3.5">
                <button
                  @click="toggleStatus(task)"
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 active:scale-90"
                  :class="
                    task.status === 'completed'
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-300 hover:border-emerald-400'
                  "
                  :aria-label="
                    task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'
                  "
                >
                  <svg
                    v-if="task.status === 'completed'"
                    class="h-3 w-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1 px-3.5 py-3">
                <p
                  class="truncate text-sm font-semibold leading-snug"
                  :class="
                    task.status === 'completed'
                      ? 'text-gray-400 line-through'
                      : 'text-gray-900'
                  "
                >
                  {{ task.title }}
                </p>
                <p class="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    class="font-bold uppercase tracking-wide"
                    :class="priorityBadge[task.priority]"
                    >{{ task.priority }}</span
                  >
                  <span
                    v-if="task.start_time"
                    class="flex items-center gap-1 text-gray-400"
                  >
                    <svg
                      class="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path stroke-linecap="round" d="M12 7v5l3 3" />
                    </svg>
                    {{ formatTime(task.start_time)
                    }}<span v-if="task.end_time"> – {{ formatTime(task.end_time) }}</span>
                  </span>
                  <span
                    v-if="task.category"
                    class="rounded-full bg-gray-100 px-2 py-0.5 capitalize text-gray-500"
                  >
                    {{ task.category.replace("_", " ") }}
                  </span>
                </p>
              </div>

              <!-- Actions -->
              <div
                class="flex items-center gap-0.5 pr-2 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <button
                  @click="openEdit(task)"
                  class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-90"
                  aria-label="Edit"
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
                      d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z"
                    />
                  </svg>
                </button>
                <button
                  @click="deleteTask(task.id)"
                  class="rounded-lg p-1.5 text-gray-400 transition hover:bg-rose-50 hover:text-rose-500 active:scale-90"
                  aria-label="Delete"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10"
                    />
                  </svg>
                </button>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- ── Right sidebar ───────────────────────────────────────────────── -->
      <aside
        class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:w-72 lg:shrink-0 lg:grid-cols-1 lg:space-y-0"
      >
        <!-- Daily Mood -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p class="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Daily Mood
          </p>
          <div class="flex justify-between">
            <button
              v-for="m in moods"
              :key="m.value"
              @click="selectedMood = m.value"
              class="flex flex-col items-center gap-1 rounded-xl p-2 transition-all duration-150 active:scale-90"
              :class="
                selectedMood === m.value
                  ? 'bg-emerald-50 ring-2 ring-emerald-200'
                  : 'hover:bg-gray-50'
              "
              :aria-label="m.label"
            >
              <img
                :src="m.gif"
                :alt="m.label"
                class="h-9 w-9 object-contain transition-all duration-200"
                :class="
                  selectedMood === m.value
                    ? 'scale-125 drop-shadow-md'
                    : 'opacity-35 grayscale'
                "
              />
            </button>
          </div>
          <p
            class="mt-3 text-center text-[10px] font-bold tracking-[0.2em] text-gray-500"
          >
            {{ moods.find((m) => m.value === selectedMood)?.label }}
          </p>
        </div>

        <!-- Focus Sessions -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
              Focus Sessions
            </p>
          </div>

          <div v-if="focusSessions.length > 0" class="space-y-2">
            <div
              v-for="(session, i) in focusSessions"
              :key="session.id"
              class="rounded-xl border p-3 transition hover:shadow-sm"
              :class="[getSessionColor(i).bg, getSessionColor(i).border]"
            >
              <p class="text-xs font-bold" :class="getSessionColor(i).meta">
                {{ formatTime(session.start_time)
                }}<span v-if="session.end_time">
                  – {{ formatTime(session.end_time) }}</span
                >
              </p>
              <p
                class="mt-0.5 truncate text-sm font-semibold"
                :class="getSessionColor(i).title"
              >
                {{ session.title }}
              </p>
            </div>
          </div>
          <p v-else class="text-xs text-gray-400">No sessions scheduled today.</p>

          <!-- Mini Pomodoro -->
          <div
            class="relative mt-4 overflow-hidden rounded-xl bg-gray-900 p-4 text-center text-white"
          >
            <div
              class="absolute inset-0 opacity-20"
              style="
                background: radial-gradient(
                  circle at 50% 120%,
                  #10b981 0%,
                  transparent 60%
                );
              "
            ></div>
            <p class="text-[10px] font-bold tracking-[0.2em] text-gray-400">DEEP WORK</p>
            <p
              class="mt-1 text-3xl font-extrabold tracking-tight"
              style="font-variant-numeric: tabular-nums"
            >
              {{ formattedTime }}
            </p>
            <button
              v-if="!timerRunning"
              @click="startTimer"
              class="mt-3 w-full rounded-lg bg-emerald-400 py-2 text-xs font-bold text-gray-900 transition hover:bg-emerald-300 active:scale-95"
            >
              Start Flow
            </button>
            <button
              v-else
              @click="stopTimer"
              class="mt-3 w-full rounded-lg bg-rose-500 py-2 text-xs font-bold text-white transition hover:bg-rose-400 active:scale-95"
            >
              Stop
            </button>
          </div>
        </div>

        <!-- Daily Habits -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p class="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Daily Habits
          </p>
          <ul v-if="sidebarHabits.length > 0" class="space-y-3">
            <li
              v-for="h in sidebarHabits"
              :key="h.id"
              class="flex items-center justify-between gap-3"
            >
              <span class="truncate text-sm text-gray-700">{{ h.label }}</span>
              <button
                @click="toggleHabit(h.id)"
                class="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
                :class="h.on ? 'bg-emerald-400' : 'bg-gray-200'"
                role="switch"
                :aria-checked="h.on"
              >
                <span
                  class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
                  :class="h.on ? 'left-[18px]' : 'left-0.5'"
                ></span>
              </button>
            </li>
          </ul>
          <p v-else class="text-xs text-gray-400">No habits yet.</p>
        </div>

        <!-- Quote card -->
      </aside>
    </div>
  </main>

  <!-- ── Edit Modal ──────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="ff-modal">
      <div
        v-if="editingTask"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
        @click.self="closeEdit"
      >
        <div class="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-900">Edit Task</h3>
            <button
              @click="closeEdit"
              class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p
            v-if="updateError"
            class="mb-4 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600"
          >
            {{ updateError }}
          </p>

          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-500"
                >Title</label
              >
              <input
                v-model="editForm.title"
                type="text"
                class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-500"
                >Description</label
              >
              <textarea
                v-model="editForm.description"
                rows="2"
                class="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-gray-500"
                  >Priority</label
                >
                <div class="flex gap-1.5">
                  <button
                    v-for="opt in priorityOptions"
                    :key="opt.value"
                    type="button"
                    @click="editForm.priority = opt.value"
                    class="flex-1 rounded-lg border py-2 text-xs font-bold tracking-wide transition active:scale-95"
                    :class="
                      editForm.priority === opt.value
                        ? priorityBtnActive[opt.value]
                        : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                    "
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-gray-500"
                  >Status</label
                >
                <select
                  v-model="editForm.status"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none"
                >
                  <option v-for="s in statusOptions" :key="s" :value="s">
                    {{ s.replace("_", " ") }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Custom category dropdown (edit modal) -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-500"
                >Category</label
              >
              <div ref="editCategoryDropdownRef" class="relative">
                <button
                  type="button"
                  @click.stop="editCategoryOpen = !editCategoryOpen"
                  class="flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold shadow-sm transition hover:border-gray-300 focus:outline-none"
                  :class="getCategoryConf(editForm.category).color"
                >
                  <span class="text-base leading-none">{{
                    getCategoryConf(editForm.category).icon
                  }}</span>
                  <span class="flex-1 text-left">{{
                    categoryOptions.find((c) => c.value === editForm.category)?.label
                  }}</span>
                  <svg
                    class="h-4 w-4 text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-180': editCategoryOpen }"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <Transition
                  enter-active-class="transition duration-150 ease-out origin-top"
                  enter-from-class="opacity-0 scale-95 -translate-y-1"
                  enter-to-class="opacity-100 scale-100 translate-y-0"
                  leave-active-class="transition duration-100 ease-in origin-top"
                  leave-from-class="opacity-100 scale-100 translate-y-0"
                  leave-to-class="opacity-0 scale-95 -translate-y-1"
                >
                  <div
                    v-if="editCategoryOpen"
                    class="absolute left-0 top-full z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl"
                  >
                    <div class="space-y-0.5 p-1.5">
                      <button
                        v-for="c in categoryOptions"
                        :key="c.value"
                        type="button"
                        @click.stop="
                          editForm.category = c.value;
                          editCategoryOpen = false;
                        "
                        class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all"
                        :class="
                          editForm.category === c.value
                            ? [
                                getCategoryConf(c.value).bg,
                                getCategoryConf(c.value).color,
                                'ring-1',
                                getCategoryConf(c.value).ring,
                              ]
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        "
                      >
                        <span class="text-base leading-none">{{
                          getCategoryConf(c.value).icon
                        }}</span>
                        {{ c.label }}
                        <svg
                          v-if="editForm.category === c.value"
                          class="ml-auto h-3.5 w-3.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-500"
                >Due Date</label
              >
              <input
                v-model="editForm.due_date"
                type="date"
                class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-gray-500"
                  >Start Time</label
                >
                <input
                  v-model="editForm.start_time"
                  type="time"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-gray-500"
                  >End Time</label
                >
                <input
                  v-model="editForm.end_time"
                  type="time"
                  class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button
              type="button"
              @click="closeEdit"
              class="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="updateTask"
              class="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 active:scale-95"
            >
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
  transform: translateY(16px);
}
</style>
