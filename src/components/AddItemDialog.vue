<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <h2>Add Item</h2>
      <p class="modal-subtitle">{{ title }}</p>

      <label class="field-label">Name <span class="required">*</span></label>
      <input v-model="name" class="field-input" placeholder="e.g., Gym, Study, Meeting" />

      <label class="field-label">Description</label>
      <textarea v-model="description" class="field-input" rows="3"
        placeholder="Optional details" />

      <label class="field-label">Type</label>
      <template v-if="lockedItemType">
        <div class="locked-display">{{ lockedItemType }}</div>
      </template>
      <template v-else>
        <select v-model="selectedItemType" class="field-input" @change="onTypeChange">
          <option value="regular">Regular</option>
          <option value="task">Task (with checkbox)</option>
          <option value="goal">Goal</option>
          <option value="deadline">Deadline (urgent)</option>
        </select>
      </template>

      <label class="field-label">Category</label>
      <template v-if="lockedCategoryId">
        <div class="locked-display">{{ lockedCategoryName }}</div>
      </template>
      <template v-else>
        <select v-model="selectedCategoryId" class="field-input">
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </template>

      <!-- Deadline fields — only shown in monthly context + deadline type -->
      <template v-if="isMonthlyContext && selectedItemType === 'deadline'">
        <label class="field-label">Deadline Day</label>
        <select v-model.number="deadlineDay" class="field-input">
          <option v-for="d in daysInMonth" :key="d" :value="d">{{ d }}</option>
        </select>

        <label class="field-label">Deadline Hour</label>
        <select v-model.number="deadlineHour" class="field-input">
          <option v-for="h in 24" :key="h - 1" :value="h - 1">
            {{ String(h - 1).padStart(2, '0') }}:00
          </option>
        </select>
      </template>

      <div class="modal-buttons">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="handleSubmit">Add Item</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SchedulerItem, CategoryConfig, ItemType } from '../core/types'

const props = defineProps<{
  title: string
  categories: CategoryConfig[]
  lockedCategoryId?: string
  lockedItemType?: ItemType
  monthIndex?: number
  year?: number
}>()

const emit = defineEmits<{
  (e: 'submit', item: Omit<SchedulerItem, 'id'>): void
  (e: 'close'): void
}>()

const name = ref('')
const description = ref('')
const selectedItemType = ref<ItemType>(props.lockedItemType ?? 'regular')
const selectedCategoryId = ref(props.lockedCategoryId ?? (props.categories[0]?.id || ''))
const deadlineDay = ref(1)
const deadlineHour = ref(9)

const isMonthlyContext = computed(
  () => props.monthIndex !== undefined && props.year !== undefined,
)

const lockedCategoryName = computed(
  () => props.categories.find(c => c.id === props.lockedCategoryId)?.name ?? '',
)

const daysInMonth = computed(() => {
  if (props.year === undefined || props.monthIndex === undefined) return 31
  return new Date(props.year, props.monthIndex + 1, 0).getDate()
})

function onTypeChange() {
  // no-op: template reactivity handles deadline field visibility
}

function handleSubmit() {
  if (!name.value.trim()) return

  const item: Omit<SchedulerItem, 'id'> = {
    name: name.value.trim(),
    description: description.value.trim(),
    categoryId: props.lockedCategoryId ?? selectedCategoryId.value,
    itemType: props.lockedItemType ?? selectedItemType.value,
    completed: false,
  }

  if (
    selectedItemType.value === 'deadline' &&
    isMonthlyContext.value &&
    props.year !== undefined &&
    props.monthIndex !== undefined
  ) {
    const date = new Date(props.year, props.monthIndex, deadlineDay.value)
    const iso =
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0')
    ;(item as any).deadlineDate = iso
    ;(item as any).deadlineHour = deadlineHour.value
  }

  emit('submit', item)
  emit('close')
}
</script>
