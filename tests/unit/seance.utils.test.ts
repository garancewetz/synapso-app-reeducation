import { describe, expect, it } from 'vitest';
import {
  buildSessionQueue,
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
