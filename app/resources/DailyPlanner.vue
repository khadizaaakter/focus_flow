<script setup lang="ts">
const week = [
  { day: "MON", date: 22 },
  { day: "TUE", date: 23 },
  { day: "WED", date: 24 },
  { day: "THU", date: 25 },
  { day: "FRI", date: 26 },
  { day: "SAT", date: 27 },
  { day: "SUN", date: 28 },
];
const selectedDate = ref(24);

type Priority = "HIGH" | "MEDIUM" | "LOW";
interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  time: string;
  priority: Priority;
  done: boolean;
}

const { data: tasks, refresh } = await useFetch<Task[]>("/api/tasks", {
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const newDescription = ref("");
const newPriority = ref<Priority>("MEDIUM");
const newDueDate = ref("");
const newStartTime = ref("");
const newEndTime = ref("");

const taskError = ref("");

async function addTask() {
  const description = newDescription.value.trim();
  if (!description) return;
  taskError.value = "";
  try {
    await $fetch("/api/tasks", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: {
        description,
        priority: newPriority.value.toLowerCase(),
        status: "pending",
        due_date: newDueDate.value,
        start_time: newStartTime.value,
        end_time: newEndTime.value,
      },
    });
    newDescription.value = "";
    newPriority.value = "MEDIUM";
    newDueDate.value = "";
    newStartTime.value = "";
    newEndTime.value = "";
    await refresh();
  } catch (e: any) {
    taskError.value = e?.data?.message ?? "Failed to create task.";
  }
}

const priorityOptions: { value: Priority; label: string }[] = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const prioritySelectStyles: Record<Priority, string> = {
  HIGH: "bg-rose-100 text-rose-600 border-rose-200",
  MEDIUM: "bg-sky-100 text-sky-600 border-sky-200",
  LOW: "bg-gray-100 text-gray-500 border-gray-200",
};

const priorityStyles: Record<Priority, string> = {
  HIGH: "bg-rose-100 text-rose-600",
  MEDIUM: "bg-sky-100 text-sky-600",
  LOW: "bg-gray-100 text-gray-500",
};
const priorityBar: Record<Priority, string> = {
  HIGH: "bg-rose-400",
  MEDIUM: "bg-sky-400",
  LOW: "bg-emerald-400",
};

const habits = ref([
  { label: "Meditate 10m", on: false },
  { label: "Drink 2L Water", on: true },
  { label: "Read 20 Pages", on: false },
]);

const activeCount = (tasks: Task[] | null | undefined) =>
  (tasks ?? []).filter((t) => !t.done).length;
</script>

<template>
  <main class="flex-1 overflow-y-auto bg-gray-50 px-8 py-7">
    <div class="mx-auto flex max-w-5xl gap-7">
      <!-- Left / center column -->
      <section class="flex-1 space-y-6">
        <!-- Header -->
        <header class="flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Daily Planner</h2>
            <p class="mt-1 text-sm font-medium text-emerald-600">Wednesday, October 24</p>
          </div>
          <div class="flex items-center gap-3 text-gray-400">
            <button class="transition hover:text-gray-600" aria-label="Notifications">
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <button class="transition hover:text-gray-600" aria-label="Settings">
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 01-4 0v-.1A1.6 1.6 0 006 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003 13.9H3a2 2 0 010-4h.1A1.6 1.6 0 004.6 6l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 0010 3.1V3a2 2 0 014 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H21a2 2 0 010 4h-.1a1.6 1.6 0 00-1.5 1z"
                />
              </svg>
            </button>
          </div>
        </header>

        <!-- Quick add -->
        <form
          @submit.prevent="addTask"
          class="space-y-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
          <p v-if="taskError" class="text-xs font-medium text-rose-500">{{ taskError }}</p>
          <!-- Description row -->
          <div class="flex items-center gap-3">
            <svg
              class="h-5 w-5 shrink-0 text-emerald-500"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v8M8 12h8" />
            </svg>
            <input
              v-model="newDescription"
              type="text"
              placeholder="Add a task description..."
              class="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <!-- Priority + Due date + Submit row -->
          <div class="flex items-center gap-2 pl-8">
            <!-- Priority buttons -->
            <div class="flex gap-1">
              <button
                v-for="opt in priorityOptions"
                :key="opt.value"
                type="button"
                @click="newPriority = opt.value"
                class="rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide transition"
                :class="
                  newPriority === opt.value
                    ? prioritySelectStyles[opt.value]
                    : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'
                "
              >
                {{ opt.label }}
              </button>
            </div>

            <!-- Due date picker -->
            <div
              class="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5"
            >
              <svg
                class="h-3.5 w-3.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path stroke-linecap="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <input
                v-model="newDueDate"
                type="date"
                class="bg-transparent text-[11px] text-gray-500 focus:outline-none"
              />
            </div>

            <!-- Time range picker -->
            <div
              class="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5"
            >
              <svg
                class="h-3.5 w-3.5 shrink-0 text-gray-400"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="9" />
                <path stroke-linecap="round" d="M12 7v5l3 3" />
              </svg>
              <input
                v-model="newStartTime"
                type="time"
                class="bg-transparent text-[11px] text-gray-500 focus:outline-none"
              />
              <span class="text-[11px] text-gray-400">to</span>
              <input
                v-model="newEndTime"
                type="time"
                class="bg-transparent text-[11px] text-gray-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              class="ml-auto rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
            >
              Add Task
            </button>
          </div>
        </form>

        <!-- Weekly view -->
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Weekly View</h3>
            <div class="flex gap-1 text-gray-400">
              <button
                class="rounded p-1 transition hover:bg-gray-100"
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
                class="rounded p-1 transition hover:bg-gray-100"
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
          <div class="mt-4 grid grid-cols-7 gap-2">
            <button
              v-for="d in week"
              :key="d.date"
              @click="selectedDate = d.date"
              class="flex flex-col items-center rounded-lg py-3 transition"
              :class="
                selectedDate === d.date
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              "
            >
              <span class="text-[10px] font-semibold tracking-wide">{{ d.day }}</span>
              <span class="mt-1 text-lg font-bold">{{ d.date }}</span>
            </button>
          </div>
        </div>

        <!-- Tasks -->
        <div>
          <div class="mb-3 flex items-center gap-3">
            <h3 class="text-lg font-bold text-gray-900">Tasks</h3>
            <span
              class="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {{ activeCount(tasks) }} Active
            </span>
            <span
              class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500"
              >12 Done</span
            >
          </div>

          <ul class="space-y-3">
            <li
              v-for="task in tasks"
              :key="task.id"
              class="flex items-center gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white pr-4 shadow-sm"
            >
              <span class="h-12 w-1 shrink-0" :class="priorityBar[task.priority]"></span>
              <button
                @click="task.done = !task.done"
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition"
                :class="
                  task.done ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                "
                :aria-label="task.done ? 'Mark incomplete' : 'Mark complete'"
              >
                <svg
                  v-if="task.done"
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
              <div class="flex-1 py-3">
                <p
                  class="text-sm font-semibold"
                  :class="task.done ? 'text-gray-400 line-through' : 'text-gray-900'"
                >
                  {{ task.description }}
                </p>
                <!-- <p class="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                  <svg
                    class="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 8v4l2 2"
                    />
                  </svg>
                  {{ task.time }}
                </p> -->
              </div>
              <span
                class="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide"
                :class="priorityStyles[task.priority]"
              >
                {{ task.priority }}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Right column -->
      <aside class="w-64 shrink-0 space-y-5">
        <!-- Deep work focus timer -->
        <div class="rounded-2xl bg-gray-900 p-6 text-center text-white">
          <p class="text-[11px] font-semibold tracking-[0.2em] text-gray-400">
            DEEP WORK FOCUS
          </p>
          <p class="mt-3 text-5xl font-extrabold tracking-tight">25:00</p>
          <button
            class="mt-5 w-full rounded-lg bg-emerald-400 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-emerald-300"
          >
            Start Flow
          </button>
        </div>

        <!-- Daily habits -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Daily Habits</h3>
            <button
              class="text-emerald-500 transition hover:text-emerald-600"
              aria-label="Refresh habits"
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
                  d="M4 4v5h5M20 20v-5h-5M5 9a7 7 0 0111-3l3 3M19 15a7 7 0 01-11 3l-3-3"
                />
              </svg>
            </button>
          </div>
          <ul class="mt-4 space-y-3">
            <li
              v-for="habit in habits"
              :key="habit.label"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-600">{{ habit.label }}</span>
              <button
                @click="habit.on = !habit.on"
                class="relative h-5 w-9 rounded-full transition"
                :class="habit.on ? 'bg-emerald-400' : 'bg-gray-200'"
                role="switch"
                :aria-checked="habit.on"
              >
                <span
                  class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
                  :class="habit.on ? 'left-[18px]' : 'left-0.5'"
                ></span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Focus score -->
        <div class="relative overflow-hidden rounded-2xl bg-gray-900 p-6 text-white">
          <div
            class="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_70%_120%,#10b981_0%,transparent_55%)]"
          ></div>
          <div class="relative">
            <p class="text-[11px] font-semibold tracking-[0.2em] text-gray-400">
              FOCUS SCORE
            </p>
            <p class="mt-2 text-4xl font-extrabold">86%</p>
          </div>
        </div>
      </aside>
    </div>
  </main>
</template>
