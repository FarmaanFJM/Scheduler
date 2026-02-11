<script setup lang="ts">
import { onMounted } from 'vue'
import { provideScheduler } from './composables/useScheduler'
import SchedulerView from './components/SchedulerView.vue'

// Create the scheduler singleton and make it injectable for all children
const scheduler = provideScheduler()

// Load all data once on startup
onMounted(async () => {
  await scheduler.loadData()
})
</script>

<template>
  <SchedulerView />
</template>
