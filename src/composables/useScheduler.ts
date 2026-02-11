/**
 * useScheduler — Vue composable
 *
 * REPLACES the Obsidian `SchedulerPlugin` class.
 *
 * Responsibilities:
 * - Bootstrap and own all manager instances
 * - Load data on first use
 * - Expose reactive state (settings, currentWeek, currentYear, viewRevision)
 * - Delegate ALL business logic to the existing managers (unchanged)
 * - Trigger Vue reactivity via `viewRevision` bump after mutations
 *
 * The composable is a singleton (created once, provided at app root)
 * so every component shares the same manager instances.
 */

import { ref, readonly, provide, inject, type InjectionKey } from 'vue'
import { DataManager } from '../core/managers/dataManager'
import { BacklogManager } from '../core/managers/backlogManager'
import { GoalsManager } from '../core/managers/goalsManager'
import { ScheduleManager } from '../core/managers/scheduleManager'
import { StandardTasksManager } from '../core/managers/standardTasksManager'
import { DateUtils } from '../core/utils/dateUtils'
import type {
    SchedulerSettings,
    SchedulerItem,
    StandardItemConfig,
    CategoryConfig,
} from '../core/types'

// ── Injection key for provide/inject ──────────────────────────────────────────
export const SCHEDULER_KEY: InjectionKey<ReturnType<typeof createScheduler>> =
    Symbol('scheduler')

// ── Notification toast (lightweight, no external deps) ────────────────────────
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showNotice(msg: string) {
    toastMessage.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastMessage.value = '' }, 3500)
}

// ── Factory function (called once at app root) ────────────────────────────────

function createScheduler() {
    // Reactive state visible to Vue templates
    const settings = ref<SchedulerSettings>({
        categories: [],
        standardItems: [],
        sleepSchedule: { enabled: false, sleepTime: 22, wakeTime: 6, excludeWakeDays: [], excludeSleepDays: [] },
        backlogExpanded: true,
    })
    const currentWeek = ref(0)
    const currentYear = ref(0)
    const dataLoaded = ref(false)
    // Incrementing this ref forces any component that watches it to re-render
    const viewRevision = ref(0)

    // ── Manager instances ─────────────────────────────────────────────────────
    const dataManager = new DataManager()

    function refreshView() {
        viewRevision.value++
    }

    const backlogManager = new BacklogManager(
        dataManager,
        () => settings.value,
        async () => { await dataManager.saveSettings(settings.value) },
        refreshView,
        showNotice,
    )

    const goalsManager = new GoalsManager(
        dataManager,
        refreshView,
        showNotice,
    )

    const scheduleManager = new ScheduleManager(
        dataManager,
        0, 0, // will be set after loadData
        () => settings.value,
        refreshView,
        showNotice,
    )

    const standardTasksManager = new StandardTasksManager(
        scheduleManager,
        () => settings.value,
        () => scheduleManager.saveYearData(),
        refreshView,
        showNotice,
    )

    // ── Data loading ──────────────────────────────────────────────────────────

    async function loadData(): Promise<void> {
        if (dataLoaded.value) return

        const { weekNumber, year } = DateUtils.getCurrentWeekInfo()

        settings.value = await dataManager.loadSettings()
        scheduleManager.currentWeek = weekNumber
        scheduleManager.currentYear = year
        currentWeek.value = weekNumber
        currentYear.value = year

        await backlogManager.loadBacklog()
        await goalsManager.loadGoals()
        await scheduleManager.loadYearData(year)

        dataLoaded.value = true
        viewRevision.value++
    }

    // ── Settings ──────────────────────────────────────────────────────────────

    async function saveSettings(): Promise<void> {
        await dataManager.saveSettings(settings.value)
        refreshView()
    }

    // ── Backlog ───────────────────────────────────────────────────────────────

    function getBacklogItems(): SchedulerItem[] {
        return backlogManager.getBacklogItems()
    }

    async function addBacklogItem(item: Omit<SchedulerItem, 'id'>) {
        await backlogManager.addBacklogItem(item)
    }

    async function clearBacklogItems() {
        await backlogManager.clearBacklogItems()
    }

    async function reorderBacklogItemInCategory(itemId: string, categoryId: string, direction: 'up' | 'down') {
        await backlogManager.reorderBacklogItemInCategory(itemId, categoryId, direction)
    }

    async function toggleBacklogSidebar() {
        await backlogManager.toggleBacklogSidebar()
    }

    // ── Goals ─────────────────────────────────────────────────────────────────

    function getGeneralGoals(): SchedulerItem[] {
        return goalsManager.getGeneralGoals()
    }

    async function addGeneralGoal(item: Omit<SchedulerItem, 'id'>) {
        await goalsManager.addGeneralGoal(item)
    }

    async function clearGeneralGoals() {
        await goalsManager.clearGeneralGoals()
    }

    async function clearCategoryGoals(categoryId: string) {
        await goalsManager.clearCategoryGoals(categoryId)
    }

    async function reorderGeneralGoal(itemId: string, direction: 'up' | 'down') {
        await goalsManager.reorderGeneralGoal(itemId, direction)
    }

    // ── Schedule ──────────────────────────────────────────────────────────────

    async function changeWeek(delta: number): Promise<void> {
        await scheduleManager.changeWeek(delta)
        currentWeek.value = scheduleManager.currentWeek
        currentYear.value = scheduleManager.currentYear
    }

    async function changeYear(delta: number): Promise<void> {
        await scheduleManager.changeYear(delta)
        currentYear.value = scheduleManager.currentYear
    }

    async function jumpToDate(dateStr: string): Promise<void> {
        const targetDate = new Date(dateStr)
        if (isNaN(targetDate.getTime())) return
        const newWeekNumber = DateUtils.getWeekNumber(targetDate)
        const newYear = DateUtils.getYearForWeek(newWeekNumber, targetDate)
        if (scheduleManager.currentYear !== newYear) {
            await scheduleManager.loadYearData(newYear)
        }
        scheduleManager.currentWeek = newWeekNumber
        scheduleManager.currentYear = newYear
        currentWeek.value = newWeekNumber
        currentYear.value = newYear
        refreshView()
    }

    async function jumpToCurrentWeek(): Promise<void> {
        const { weekNumber, year } = DateUtils.getCurrentWeekInfo()
        if (scheduleManager.currentYear !== year) {
            await scheduleManager.loadYearData(year)
        }
        scheduleManager.currentWeek = weekNumber
        scheduleManager.currentYear = year
        currentWeek.value = weekNumber
        currentYear.value = year
        refreshView()
    }

    async function jumpToCurrentYear(): Promise<void> {
        const year = new Date().getFullYear()
        if (scheduleManager.currentYear !== year) {
            scheduleManager.currentYear = year
            currentYear.value = year
            await scheduleManager.loadYearData(year)
        }
        refreshView()
    }

    function getCurrentWeekData() {
        return scheduleManager.getCurrentWeekData()
    }

    function getItemsForCell(day: number, hour: number): SchedulerItem[] {
        return scheduleManager.getItemsForCell(day, hour)
    }

    function getMonthlyTasks(month: number): SchedulerItem[] {
        return scheduleManager.getMonthlyTasks(month)
    }

    function getCategoryById(id: string): CategoryConfig | undefined {
        return scheduleManager.getCategoryById(id)
    }

    async function addItemToSchedule(day: number, hour: number, item: Omit<SchedulerItem, 'id'>) {
        await scheduleManager.addItemToSchedule(day, hour, item)
        refreshView()
    }

    async function addMonthlyTask(month: number, item: Omit<SchedulerItem, 'id'>) {
        await scheduleManager.addMonthlyTask(month, item)
        refreshView()
    }

    async function reorderMonthlyTask(itemId: string, month: number, taskType: string, direction: 'up' | 'down') {
        await scheduleManager.reorderMonthlyTask(itemId, month, taskType, direction)
    }

    async function updateItem(itemId: string, updates: Partial<SchedulerItem>) {
        const result = await scheduleManager.updateItem(
            itemId,
            updates,
            backlogManager.getBacklogItems(),
            goalsManager.getGeneralGoals(),
        )

        if (result) {
            if (result.needsSaveBacklog) await backlogManager.saveBacklog()
            if (result.needsSaveGoals) await goalsManager.saveGoals()
            if (result.needsSaveYear) await scheduleManager.saveYearData()
        }

        refreshView()
    }

    async function removeItem(itemId: string) {
        const result = await scheduleManager.removeItem(
            itemId,
            backlogManager.getBacklogItems(),
            goalsManager.getGeneralGoals(),
        )

        if (result.newGoals) goalsManager.updateGoals(result.newGoals)
        if (result.newBacklog) backlogManager.updateBacklog(result.newBacklog)

        if (result.needsSaveBacklog) await backlogManager.saveBacklog()
        if (result.needsSaveGoals) await goalsManager.saveGoals()
        if (result.needsSaveYear) await scheduleManager.saveYearData()

        refreshView()
    }

    async function clearMonthTasks(month: number) {
        await scheduleManager.clearMonthTasks(month)
    }

    async function clearAllTasks() {
        await scheduleManager.clearAllTasks()
    }

    async function loadYearData(year: number) {
        await scheduleManager.loadYearData(year)
        currentYear.value = year
        refreshView()
    }

    // ── Standard tasks ────────────────────────────────────────────────────────

    async function populateStandardTasks() {
        await standardTasksManager.populateStandardTasks()
    }

    async function updateStandardTask(oldName: string, newTask: StandardItemConfig) {
        await standardTasksManager.updateStandardTask(oldName, newTask)
    }

    async function clearNonStandardTasks() {
        await standardTasksManager.clearNonStandardTasks()
    }

    // ── Public API ────────────────────────────────────────────────────────────

    return {
        // Reactive
        settings,
        currentWeek: readonly(currentWeek),
        currentYear: readonly(currentYear),
        dataLoaded: readonly(dataLoaded),
        viewRevision: readonly(viewRevision),
        toastMessage: readonly(toastMessage),

        // Lifecycle
        loadData,
        saveSettings,

        // Backlog
        getBacklogItems,
        addBacklogItem,
        clearBacklogItems,
        reorderBacklogItemInCategory,
        toggleBacklogSidebar,

        // Goals
        getGeneralGoals,
        addGeneralGoal,
        clearGeneralGoals,
        clearCategoryGoals,
        reorderGeneralGoal,

        // Schedule
        changeWeek,
        changeYear,
        jumpToDate,
        jumpToCurrentWeek,
        jumpToCurrentYear,
        getCurrentWeekData,
        getItemsForCell,
        getMonthlyTasks,
        getCategoryById,
        addItemToSchedule,
        addMonthlyTask,
        reorderMonthlyTask,
        updateItem,
        removeItem,
        clearMonthTasks,
        clearAllTasks,
        loadYearData,

        // Standard tasks
        populateStandardTasks,
        updateStandardTask,
        clearNonStandardTasks,
    }
}

// ── Singleton instance (provided at root, injected anywhere) ──────────────────

let _instance: ReturnType<typeof createScheduler> | null = null

export function provideScheduler() {
    _instance = createScheduler()
    provide(SCHEDULER_KEY, _instance)
    return _instance
}

export function useScheduler() {
    const scheduler = inject(SCHEDULER_KEY)
    if (!scheduler) throw new Error('useScheduler() called outside of scheduler provider')
    return scheduler
}
