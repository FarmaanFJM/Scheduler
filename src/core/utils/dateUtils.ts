/**
 * Utility functions for date and week calculations.
 * Reused unchanged from legacy Obsidian plugin (no framework dependencies).
 */

export class DateUtils {
    static getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    static getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    static getSunday(date: Date): Date {
        const monday = this.getMonday(date);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return sunday;
    }

    static toISODateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static fromISODateString(dateStr: string): Date {
        return new Date(dateStr);
    }

    static getWeekRangeString(startDate: Date, endDate: Date): string {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const startMonth = monthNames[startDate.getMonth()];
        const endMonth = monthNames[endDate.getMonth()];
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const year = startDate.getFullYear();

        if (startMonth === endMonth) {
            return `${startMonth} ${startDay}-${endDay}, ${year}`;
        } else {
            return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
        }
    }

    static getDateOfWeek(weekNumber: number, year: number): Date {
        const jan4 = new Date(year, 0, 4);
        const dayOfWeek = jan4.getDay();
        const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
        const week1Monday = new Date(jan4);
        week1Monday.setDate(jan4.getDate() + diff);

        const targetDate = new Date(week1Monday);
        targetDate.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);
        return targetDate;
    }

    static getCurrentWeekInfo(): { weekNumber: number; year: number; startDate: Date; endDate: Date } {
        const now = new Date();
        const weekNumber = this.getWeekNumber(now);
        const startDate = this.getMonday(now);
        const endDate = this.getSunday(now);
        const weekYear = this.getYearForWeek(weekNumber, now);
        return { weekNumber, year: weekYear, startDate, endDate };
    }

    static getYearForWeek(weekNumber: number, date: Date): number {
        const year = date.getFullYear();
        const month = date.getMonth();
        if (weekNumber === 1 && month === 11) return year + 1;
        if ((weekNumber === 52 || weekNumber === 53) && month === 0) return year - 1;
        return year;
    }

    static addWeeks(date: Date, weeks: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + weeks * 7);
        return result;
    }
}
