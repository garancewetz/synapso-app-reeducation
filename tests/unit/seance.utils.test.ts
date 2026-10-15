import { describe, expect, it } from 'vitest';
import {
  buildSessionQueue,
  estimateMinutes,
  getTodayPlan,
  planSession,
  formatSeconds,
  parseCount,
  parseDurationSeconds,
} from '@/app/features/seance/utils/seance.utils';
import type { Exercice } from '@/app/types';

describe('parseDurationSeconds', () => {
  it.each([
    ['30 secondes', 30],
    ['45s', 45],
    ['30 sec', 30],
    ['1 min', 60],
    ['2 minutes', 120],
    ['1min30', 90],
    ['1 min 30 s', 90],
    ['1,5 min', 90],
    ['1:30', 90],
    ['20', 20],
  ])('parses "%s" as %i seconds', (text, expected) => {
    expect(parseDurationSeconds(text)).toBe(expected);
  });

  it.each([null, undefined, '', 'tranquillement'])('returns null for %s', (text) => {
    expect(parseDurationSeconds(text)).toBeNull();
  });
});

describe('parseCount', () => {
  it('reads the first number', () => {
    expect(parseCount('3')).toBe(3);
    expect(parseCount('3 séries')).toBe(3);
    expect(parseCount('x10')).toBe(10);
  });

  it('returns null without a positive number', () => {
    expect(parseCount(null)).toBeNull();
    expect(parseCount('beaucoup')).toBeNull();
    expect(parseCount('0')).toBeNull();
  });
});

describe('formatSeconds', () => {
  it('formats as m:ss', () => {
    expect(formatSeconds(90)).toBe('1:30');
    expect(formatSeconds(5)).toBe('0:05');
    expect(formatSeconds(-3)).toBe('0:00');
  });
});

describe('buildSessionQueue', () => {
  const make = (id: number, category: Exercice['category'], extra: Partial<Exercice> = {}): Exercice => ({
    id,
    name: `ex${id}`,
    description: { text: '', comment: null },
    workout: { repeat: null, series: null, duration: null },
    equipments: [],
    bodyparts: [],
    category,
    completed: false,
    completedToday: false,
    completedAt: null,
    pinned: false,
    ...extra,
  });

  it('keeps only pending, non-archived exercises in category order', () => {
    const queue = buildSessionQueue([
      make(1, 'STRETCHING'),
      make(2, 'UPPER_BODY', { completed: true }),
      make(3, 'LOWER_BODY'),
      make(4, 'UPPER_BODY'),
      make(5, 'FACE', { archived: true }),
      make(6, 'UPPER_BODY'),
    ]);
    expect(queue.map((e) => e.id)).toEqual([4, 6, 3, 1]);
  });
});

describe('planSession', () => {
  const make = (id: number, category: Exercice['category'], extra: Partial<Exercice> = {}): Exercice => ({
    id,
    name: `ex${id}`,
    description: { text: '', comment: null },
    workout: { repeat: null, series: null, duration: null },
    equipments: [],
    bodyparts: [],
    category,
    completed: false,
    completedToday: false,
    completedAt: null,
    pinned: false,
    ...extra,
  });
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

  it('caps the session and keeps body order', () => {
    const all = Array.from({ length: 14 }, (_, i) =>
      make(i + 1, (['FACE', 'UPPER_BODY', 'CORE', 'LOWER_BODY', 'STRETCHING'] as const)[i % 5])
    );
    const plan = planSession(all, 5);
    expect(plan).toHaveLength(5);
    // one per zone, in body order
    expect(plan.map((e) => e.category)).toEqual(['FACE', 'UPPER_BODY', 'CORE', 'LOWER_BODY', 'STRETCHING']);
  });

  it('puts pinned first, then the least recently done', () => {
    const plan = planSession(
      [
        make(1, 'UPPER_BODY', { completedAt: daysAgo(1) }),
        make(2, 'UPPER_BODY', { completedAt: daysAgo(6) }),
        make(3, 'UPPER_BODY', { pinned: true, completedAt: daysAgo(0) }),
        make(4, 'UPPER_BODY'), // never done
      ],
      2
    );
    expect(plan.map((e) => e.id)).toEqual([3, 4]);
  });

  it('skips done, archived and excluded exercises', () => {
    const plan = planSession(
      [make(1, 'CORE', { completed: true }), make(2, 'CORE', { archived: true }), make(3, 'CORE'), make(4, 'CORE')],
      5,
      new Set([3])
    );
    expect(plan.map((e) => e.id)).toEqual([4]);
  });
});

describe('estimateMinutes', () => {
  const ex = (workout: Exercice['workout']) => ({ workout }) as Exercice;

  it('adds series, rest and transitions', () => {
    // 3 × 10 reps × 4 s = 120 s + 2 rests × 30 s + 20 s = 200 s → 3 min
    expect(estimateMinutes([ex({ series: '3', repeat: '10', duration: null })])).toBe(3);
    // 2 × 30 s + 30 s + 20 s = 110 s → 2 min
    expect(estimateMinutes([ex({ series: '2', repeat: null, duration: '30 secondes' })])).toBe(2);
  });

  it('never returns 0', () => {
    expect(estimateMinutes([])).toBe(1);
  });
});

describe('getTodayPlan', () => {
  const make = (id: number, extra: Partial<Exercice> = {}): Exercice => ({
    id, name: `ex${id}`, description: { text: '', comment: null },
    workout: { repeat: null, series: null, duration: null }, equipments: [], bodyparts: [],
    category: 'CORE', completed: false, completedToday: false, completedAt: null, pinned: false, ...extra,
  });

  it('daily: dose is 5 out of 14, minus what is done today', () => {
    const all = Array.from({ length: 14 }, (_, i) => make(i, i < 2 ? { completed: true, completedToday: true } : {}));
    expect(getTodayPlan(all)).toMatchObject({ dose: 5, doneToday: 2, remainingToday: 3, pending: 12 });
  });

  it('weekly: the dose shrinks when the week is almost done', () => {
    const all = [
      make(1, { completed: true }), make(2, { completed: true }), // done earlier this week
      make(3, { completed: true, completedToday: true }),
      make(4),
    ];
    expect(getTodayPlan(all)).toMatchObject({ dose: 2, doneToday: 1, remainingToday: 1, pending: 1 });
  });
});
