import type { HistoryEntry } from '@/app/types';
import type { ExerciceCategory } from '@/app/types/exercice';
import { CATEGORY_ORDER } from '@/app/constants/exercice.constants';
import { getDateKey } from '@/app/utils/date.utils';
import type { HeatmapDay } from './historique.types';

export type PeriodSummary = {
  activeDays: number;
  exercises: number;
  /** Longest run of consecutive active days within the period. */
  bestStreak: number;
};

/** What was done over a period of days (oldest → newest) — never a failure rate. */
export function summarizePeriod(days: HeatmapDay[]): PeriodSummary {
  let activeDays = 0;
  let exercises = 0;
  let bestStreak = 0;
  let run = 0;
  for (const day of days) {
    exercises += day.count;
    if (day.count > 0) {
      activeDays += 1;
      run += 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }
  return { activeDays, exercises, bestStreak };
}

export type AllTimeSummary = {
  exercises: number;
  activeDays: number;
  /** dateKey of the first recorded exercise, null when nothing yet. */
  sinceKey: string | null;
};

/** Everything done since the beginning (history up to `untilKey` included, if given). */
export function summarizeAllTime(history: HistoryEntry[], untilKey?: string): AllTimeSummary {
  const days = new Set<string>();
  let exercises = 0;
  let sinceKey: string | null = null;
  for (const entry of history) {
    const key = getDateKey(entry.completedAt);
    if (!key || (untilKey && key > untilKey)) continue;
    exercises += 1;
    days.add(key);
    if (sinceKey === null || key < sinceKey) sinceKey = key;
  }
  return { exercises, activeDays: days.size, sinceKey };
}

/** Exercises done per body zone between two dateKeys (inclusive), in body order. */
export function countByZone(
  history: HistoryEntry[],
  startKey: string,
  endKey: string
): { category: ExerciceCategory; count: number }[] {
  const counts = new Map<ExerciceCategory, number>(CATEGORY_ORDER.map((category) => [category, 0]));
  for (const entry of history) {
    const key = getDateKey(entry.completedAt);
    const category = entry.exercice.category;
    if (!key || !category || key < startKey || key > endKey) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return CATEGORY_ORDER.map((category) => ({ category, count: counts.get(category) ?? 0 }));
}
