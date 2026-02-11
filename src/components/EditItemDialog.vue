<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <h2>Edit Item</h2>

      <div v-if="item.isStandard" class="standard-task-warning">
        ⚠️ This is a standard/recurring task. Changes only affect this instance.
      </div>

      <label class="field-label">Name <span class="required">*</span></label>
      <input v-model="name" class="field-input" placeholder="Item name" />

      <label class="field-label">Description</label>
      <textarea v-model="description" class="field-input" rows="3" />

      <label class="field-label">Type</label>
      <select v-model="selectedItemType" class="field-input">
        <option value="regular">Regular</option>
        <option value="task">Task (with checkbox)</option>
        <option value="goal">Goal</option>
        <option value="deadline">Deadline (urgent)</option>
      </select>

      <label class="field-label">Category</label>
      <select v-model="selectedCategoryId" class="field-input">
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>

      <!-- Deadline fields -->
      <template v-if="selectedItemType === 'deadline'">
        <label class="field-label">Deadline Date (YYYY-MM-DD)</label>
        <input v-model="deadlineDate" class="field-input" placeholder="YYYY-MM-DD" type="date" />

        <label class="field-label">Deadline Hour</label>
        <select v-model.number="deadlineHour" class="field-input">
          <option v-for="h in 24" :key="h - 1" :value="h - 1">
            {{ String(h - 1).padStart(2, '0') }}:00
          </option>
        </select>
      </template>

      <div class="modal-buttons">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="handleSubmit">Save Changes</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SchedulerItem, CategoryConfig, ItemType } from '../core/types'

const props = defineProps<{
  item: SchedulerItem
  categories: CategoryConfig[]
}>()

const emit = defineEmits<{
  (e: 'submit', updates: Partial<SchedulerItem>): void
  (e: 'close'): void
}>()

const name = ref(props.item.name)
const description = ref(props.item.description)
const selectedItemType = ref<ItemType>(props.item.itemType || 'regular')
const selectedCategoryId = ref(props.item.categoryId)

// Default deadline values
const now = new Date()
const todayIso =
  now.getFullYear() + '-' +
  String(now.getMonth() + 1).padStart(2, '0') + '-' +
  String(now.getDate()).padStart(2, '0')

const deadlineDate = ref<string>(props.item.deadlineDate ?? todayIso)
const deadlineHour = ref<number>(props.item.deadlineHour ?? 9)

function handleSubmit() {
  if (!name.value.trim()) return

  const updates: Partial<SchedulerItem> = {
    name: name.value.trim(),
    description: description.value.trim(),
    categoryId: selectedCategoryId.value,
    itemType: selectedItemType.value,
  }

  if (selectedItemType.value === 'deadline') {
    updates.deadlineDate = deadlineDate.value || undefined
    updates.deadlineHour = deadlineHour.value
  } else {
    updates.deadlineDate = undefined
    updates.deadlineHour = undefined
  }

  emit('submit', updates)
  emit('close')
}
</script>
