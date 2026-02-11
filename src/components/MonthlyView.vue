<!--
  MonthlyView — 12-month grid (3 rows × 4 columns).
  Mirrors MonthlyRenderer from the Obsidian plugin.
-->
<template>
  <section class="scheduler-monthly-section">
    <div class="scheduler-section-header">
      <div class="header-title-container">
        <h2>Monthly Schedule</h2>
        <div class="year-navigation">
          <button class="nav-btn" @click="changeYear(-1)">◀</button>
          <span class="year-label">{{ scheduler.currentYear.value }}</span>
          <button class="nav-btn" @click="changeYear(1)">▶</button>
          <button class="today-btn" @click="scheduler.jumpToCurrentYear()">Current Year</button>
        </div>
      </div>
    </div>

    <div class="monthly-grid">
      <div v-for="row in 3" :key="row" class="monthly-row">
        <div
          v-for="col in 4"
          :key="col"
          class="month-column"
        >
          <template v-if="(row - 1) * 4 + (col - 1) < 12">
            <div class="month-header">
              <h3>{{ monthNames[(row - 1) * 4 + (col - 1)] }}</h3>
              <button class="add-task-btn" @click="openAddDialog((row - 1) * 4 + (col - 1))">+</button>
              <button class="trash-task-btn" @click="confirmClearMonth((row - 1) * 4 + (col - 1))">🗑️</button>
            </div>

            <div class="tasks-list">
              <template v-for="group in taskGroups((row - 1) * 4 + (col - 1))" :key="group.key">
                <div v-if="group.items.length" class="monthly-type-header">
                  ──────── {{ group.label }} ────────
                </div>
                <ItemCard
                  v-for="(task, idx) in group.items"
                  :key="task.id"
                  :item="task"
                  :category="scheduler.getCategoryById(task.categoryId)"
                  :index="idx"
                  :total="group.items.length"
                  @edit="openEditDialog(task)"
                  @delete="scheduler.removeItem(task.id)"
                  @toggle="scheduler.updateItem(task.id, { completed: !task.completed })"
                  @reorder="(dir) => scheduler.reorderMonthlyTask(task.id, (row - 1) * 4 + (col - 1), group.key, dir)"
                />
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Add dialog -->
    <AddItemDialog
      v-if="addDialog.open"
      :title="addDialog.title"
      :categories="scheduler.settings.value.categories"
      :monthIndex="addDialog.monthIndex"
      :year="scheduler.currentYear.value"
      @submit="onAddMonthlyTask"
      @close="addDialog.open = false"
    />

    <!-- Edit dialog -->
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
import { ref } from 'vue'
import { useScheduler } from '../composables/useScheduler'
import type { SchedulerItem } from '../core/types'
import ItemCard from './ItemCard.vue'
import AddItemDialog from './AddItemDialog.vue'
import EditItemDialog from './EditItemDialog.vue'

const scheduler = useScheduler()

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type TaskGroupKey = 'deadline' | 'goal' | 'task' | 'regular'

function taskGroups(monthIdx: number) {
  const all = scheduler.getMonthlyTasks(monthIdx)
  const groups: Record<TaskGroupKey, SchedulerItem[]> = {
    deadline: [], goal: [], task: [], regular: [],
  }
  for (const t of all) {
    if (t.itemType === 'deadline') groups.deadline.push(t)
    else if (t.itemType === 'goal') groups.goal.push(t)
    else if (t.itemType === 'task') groups.task.push(t)
    else groups.regular.push(t)
  }
  return [
    { key: 'deadline' as const, label: 'Deadlines', items: groups.deadline },
    { key: 'goal' as const, label: 'Goals', items: groups.goal },
    { key: 'task' as const, label: 'Tasks', items: groups.task },
    { key: 'regular' as const, label: 'Regular', items: groups.regular },
  ]
}

const addDialog = ref<{ open: boolean; title: string; monthIndex: number }>({
  open: false, title: '', monthIndex: 0,
})

function openAddDialog(monthIdx: number) {
  addDialog.value = { open: true, title: `Task for ${monthNames[monthIdx]}`, monthIndex: monthIdx }
}

async function onAddMonthlyTask(item: Omit<SchedulerItem, 'id'>) {
  await scheduler.addMonthlyTask(addDialog.value.monthIndex, item)
}

const editDialog = ref<{ open: boolean; item: SchedulerItem | null }>({ open: false, item: null })

function openEditDialog(item: SchedulerItem) {
  editDialog.value = { open: true, item }
}

function confirmClearMonth(monthIdx: number) {
  if (confirm(`Clear all tasks for ${monthNames[monthIdx]}?`)) {
    scheduler.clearMonthTasks(monthIdx)
  }
}

async function changeYear(delta: number) {
  await scheduler.changeYear(delta)
}
</script>
