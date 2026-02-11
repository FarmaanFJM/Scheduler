<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box modal-wide">
      <h2>{{ isNew ? 'Add Recurring Task' : 'Edit Recurring Task' }}</h2>

      <label class="field-label">Task Name <span class="required">*</span></label>
      <input v-model="taskName" class="field-input" placeholder="e.g., Gym, School" />

      <label class="field-label">Description</label>
      <textarea v-model="taskDescription" class="field-input" rows="3" />

      <label class="field-label">Category</label>
      <select v-model="taskCategoryId" class="field-input">
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>

      <h3 class="schedule-grid-title">Schedule — click cells to toggle</h3>
      <p class="schedule-grid-subtitle">Select which hours this task appears each day</p>

      <div class="schedule-grid-container">
        <div class="schedule-grid">
          <!-- Header row -->
          <div class="schedule-grid-header">
            <div class="schedule-time-label">Time</div>
            <div v-for="d in dayNames" :key="d" class="schedule-day-header">{{ d }}</div>
          </div>
          <!-- Hour rows -->
          <div v-for="hour in 24" :key="hour - 1" class="schedule-grid-row">
            <div class="schedule-time-label">{{ String(hour - 1).padStart(2, '0') }}:00</div>
            <div
              v-for="day in 7"
              :key="day - 1"
              class="schedule-grid-cell"
              :class="{ selected: isSelected(day - 1, hour - 1) }"
              @click="toggleSlot(day - 1, hour - 1)"
            />
          </div>
        </div>

        <div class="quick-select-buttons">
          <button class="btn-secondary" @click="selectAll">Select All</button>
          <button class="btn-secondary" @click="clearAll">Clear All</button>
          <button class="btn-secondary" @click="selectWeekdays9to5">Weekdays 9–17</button>
        </div>
      </div>

      <div class="modal-buttons">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="handleSave">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { StandardItemConfig, DayHourSchedule, CategoryConfig } from '../core/types'

const props = defineProps<{
  task: StandardItemConfig
  isNew: boolean
  categories: CategoryConfig[]
}>()

const emit = defineEmits<{
  (e: 'submit', task: StandardItemConfig): void
  (e: 'close'): void
}>()

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const taskName = ref(props.task.name)
const taskDescription = ref(props.task.description)
const taskCategoryId = ref(props.task.categoryId)

// Deep clone schedule
const schedule = reactive<DayHourSchedule>({})
for (const day in props.task.schedule) {
  schedule[parseInt(day)] = [...props.task.schedule[day]]
}

function isSelected(day: number, hour: number): boolean {
  return schedule[day]?.includes(hour) ?? false
}

function toggleSlot(day: number, hour: number) {
  if (!schedule[day]) schedule[day] = []
  const idx = schedule[day].indexOf(hour)
  if (idx > -1) {
    schedule[day].splice(idx, 1)
  } else {
    schedule[day].push(hour)
    schedule[day].sort((a, b) => a - b)
  }
}

function selectAll() {
  for (let d = 0; d < 7; d++) {
    schedule[d] = Array.from({ length: 24 }, (_, i) => i)
  }
}

function clearAll() {
  for (let d = 0; d < 7; d++) {
    schedule[d] = []
  }
}

function selectWeekdays9to5() {
  clearAll()
  for (let d = 0; d < 5; d++) {
    schedule[d] = Array.from({ length: 9 }, (_, i) => i + 9)
  }
}

function handleSave() {
  if (!taskName.value.trim()) return

  let hasSlots = false
  for (const day in schedule) {
    if (schedule[day].length > 0) { hasSlots = true; break }
  }
  if (!hasSlots) return

  const updatedTask: StandardItemConfig = {
    name: taskName.value.trim(),
    description: taskDescription.value.trim(),
    categoryId: taskCategoryId.value,
    schedule: { ...schedule },
  }

  emit('submit', updatedTask)
  emit('close')
}
</script>
