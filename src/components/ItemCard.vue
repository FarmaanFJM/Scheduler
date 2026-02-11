<!--
  ItemCard — shared card used in Weekly grid, Monthly, Goals, and Backlog.
  Mirrors ItemRenderer styling from the original Obsidian views.
-->
<template>
  <div
    class="task-card"
    :class="[`item-type-${item.itemType || 'regular'}`, item.itemType === 'task' && item.completed ? 'item-completed' : '']"
    :style="cardStyle"
  >
    <div class="item-name" :style="{ color: textColor }">{{ item.name }}</div>
    <div v-if="item.description" class="item-description" :style="{ color: textColor, opacity: '0.75' }">
      {{ item.description }}
    </div>

    <div class="task-buttons">
      <!-- Reorder up -->
      <button v-if="showUp" class="task-reorder-btn" @click.stop="$emit('reorder', 'up')">▲</button>
      <!-- Reorder down -->
      <button v-if="showDown" class="task-reorder-btn" @click.stop="$emit('reorder', 'down')">▼</button>
      <!-- Checkbox for tasks -->
      <button v-if="item.itemType === 'task'" class="item-check-btn" @click.stop="$emit('toggle')">
        {{ item.completed ? '☑' : '☐' }}
      </button>
      <!-- Edit -->
      <button class="item-edit-btn" @click.stop="$emit('edit')">✎</button>
      <!-- Delete -->
      <button class="item-delete-btn" @click.stop="$emit('delete')">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SchedulerItem, CategoryConfig } from '../core/types'

const props = defineProps<{
  item: SchedulerItem
  category?: CategoryConfig
  index?: number
  total?: number
}>()

defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'toggle'): void
  (e: 'reorder', dir: 'up' | 'down'): void
}>()

const showUp = computed(() => (props.index ?? 0) > 0)
const showDown = computed(() => (props.index ?? 0) < ((props.total ?? 1) - 1))

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 }
}

function getContrastColor(bgColor: string): string {
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
}

const cardStyle = computed(() => {
  const cat = props.category
  if (!cat) return {}

  const baseColor = cat.color
  const rgb = hexToRgb(baseColor)
  const style: Record<string, string> = {
    borderLeftColor: baseColor,
    '--category-color-rgb': `${rgb.r}, ${rgb.g}, ${rgb.b}`,
  }

  if (props.item.itemType === 'goal') {
    style.borderRightColor = baseColor
    style.borderTopColor = baseColor
    style.borderBottomColor = baseColor
  }

  if (props.item.itemType === 'regular' || props.item.itemType === 'deadline') {
    style.backgroundColor = baseColor
  }

  return style
})

const textColor = computed(() => {
  const cat = props.category
  // task/goal: background stays dark (#161b22), always use light text
  if (!cat) return '#e6edf3'
  if (props.item.itemType === 'task') return '#e6edf3'
  if (props.item.itemType === 'goal') return '#e6edf3'
  // regular/deadline: background IS the category color — compute contrast
  return getContrastColor(cat.color)
})
</script>
