<!--
  BacklogSidebar — collapsible to-do list sidebar.
  Mirrors BacklogRenderer from the Obsidian plugin.
-->
<template>
  <aside
    class="scheduler-backlog-section"
    :class="scheduler.settings.value.backlogExpanded ? 'backlog-expanded' : 'backlog-collapsed'"
  >
    <div class="backlog-header">
      <button class="backlog-toggle-btn" @click="scheduler.toggleBacklogSidebar()">
        {{ scheduler.settings.value.backlogExpanded ? '→' : '←' }}
      </button>

      <template v-if="scheduler.settings.value.backlogExpanded">
        <h3>To-Do Backlog</h3>
        <div class="backlog-header-buttons">
          <button class="add-task-btn" @click="addDialog.open = true">+</button>
          <button class="trash-task-btn" @click="confirmClear">🗑️</button>
        </div>
      </template>
    </div>

    <template v-if="scheduler.settings.value.backlogExpanded">
      <div class="backlog-list">
        <div v-if="scheduler.getBacklogItems().length === 0" class="backlog-empty">
          No items in backlog
        </div>

        <template v-else>
          <template v-for="cat in scheduler.settings.value.categories" :key="cat.id">
            <template v-if="itemsForCategory(cat.id).length > 0">
              <div class="monthly-type-header">
                ──────── {{ cat.name.toUpperCase() }} ────────
              </div>
              <ItemCard
                v-for="(item, idx) in itemsForCategory(cat.id)"
                :key="item.id"
                :item="item"
                :category="cat"
                :index="idx"
                :total="itemsForCategory(cat.id).length"
                @edit="openEditDialog(item)"
                @delete="scheduler.removeItem(item.id)"
                @toggle="scheduler.updateItem(item.id, { completed: !item.completed })"
                @reorder="(dir) => scheduler.reorderBacklogItemInCategory(item.id, cat.id, dir)"
              />
            </template>
          </template>
        </template>
      </div>
    </template>

    <!-- Add dialog -->
    <AddItemDialog
      v-if="addDialog.open"
      title="New Backlog Item"
      :categories="scheduler.settings.value.categories"
      @submit="onAddItem"
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
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useScheduler } from '../composables/useScheduler'
import type { SchedulerItem } from '../core/types'
import ItemCard from './ItemCard.vue'
import AddItemDialog from './AddItemDialog.vue'
import EditItemDialog from './EditItemDialog.vue'

const scheduler = useScheduler()

function itemsForCategory(categoryId: string): SchedulerItem[] {
  return scheduler.getBacklogItems().filter(i => i.categoryId === categoryId)
}

const addDialog = ref({ open: false })

async function onAddItem(item: Omit<SchedulerItem, 'id'>) {
  await scheduler.addBacklogItem(item)
}

function confirmClear() {
  if (confirm('Clear all backlog items?')) {
    scheduler.clearBacklogItems()
  }
}

const editDialog = ref<{ open: boolean; item: SchedulerItem | null }>({ open: false, item: null })

function openEditDialog(item: SchedulerItem) {
  editDialog.value = { open: true, item }
}
</script>
