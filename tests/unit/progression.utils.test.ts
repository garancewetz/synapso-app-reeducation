import { describe, expect, it } from 'vitest';
import { countByZone, summarizeAllTime, summarizePeriod } from '@/app/features/historique/utils/progression.utils';
import type { HeatmapDay } from '@/app/features/historique/utils/historique.types';
import type { HistoryEntry } from '@/app/types';

const day = (dateKey: string, count: number): HeatmapDay => ({
  date: new Date(dateKey + 'T12:00:00'), dateKey, count,
  dominantCategory: null, secondaryCategory: null, allCategories: [], isToday: false, isEmpty: count === 0,
});

// Local noon: getDateKey formats in local time, so the dateKey is stable in any timezone.
const entry = (id: number, dateKey: string, category: HistoryEntry['exercice']['category']): HistoryEntry => ({
  id, completedAt: new Date(dateKey + 'T12:00:00').toISOString(),
  exercice: { id, name: `ex${id}`, category, bodyparts: [], equipments: [] },
});

describe('summarizePeriod', () => {
  it('counts active days, exercises and the best run of consecutive days', () => {
    const days = [day('2026-10-01', 2), day('2026-10-02', 1), day('2026-10-03', 0), day('2026-10-04', 3), day('2026-10-05', 1), day('2026-10-06', 4)];
    expect(summarizePeriod(days)).toEqual({ activeDays: 5, exercises: 11, bestStreak: 3 });
  });

  it('is all zeros for an empty period', () => {
    expect(summarizePeriod([day('2026-10-01', 0)])).toEqual({ activeDays: 0, exercises: 0, bestStreak: 0 });
  });
});

describe('summarizeAllTime', () => {
  const history = [entry(1, '2026-05-02', 'CORE'), entry(2, '2026-05-02', 'FACE'), entry(3, '2026-03-10', 'CORE'), entry(4, '2026-10-14', 'CORE')];

  it('totals everything since the first exercise', () => {
    expect(summarizeAllTime(history)).toEqual({ exercises: 4, activeDays: 3, sinceKey: '2026-03-10' });
  });

  it('stops at the time-machine date', () => {
    expect(summarizeAllTime(history, '2026-06-01')).toEqual({ exercises: 3, activeDays: 2, sinceKey: '2026-03-10' });
  });
});

describe('countByZone', () => {
  it('counts per zone within the period, in body order', () => {
    const history = [entry(1, '2026-10-02', 'CORE'), entry(2, '2026-10-03', 'CORE'), entry(3, '2026-10-03', 'FACE'), entry(4, '2026-09-01', 'CORE')];
    expect(countByZone(history, '2026-10-01', '2026-10-28')).toEqual([
      { category: 'FACE', count: 1 },
      { category: 'UPPER_BODY', count: 0 },
      { category: 'CORE', count: 2 },
      { category: 'LOWER_BODY', count: 0 },
      { category: 'STRETCHING', count: 0 },
    ]);
  });
});
