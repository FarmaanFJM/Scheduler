<!--
  SchedulerView — main container.
  Mirrors SchedulerView (view.ts) from the Obsidian plugin.

  Layout:
  ┌─────────────────────────────────┬──────────────┐
  │  Weekly Grid                    │              │
  │  Monthly Grid                   │   Backlog    │
  │  Goals Panel                    │   Sidebar    │
  └─────────────────────────────────┴──────────────┘
-->
<template>
  <div class="scheduler-container">
    <!-- Toolbar -->
    <div class="scheduler-toolbar">
      <span class="app-title">📅 Scheduler</span>
      <button class="settings-btn" @click="showSettings = true">⚙ Settings</button>
    </div>

    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="scheduler.toastMessage.value" class="toast-notification">
        {{ scheduler.toastMessage.value }}
      </div>
    </Transition>

    <!-- Loading state -->
    <div v-if="!scheduler.dataLoaded.value" class="loading-state">
      <div class="loading-spinner" />
      <p>Loading your schedule…</p>
    </div>

    <!-- Main layout (only after data is ready) -->
    <template v-else>
      <!-- viewRevision is watched to trigger re-renders after mutations -->
      <div :key="scheduler.viewRevision.value" class="scheduler-layout">
        <div class="scheduler-main">
          <WeeklyGrid />
          <MonthlyView />
          <GoalsPanel />
        </div>
        <BacklogSidebar />
      </div>
    </template>

    <!-- Settings panel -->
    <SettingsView v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useScheduler } from '../composables/useScheduler'
import WeeklyGrid from './WeeklyGrid.vue'
import MonthlyView from './MonthlyView.vue'
import GoalsPanel from './GoalsPanel.vue'
import BacklogSidebar from './BacklogSidebar.vue'
import SettingsView from './SettingsView.vue'

const scheduler = useScheduler()
const showSettings = ref(false)
</script>
