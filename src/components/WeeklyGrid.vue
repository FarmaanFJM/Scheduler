<!--
  WeeklyGrid — 7-day × hour schedule grid.
  Mirrors WeeklyRenderer from the Obsidian plugin.
-->
<template>
  <section class="scheduler-weekly-section">
    <!-- Header -->
    <div class="scheduler-section-header">
      <div class="header-title-container">
        <h2>Weekly Schedule</h2>
        <div class="week-navigation">
          <button class="nav-btn" @click="changeWeek(-1)">◀</button>
          <span class="week-label">{{ weekRangeString }}</span>
          <button class="nav-btn" @click="changeWeek(1)">▶</button>
          <button class="today-btn" @click="scheduler.jumpToCurrentWeek()">Today</button>
          <div class="week-jump-container">
            <input v-model="jumpDate" type="date" class="week-jump-input" />
            <button class="nav-btn week-jump-btn" @click="doJump">Go</button>
          </div>
        </div>
      </div>
      <div class="header-button-group">
        <button class="populate-btn" @click="scheduler.populateStandardTasks()">Insert Standard Tasks</button>
        <button class="clear-weekly-btn" @click="confirmClearNonStandard">🗑️ Clear Non-Standard Tasks</button>
        <button class="clear-all-btn" @click="confirmClearAll">🗑️ Clear All Week Tasks</button>
      </div>
    </div>

    <!-- Grid -->
    <div class="weekly-grid">
      <!-- Header row -->
      <div class="weekly-header-row">
        <div class="time-header">Time</div>
        <div
          v-for="(day, idx) in days"
          :key="day"
          class="day-header"
          :class="{ 'is-today': idx === currentDay && isCurrentWeek }"
        >{{ day }}</div>
      </div>

      <!-- Hour rows -->
      <div v-for="hour in visibleHours" :key="hour" class="weekly-hour-row">
        <div
          class="time-cell"
          :class="{ 'current-hour-label': isCurrentHour(hour), 'current-hour-cell': isCurrentHour(hour) }"
        >
          {{ String(hour).padStart(2, '0') }}:00
        </div>

        <div
          v-for="(_, dayIdx) in days"
          :key="dayIdx"
          class="day-cell"
          :class="{
            'is-today': dayIdx === currentDay && isCurrentWeek,
            'current-hour-cell': isCurrentHour(hour) && dayIdx === currentDay && isCurrentWeek,
          }"
          :data-day="dayIdx"
          :data-hour="hour"
          @click="onCellClick(dayIdx, hour)"
        >
          <ItemCard
            v-for="item in scheduler.getItemsForCell(dayIdx, hour)"
            :key="item.id"
            :item="item"
            :category="scheduler.getCategoryById(item.categoryId)"
            @edit="openEditDialog(item)"
            @delete="scheduler.removeItem(item.id)"
            @toggle="scheduler.updateItem(item.id, { completed: !item.completed })"
          />
        </div>
      </div>
    </div>

    <!-- Add item dialog -->
    <AddItemDialog
      v-if="addDialog.open"
      :title="addDialog.title"
      :categories="scheduler.settings.value.categories"
      @submit="onAddItem"
      @close="addDialog.open = false"
    />

    <!-- Edit item dialog -->
    <EditItemDialog
      v-if="editDialog.open && editDialog.item"
      :item="editDialog.item"
      :categories="scheduler.settings.value.categories"
      @submit="(u) => scheduler.updateItem(editDialog.item!.id, u)"
      @close="editDialog.open = false"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useScheduler } from '../composables/useScheduler'
import { DateUtils } from '../core/utils/dateUtils'
import type { SchedulerItem } from '../core/types'
import ItemCard from './ItemCard.vue'
import AddItemDialog from './AddItemDialog.vue'
import EditItemDialog from './EditItemDialog.vue'

const scheduler = useScheduler()

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const jumpDate = ref('')

const weekRangeString = computed(() => {
  const start = DateUtils.getDateOfWeek(scheduler.currentWeek.value, scheduler.currentYear.value)
  const end = DateUtils.getSunday(start)
  return DateUtils.getWeekRangeString(start, end)
})

const visibleHours = computed(() => {
  const ss = scheduler.settings.value.sleepSchedule
  const start = ss.enabled ? ss.wakeTime : 0
  const end = ss.enabled ? ss.sleepTime : 23
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const currentDay = computed(() => (new Date().getDay() + 6) % 7)
const isCurrentWeek = computed(() => {
  const { weekNumber, year } = DateUtils.getCurrentWeekInfo()
  return scheduler.currentWeek.value === weekNumber && scheduler.currentYear.value === year
})

function isCurrentHour(hour: number) {
  return isCurrentWeek.value && new Date().getHours() === hour
}

// Add dialog state
const addDialog = ref<{ open: boolean; day: number; hour: number; title: string }>({
  open: false, day: 0, hour: 0, title: '',
})

function onCellClick(day: number, hour: number) {
  addDialog.value = {
    open: true,
    day,
    hour,
    title: `${days[day]} at ${String(hour).padStart(2, '0')}:00`,
  }
}

async function onAddItem(item: Omit<SchedulerItem, 'id'>) {
  await scheduler.addItemToSchedule(addDialog.value.day, addDialog.value.hour, item)
}

// Edit dialog state
const editDialog = ref<{ open: boolean; item: SchedulerItem | null }>({ open: false, item: null })

function openEditDialog(item: SchedulerItem) {
  editDialog.value = { open: true, item }
}

async function changeWeek(delta: number) {
  await scheduler.changeWeek(delta)
}

async function doJump() {
  if (jumpDate.value) await scheduler.jumpToDate(jumpDate.value)
}

function confirmClearNonStandard() {
  if (confirm('Clear all non-standard tasks for current week?')) {
    scheduler.clearNonStandardTasks()
  }
}

function confirmClearAll() {
  if (confirm('Clear ALL tasks for current week (including standard/recurring)?')) {
    scheduler.clearAllTasks()
  }
}

// Time indicator auto-refresh
let timeInterval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timeInterval = setInterval(() => {
    // Force reactivity update for current hour highlighting
  }, 60000)
})
onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})
</script>
