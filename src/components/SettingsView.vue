<!--
  SettingsView — app settings panel.
  Mirrors SchedulerSettingTab from the Obsidian plugin.
  Opened via a settings button in the main toolbar.
-->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box modal-settings">
      <div class="settings-header">
        <h2>Scheduler Settings</h2>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>

      <!-- ── Categories ──────────────────────────────────────── -->
      <h3>Categories</h3>
      <p class="setting-desc">Define color categories for your scheduler items.</p>

      <div
        v-for="(cat, idx) in localSettings.categories"
        :key="cat.id"
        class="setting-row"
      >
        <input v-model="cat.name" class="field-input cat-name-input" placeholder="Category name" />
        <input v-model="cat.color" type="color" class="color-picker" />
        <button class="btn-danger-small" @click="deleteCategory(idx)">Delete</button>
      </div>

      <button class="btn-primary btn-sm" @click="addCategory">Add Category</button>

      <!-- ── Sleep Schedule ──────────────────────────────────── -->
      <h3>Sleep Schedule</h3>
      <p class="setting-desc">Shrink the weekly grid to show only your active hours.</p>

      <div class="setting-row">
        <label class="setting-label">Enable Sleep Schedule</label>
        <input type="checkbox" v-model="localSettings.sleepSchedule.enabled" class="toggle-cb" />
      </div>

      <div class="setting-row">
        <label class="setting-label">Sleep Time</label>
        <select v-model.number="localSettings.sleepSchedule.sleepTime" class="field-input setting-select">
          <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00</option>
        </select>
      </div>

      <div class="setting-row">
        <label class="setting-label">Wake Time</label>
        <select v-model.number="localSettings.sleepSchedule.wakeTime" class="field-input setting-select">
          <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00</option>
        </select>
      </div>

      <div class="setting-row-block">
        <label class="setting-label">Skip "Wake Up" on days:</label>
        <div class="day-toggles">
          <button
            v-for="(d, i) in dayNames"
            :key="d"
            class="sleep-day-toggle-btn"
            :class="{ excluded: localSettings.sleepSchedule.excludeWakeDays?.includes(i) }"
            @click="toggleExcludeDay('excludeWakeDays', i)"
          >{{ d }}</button>
        </div>
      </div>

      <div class="setting-row-block">
        <label class="setting-label">Skip "Sleep" on days:</label>
        <div class="day-toggles">
          <button
            v-for="(d, i) in dayNames"
            :key="d"
            class="sleep-day-toggle-btn"
            :class="{ excluded: localSettings.sleepSchedule.excludeSleepDays?.includes(i) }"
            @click="toggleExcludeDay('excludeSleepDays', i)"
          >{{ d }}</button>
        </div>
      </div>

      <!-- ── Recurring Tasks ─────────────────────────────────── -->
      <h3>Recurring Tasks</h3>
      <p class="setting-desc">Tasks that auto-populate into your weekly schedule.</p>

      <div
        v-for="(task, idx) in localSettings.standardItems"
        :key="task.name + idx"
        class="setting-row"
      >
        <span class="standard-task-name">{{ task.name }}</span>
        <span class="standard-task-schedule">{{ scheduleDesc(task) }}</span>
        <button class="btn-secondary btn-sm" @click="editStandardTask(idx)">Edit</button>
        <button class="btn-danger-small" @click="deleteStandardTask(idx)">Delete</button>
      </div>

      <button class="btn-primary btn-sm" @click="addStandardTask">Add Recurring Task</button>

      <!-- ── Task Management ─────────────────────────────────── -->
      <h3>Task Management</h3>

      <div class="setting-row">
        <span class="setting-label">Populate Sleep/Wake/Recurring tasks for current week</span>
        <button class="btn-primary btn-sm" @click="scheduler.populateStandardTasks()">Populate Now</button>
      </div>

      <div class="setting-row">
        <span class="setting-label">Clear Non-Standard Tasks (current week)</span>
        <button class="btn-warning btn-sm" @click="confirmClearNonStandard">Clear Now</button>
      </div>

      <div class="setting-row">
        <span class="setting-label">Clear ALL Tasks (current week, including recurring)</span>
        <button class="btn-danger btn-sm" @click="confirmClearAll">Clear Everything</button>
      </div>

      <!-- Footer buttons -->
      <div class="modal-buttons settings-footer">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="saveAndClose">Save Settings</button>
      </div>
    </div>
  </div>

  <!-- Edit standard task dialog (nested portal) -->
  <EditStandardTaskDialog
    v-if="stdTaskDialog.open"
    :task="stdTaskDialog.task!"
    :isNew="stdTaskDialog.isNew"
    :categories="localSettings.categories"
    @submit="onStdTaskSubmit"
    @close="stdTaskDialog.open = false"
  />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useScheduler } from '../composables/useScheduler'
import type { SchedulerSettings, StandardItemConfig } from '../core/types'
import EditStandardTaskDialog from './EditStandardTaskDialog.vue'

const emit = defineEmits<{ (e: 'close'): void }>()

const scheduler = useScheduler()

// Deep-clone settings so we don't mutate until Save
const localSettings = reactive<SchedulerSettings>(
  JSON.parse(JSON.stringify(scheduler.settings.value)),
)

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toggleExcludeDay(field: 'excludeWakeDays' | 'excludeSleepDays', idx: number) {
  const arr = localSettings.sleepSchedule[field] ?? []
  const pos = arr.indexOf(idx)
  if (pos > -1) arr.splice(pos, 1)
  else arr.push(idx)
  localSettings.sleepSchedule[field] = arr
}

function addCategory() {
  localSettings.categories.push({
    id: `category-${Date.now()}`,
    name: 'New Category',
    color: '#000000',
  })
}

function deleteCategory(idx: number) {
  localSettings.categories.splice(idx, 1)
}

function scheduleDesc(task: StandardItemConfig): string {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  let desc = ''
  for (const dayStr in task.schedule) {
    const day = parseInt(dayStr)
    const hours = task.schedule[day]
    if (hours.length > 0) {
      const hoursList = hours.map(h => String(h).padStart(2, '0') + ':00').join(', ')
      desc += `${days[day]}: ${hoursList}; `
    }
  }
  return desc || 'No schedule set'
}

function deleteStandardTask(idx: number) {
  localSettings.standardItems.splice(idx, 1)
}

// Standard task modal
const stdTaskDialog = ref<{ open: boolean; task: StandardItemConfig | null; isNew: boolean; editIdx: number }>({
  open: false, task: null, isNew: false, editIdx: -1,
})

function addStandardTask() {
  stdTaskDialog.value = {
    open: true,
    isNew: true,
    editIdx: -1,
    task: {
      name: 'New Task',
      description: '',
      categoryId: localSettings.categories[0]?.id || 'other',
      schedule: { 0: [9] },
    },
  }
}

function editStandardTask(idx: number) {
  stdTaskDialog.value = {
    open: true,
    isNew: false,
    editIdx: idx,
    task: JSON.parse(JSON.stringify(localSettings.standardItems[idx])),
  }
}

function onStdTaskSubmit(task: StandardItemConfig) {
  if (stdTaskDialog.value.isNew) {
    localSettings.standardItems.push(task)
  } else {
    localSettings.standardItems[stdTaskDialog.value.editIdx] = task
  }
}

function confirmClearNonStandard() {
  if (confirm('Clear all non-standard tasks from current week? This cannot be undone.')) {
    scheduler.clearNonStandardTasks()
  }
}

function confirmClearAll() {
  if (confirm('⚠️ Clear ALL tasks from current week including Sleep, Wake-up, and recurring tasks?')) {
    scheduler.clearAllTasks()
  }
}

async function saveAndClose() {
  // Apply local changes to reactive settings
  Object.assign(scheduler.settings.value, localSettings)
  await scheduler.saveSettings()
  emit('close')
}
</script>
