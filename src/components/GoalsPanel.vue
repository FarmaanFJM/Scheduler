<!--
  GoalsPanel — general goals grid (3 categories per row).
  Mirrors GoalsRenderer from the Obsidian plugin.
-->
<template>
  <section class="scheduler-goals-section">
    <div class="scheduler-section-header">
      <div class="header-title-container">
        <h2>General Goals</h2>
      </div>
    </div>

    <div class="goals-grid">
      <div
        v-for="row in Math.ceil(scheduler.settings.value.categories.length / 3)"
        :key="row"
        class="goals-row"
      >
        <div
          v-for="colIdx in 3"
          :key="colIdx"
          class="goals-category-column"
        >
          <template v-if="categoryAt(row, colIdx)">
            <div class="goals-category-header">
              <h3>{{ categoryAt(row, colIdx)!.name }}</h3>
              <button class="add-task-btn" @click="openAddGoalDialog(categoryAt(row, colIdx)!.id)">+</button>
              <button class="trash-task-btn" @click="confirmClearCategory(categoryAt(row, colIdx)!.id)">🗑️</button>
            </div>

            <div v-if="goalsForCategory(categoryAt(row, colIdx)!.id).length > 0" class="monthly-type-header">
              ──────── {{ categoryAt(row, colIdx)!.name.toUpperCase() }} ────────
            </div>

            <div class="goals-list">
              <ItemCard
                v-for="(goal, idx) in goalsForCategory(categoryAt(row, colIdx)!.id)"
                :key="goal.id"
                :item="goal"
                :category="categoryAt(row, colIdx)!"
                :index="idx"
                :total="goalsForCategory(categoryAt(row, colIdx)!.id).length"
                @edit="openEditDialog(goal)"
                @delete="scheduler.removeItem(goal.id)"
                @reorder="(dir) => scheduler.reorderGeneralGoal(goal.id, dir)"
              />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Add goal dialog -->
    <AddItemDialog
      v-if="addDialog.open"
      :title="addDialog.title"
      :categories="scheduler.settings.value.categories"
      :lockedCategoryId="addDialog.categoryId"
      lockedItemType="goal"
      @submit="onAddGoal"
      @close="addDialog.open = false"
    />

    <!-- Edit goal dialog -->
    <EditItemDialog
      v-if="editDialog.open && editDialog.goal"
      :item="editDialog.goal"
      :categories="scheduler.settings.value.categories"
      @submit="(u) => scheduler.updateItem(editDialog.goal!.id, u)"
      @close="editDialog.open = false"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScheduler } from '../composables/useScheduler'
import type { SchedulerItem, CategoryConfig, ItemType } from '../core/types'
import ItemCard from './ItemCard.vue'
import AddItemDialog from './AddItemDialog.vue'
import EditItemDialog from './EditItemDialog.vue'

const scheduler = useScheduler()

function categoryAt(row: number, col: number): CategoryConfig | undefined {
  const idx = (row - 1) * 3 + (col - 1)
  return scheduler.settings.value.categories[idx]
}

function goalsForCategory(categoryId: string) {
  return scheduler.getGeneralGoals().filter(g => g.categoryId === categoryId)
}

const addDialog = ref<{ open: boolean; title: string; categoryId: string }>({
  open: false, title: '', categoryId: '',
})

function openAddGoalDialog(categoryId: string) {
  const name = scheduler.settings.value.categories.find(c => c.id === categoryId)?.name ?? ''
  addDialog.value = { open: true, title: `New Goal — ${name}`, categoryId }
}

async function onAddGoal(item: Omit<SchedulerItem, 'id'>) {
  const goalItem = {
    ...item,
    itemType: 'goal' as ItemType,
    categoryId: addDialog.value.categoryId || item.categoryId,
  }
  await scheduler.addGeneralGoal(goalItem)
}

function confirmClearCategory(categoryId: string) {
  const name = scheduler.settings.value.categories.find(c => c.id === categoryId)?.name ?? ''
  if (confirm(`Clear all goals for ${name}?`)) {
    scheduler.clearCategoryGoals(categoryId)
  }
}

const editDialog = ref<{ open: boolean; goal: SchedulerItem | null }>({ open: false, goal: null })

function openEditDialog(goal: SchedulerItem) {
  editDialog.value = { open: true, goal }
}
</script>
