import type { Era } from "src/schemas/calendar/timespans";
import { DayCache, EntityCache, MonthCache, YearCache } from "./entity-cache";
import { ordinal } from "src/utils/functions";

export class EraCache extends EntityCache<Era> {
    getYearCache(year: number): YearCache<Era> {
        if (this.cache.has(year)) return this.cache.get(year)!;
        return new YearEraCache(year, this.entities);
    }
    getMonthCache(month: number, year: number): MonthCache<Era> {
        const yearCache = this.getYearCache(year);
        if (yearCache.cache.has(month)) return yearCache.cache.get(month)!;
        return new MonthEraCache(month, year, yearCache.entities);
    }
    getDayCache(day: number, month: number, year: number): DayCache<Era> {
        const monthCache = this.getMonthCache(month, year);
        if (monthCache.cache.has(day)) return monthCache.cache.get(day)!;
        return new DayEraCache(day, month, year, monthCache.entities);
    }
}

class YearEraCache extends YearCache<Era> {
    update(entities: Era[]): Era[] {
        if (!entities.length) return [];
        const list: Era[] = [];
        for (let i = entities.length - 1; i >= 0; i--) {
            const era = entities[i];
            if (era.isStartingEra) {
                list.push(era);
            } else if (era.date.year <= this.year) {
                if (!era.end || era.end.year >= this.year) {
                    list.push(era);
                    break;
                }
            }
        }
        return list;
    }
}
class MonthEraCache extends MonthCache<Era> {
    update(entities: Era[]): Era[] {
        if (!entities.length) return [];
        const list: Era[] = [];
        for (let i = entities.length - 1; i >= 0; i--) {
            const era = entities[i];
            if (era.isStartingEra) {
                list.push(era);
            } else if (
                era.date.year < this.year ||
                (era.date.year === this.year && era.date.month <= this.month)
            ) {
                if (
                    !era.end ||
                    era.end.year > this.year ||
                    (era.end.year === this.year && era.end.month >= this.month)
                ) {
                    list.push(era);
                    break;
                }
            }
        }
        return list;
    }
}
class DayEraCache extends DayCache<Era> {
    update(entities: Era[]): Era[] {
        if (!entities.length) return [];
        const list: Era[] = [];
        for (let i = entities.length - 1; i >= 0; i--) {
            const era = entities[i];
            if (
                era.isStartingEra ||
                (era.date.year === this.year &&
                    era.date.month === this.month &&
                    era.date.day === this.day)
            ) {
                list.push(era);
            } else if (era.date.month < this.month) {
                if (
                    !era.end ||
                    era.end.year > this.year ||
                    (era.end.year === this.year &&
                        era.end.month > this.month) ||
                    (era.end.year === this.year &&
                        era.end.month === this.month &&
                        era.end.day >= this.day)
                ) {
                    list.push(era);
                    break;
                }
            }
        }
        return list;
    }
}

export function getEraYear(era: Era, year: number): number {
    if (era.isStartingEra) return year;
    return year - era.date.year + 1;
}

/**
 * {{year}} - Displays the current year
 * {{abs_year}} - Displays the current year, but without a minus in front of it if is negative. (Useful for eras such as 'Before Christ', as the year wasn't -300 BC, it was simply 300 BC)
 * {{nth_year}} - This displays the current year, but with 'st', 'nd', 'rd' or 'th' after it, when applicable.
 * {{abs_nth_year}} - Combination of abs_year and nth_year.
 * {{era_year}} - The current era year. If any eras in the past has restarted the year count, this number will be different than the year number.
 * {{era_nth_year}} - Similar to nth_year, but counting only the era years.
 * {{era_name}} - Inserts the current name of the era
 */
export function formatEra(era: Era, year: string | number | null): string {
    if (!year) return era.name;
    if (typeof year != "number") return era.name;
    if (!era.format?.length) return era.name;
    const eraYear = getEraYear(era, year);
    return era.format
        .replace("{{year}}", `${year}`)
        .replace("{{abs_year}}", `${Math.abs(year)}`)
        .replace("{{nth_year}}", `${ordinal(year)}`)
        .replace("{{abs_nth_year}}", `${ordinal(Math.abs(year))}`)
        .replace("{{era_year}}", `${eraYear}`)
        .replace("{{era_nth_year}}", `${ordinal(eraYear)}`)
        .replace("{{era_name}}", `${era.name}`);
}
