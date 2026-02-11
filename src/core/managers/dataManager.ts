/**
 * DataManager — Electron edition
 *
 * REWRITTEN from legacy Obsidian version.
 * Replaces `this.app.vault.adapter` with `window.api` (Electron contextBridge IPC).
 *
 * Responsibilities:
 * - Read/write JSON data files via preload IPC
 * - Create empty year/weekly data structures
 * - Never touches Vue reactivity or UI
 */

import { SchedulerSettings, YearData, SchedulerItem, WeeklySchedule } from '../types';
import {
    SCHEDULER_DATA_FOLDER,
    SETTINGS_FILE,
    BACKLOG_FILE,
    GOALS_FILE,
    DEFAULT_SETTINGS,
} from '../constants';

export class DataManager {
    private async ensureFolder(): Promise<void> {
        await window.api.ensureDir(SCHEDULER_DATA_FOLDER);
    }

    private async atomicWrite(filePath: string, data: unknown): Promise<void> {
        await this.ensureFolder();
        const dataString = JSON.stringify(data, null, 2);
        await window.api.writeFile(filePath, dataString);
    }

    private async atomicRead(filePath: string): Promise<unknown | null> {
        const exists = await window.api.fileExists(filePath);
        if (!exists) return null;
        try {
            const raw = await window.api.readFile(filePath);
            return JSON.parse(raw);
        } catch (e) {
            console.error(`Scheduler: Failed to read ${filePath}:`, e);
            return null;
        }
    }

    async loadSettings(): Promise<SchedulerSettings> {
        const loaded = await this.atomicRead(SETTINGS_FILE) as Partial<SchedulerSettings> | null;
        return Object.assign({}, DEFAULT_SETTINGS, loaded);
    }

    async saveSettings(settings: SchedulerSettings): Promise<void> {
        await this.atomicWrite(SETTINGS_FILE, settings);
    }

    async loadBacklog(): Promise<SchedulerItem[]> {
        const data = await this.atomicRead(BACKLOG_FILE) as { items?: SchedulerItem[] } | null;
        return data?.items || [];
    }

    async saveBacklog(items: SchedulerItem[]): Promise<void> {
        await this.atomicWrite(BACKLOG_FILE, { items });
    }

    async loadGoals(): Promise<SchedulerItem[]> {
        const data = await this.atomicRead(GOALS_FILE) as { items?: SchedulerItem[] } | null;
        return data?.items || [];
    }

    async saveGoals(items: SchedulerItem[]): Promise<void> {
        await this.atomicWrite(GOALS_FILE, { items });
    }

    async loadYearData(year: number): Promise<YearData> {
        const yearFile = `${SCHEDULER_DATA_FOLDER}/${year}.json`;
        let yearData = await this.atomicRead(yearFile) as YearData | null;
        if (!yearData) {
            yearData = this.createEmptyYearData(year);
        }
        return yearData;
    }

    async saveYearData(yearData: YearData): Promise<void> {
        const yearFile = `${SCHEDULER_DATA_FOLDER}/${yearData.year}.json`;
        await this.atomicWrite(yearFile, yearData);
    }

    createEmptyYearData(year: number): YearData {
        return {
            year,
            weeks: [],
            monthlyTasks: this.createEmptyMonthlyTasks(),
        };
    }

    createEmptyMonthlyTasks(): Record<string, SchedulerItem[]> {
        const tasks: Record<string, SchedulerItem[]> = {};
        for (let month = 0; month < 12; month++) {
            tasks[month] = [];
        }
        return tasks;
    }

    createEmptyWeeklySchedule(): WeeklySchedule {
        const schedule: WeeklySchedule = {};
        for (let day = 0; day < 7; day++) {
            schedule[day] = {};
            for (let hour = 0; hour < 24; hour++) {
                schedule[day][hour] = [];
            }
        }
        return schedule;
    }
}
