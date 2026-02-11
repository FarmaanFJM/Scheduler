/**
 * StandardTasksManager
 *
 * REUSED from legacy Obsidian plugin.
 * Only change: removed `import { Notice } from 'obsidian'` — notices emitted
 * via `onNotice` callback.
 */

import { SchedulerItem, StandardItemConfig, SchedulerSettings } from '../types';
import { ScheduleManager } from './scheduleManager';

export class StandardTasksManager {
    private scheduleManager: ScheduleManager;
    private getSettings: () => SchedulerSettings;
    private saveYearData: () => Promise<void>;
    private refreshView: () => void;
    private onNotice: (msg: string) => void;

    constructor(
        scheduleManager: ScheduleManager,
        getSettings: () => SchedulerSettings,
        saveYearData: () => Promise<void>,
        refreshView: () => void,
        onNotice: (msg: string) => void = (m) => console.info('[Scheduler]', m),
    ) {
        this.scheduleManager = scheduleManager;
        this.getSettings = getSettings;
        this.saveYearData = saveYearData;
        this.refreshView = refreshView;
        this.onNotice = onNotice;
    }

    async populateStandardTasks() {
        const weekData = this.scheduleManager.getCurrentWeekData();
        if (!weekData) return;

        const settings = this.getSettings();
        let addedCount = 0;

        if (settings.sleepSchedule.enabled) {
            const sleepItem: Omit<SchedulerItem, 'id'> = {
                name: 'Sleep',
                description: '',
                categoryId: 'other',
                itemType: 'regular',
                completed: false,
                isStandard: true,
                standardTaskName: 'Sleep',
            };

            const wakeItem: Omit<SchedulerItem, 'id'> = {
                name: 'Wake Up',
                description: '',
                categoryId: 'other',
                itemType: 'regular',
                completed: false,
                isStandard: true,
                standardTaskName: 'Wake Up',
            };

            for (let day = 0; day < 7; day++) {
                if (!settings.sleepSchedule.excludeSleepDays.includes(day)) {
                    const sleepExists = weekData.schedule[day][settings.sleepSchedule.sleepTime]
                        ?.some(i => i.name === 'Sleep' && i.isStandard);
                    if (!sleepExists) {
                        await this.scheduleManager.addItemToSchedule(day, settings.sleepSchedule.sleepTime, sleepItem);
                        addedCount++;
                    }
                }

                if (!settings.sleepSchedule.excludeWakeDays.includes(day)) {
                    const wakeExists = weekData.schedule[day][settings.sleepSchedule.wakeTime]
                        ?.some(i => i.name === 'Wake Up' && i.isStandard);
                    if (!wakeExists) {
                        await this.scheduleManager.addItemToSchedule(day, settings.sleepSchedule.wakeTime, wakeItem);
                        addedCount++;
                    }
                }
            }
        }

        for (const standard of settings.standardItems) {
            const item: Omit<SchedulerItem, 'id'> = {
                name: standard.name,
                description: standard.description,
                categoryId: standard.categoryId,
                itemType: 'regular',
                completed: false,
                isStandard: true,
                standardTaskName: standard.name,
            };

            for (const dayStr in standard.schedule) {
                const day = parseInt(dayStr);
                const hours = standard.schedule[day];

                for (const hour of hours) {
                    const existing = weekData.schedule[day]?.[hour];
                    const alreadyExists = existing?.some(i =>
                        i.standardTaskName === standard.name && i.isStandard,
                    );

                    if (!alreadyExists) {
                        await this.scheduleManager.addItemToSchedule(day, hour, item);
                        addedCount++;
                    }
                }
            }
        }

        await this.saveYearData();
        this.refreshView();

        if (addedCount === 0) {
            this.onNotice('All standard tasks already populated!');
        } else {
            this.onNotice(`Added ${addedCount} standard tasks!`);
        }
    }

    async updateStandardTask(oldName: string, newTask: StandardItemConfig) {
        const weekData = this.scheduleManager.getCurrentWeekData();
        if (!weekData) return;

        for (const day in weekData.schedule) {
            for (const hour in weekData.schedule[day]) {
                weekData.schedule[day][hour] =
                    weekData.schedule[day][hour].filter(
                        item => !(item.standardTaskName === oldName && item.isStandard),
                    );
            }
        }

        const item: Omit<SchedulerItem, 'id'> = {
            name: newTask.name,
            description: newTask.description,
            categoryId: newTask.categoryId,
            itemType: 'regular',
            completed: false,
            isStandard: true,
            standardTaskName: newTask.name,
        };

        for (const dayStr in newTask.schedule) {
            const day = parseInt(dayStr);
            const hours = newTask.schedule[day];
            for (const hour of hours) {
                await this.scheduleManager.addItemToSchedule(day, hour, item);
            }
        }

        await this.saveYearData();
        this.refreshView();
    }

    async clearNonStandardTasks() {
        const weekData = this.scheduleManager.getCurrentWeekData();
        if (!weekData) return;

        let cleared = 0;

        for (const day in weekData.schedule) {
            for (const hour in weekData.schedule[day]) {
                const original = weekData.schedule[day][hour].length;
                weekData.schedule[day][hour] =
                    weekData.schedule[day][hour].filter(item => item.isStandard);
                cleared += original - weekData.schedule[day][hour].length;
            }
        }

        await this.saveYearData();
        this.refreshView();
        this.onNotice(`Cleared ${cleared} non-standard tasks!`);
    }
}
